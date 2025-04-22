import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ml } from "./ml";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, 
  insertSaleSchema, 
  insertInventoryLogSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertSaleSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if product exists and has enough inventory
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.quantity < validatedData.quantity) {
        return res.status(400).json({ message: "Insufficient inventory" });
      }
      
      // Create sale record
      const sale = await storage.createSale(validatedData);
      
      // Create inventory log for this sale
      await storage.createInventoryLog({
        productId: validatedData.productId,
        type: "OUT",
        quantity: validatedData.quantity,
        reason: "Sale",
        userId: req.user.id
      });
      
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating sale" });
      }
    }
  });

  // Inventory log routes
  app.get("/api/inventory-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const logs = await storage.getInventoryLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching inventory logs" });
    }
  });

  app.get("/api/inventory-logs/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    try {
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent activity" });
    }
  });

  app.post("/api/inventory-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertInventoryLogSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if product exists
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Create inventory log
      const log = await storage.createInventoryLog(validatedData);
      
      // Update product quantity
      if (validatedData.type === "IN") {
        await storage.updateProduct(product.id, {
          quantity: product.quantity + validatedData.quantity
        });
      } else if (validatedData.type === "OUT") {
        if (product.quantity < validatedData.quantity) {
          return res.status(400).json({ message: "Insufficient inventory" });
        }
        
        await storage.updateProduct(product.id, {
          quantity: product.quantity - validatedData.quantity
        });
      } else if (validatedData.type === "ADJUSTMENT") {
        await storage.updateProduct(product.id, {
          quantity: product.quantity + validatedData.quantity // can be negative for reduction
        });
      }
      
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating inventory log" });
      }
    }
  });

  // Forecasting routes
  app.get("/api/forecasts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const forecasts = await storage.getForecasts();
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching forecasts" });
    }
  });

  app.post("/api/forecasts/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const days = req.body.days ? Number(req.body.days) : 7;
    
    try {
      const forecasts = await ml.forecastAllProducts(days);
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Error generating forecasts" });
    }
  });

  app.get("/api/forecasts/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const forecasts = await storage.getForecastsByProduct(productId);
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product forecasts" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getProducts();
      const sales = await storage.getSales();
      const lowStockProducts = await storage.getLowStockProducts();
      const recentActivity = await storage.getRecentActivityLogs(5);
      
      // Calculate total products
      const totalProducts = products.length;
      
      // Calculate total sales for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySales = sales.filter(sale => new Date(sale.date) >= today);
      const todaySalesAmount = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      // Calculate forecast accuracy
      // This is a simplified version. In a real system, you'd compare past forecasts with actual sales
      const forecastAccuracy = 94.2; // Placeholder - would be calculated from historical data
      
      res.json({
        totalProducts,
        lowStockCount: lowStockProducts.length,
        todaySalesAmount,
        forecastAccuracy,
        lowStockProducts,
        recentActivity
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard analytics" });
    }
  });

  // AI insights route
  app.get("/api/insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const insights = await ml.generateInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Error generating insights" });
    }
  });

  // Sales chart data route
  app.get("/api/analytics/sales-chart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const days = req.query.days ? Number(req.query.days) : 7;
    
    try {
      const sales = await storage.getSales();
      const chartData = [];
      
      // Generate data for each day in the period
      const endDate = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        // Filter sales for this day
        const daySales = sales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= date && saleDate < nextDate;
        });
        
        const totalAmount = daySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        
        chartData.push({
          date: date.toISOString().split('T')[0],
          amount: totalAmount
        });
      }
      
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ message: "Error generating sales chart data" });
    }
  });

  // Inventory health chart data
  app.get("/api/analytics/inventory-health", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getProducts();
      
      // Categorize products by stock level
      let healthy = 0;
      let warning = 0;
      let critical = 0;
      let overstock = 0;
      
      for (const product of products) {
        const ratio = product.quantity / product.minStock;
        
        if (ratio < 0.5) {
          critical++;
        } else if (ratio < 1) {
          warning++;
        } else if (ratio > 2) {
          overstock++;
        } else {
          healthy++;
        }
      }
      
      res.json([
        { name: "Healthy", value: healthy },
        { name: "Warning", value: warning },
        { name: "Critical", value: critical },
        { name: "Overstock", value: overstock }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Error generating inventory health data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
