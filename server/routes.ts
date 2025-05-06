import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ml } from "./ml";
import { notifications } from "./notifications";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, 
  insertSaleSchema, 
  insertInventoryLogSchema 
} from "@shared/schema";

// Helper function to get user ID from req.user (passport user)
function getUserId(req: Request): number {
  return (req.user as any)?.id;
}

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
      // Get the user ID - req.user is from the passport session
      const userId = (req.user as any).id;
      
      const validatedData = insertSaleSchema.parse({
        ...req.body,
        userId
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
        userId: userId
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
      const userId = getUserId(req);
      
      const validatedData = insertInventoryLogSchema.parse({
        ...req.body,
        userId
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

  // Notification routes
  app.get("/api/user/notification-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const settings = {
        phoneNumber: user.phoneNumber || "",
        emailNotifications: user.emailNotifications === 1,
        smsNotifications: user.smsNotifications === 1,
        lowStockAlerts: user.lowStockAlerts === 1,
        salesReports: user.salesReports === 1,
        forecastAlerts: user.forecastAlerts === 1
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notification settings" });
    }
  });
  
  app.put("/api/user/notification-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const schema = z.object({
        phoneNumber: z.string().optional(),
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        lowStockAlerts: z.boolean().optional(),
        salesReports: z.boolean().optional(),
        forecastAlerts: z.boolean().optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      // Convert boolean values to integers for database storage
      const updates: Record<string, any> = {};
      
      if (validatedData.phoneNumber !== undefined) {
        updates.phoneNumber = validatedData.phoneNumber;
      }
      
      if (validatedData.emailNotifications !== undefined) {
        updates.emailNotifications = validatedData.emailNotifications ? 1 : 0;
      }
      
      if (validatedData.smsNotifications !== undefined) {
        updates.smsNotifications = validatedData.smsNotifications ? 1 : 0;
      }
      
      if (validatedData.lowStockAlerts !== undefined) {
        updates.lowStockAlerts = validatedData.lowStockAlerts ? 1 : 0;
      }
      
      if (validatedData.salesReports !== undefined) {
        updates.salesReports = validatedData.salesReports ? 1 : 0;
      }
      
      if (validatedData.forecastAlerts !== undefined) {
        updates.forecastAlerts = validatedData.forecastAlerts ? 1 : 0;
      }
      
      const userId = getUserId(req);
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        phoneNumber: updatedUser.phoneNumber || "",
        emailNotifications: updatedUser.emailNotifications === 1,
        smsNotifications: updatedUser.smsNotifications === 1,
        lowStockAlerts: updatedUser.lowStockAlerts === 1,
        salesReports: updatedUser.salesReports === 1,
        forecastAlerts: updatedUser.forecastAlerts === 1
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notification settings", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating notification settings" });
      }
    }
  });
  
  // SMS test route
  app.post("/api/notifications/test-sms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.phoneNumber) {
        return res.status(400).json({ 
          message: "Phone number not configured. Please update your profile with a valid phone number."
        });
      }
      
      // Send a test message
      const success = await notifications.sendSMS(
        user.id, 
        "🔔 This is a test notification from SmartInventory. Your SMS notifications are working correctly!"
      );
      
      if (success) {
        res.json({ message: "Test SMS sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test SMS" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error sending test SMS" });
    }
  });

  // Integration with low stock alerts
  app.post("/api/notifications/low-stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || !user.smsNotifications || !user.lowStockAlerts) {
        return res.status(400).json({ message: "SMS notifications or low stock alerts are disabled" });
      }
      
      const lowStockProducts = await storage.getLowStockProducts();
      
      if (lowStockProducts.length === 0) {
        return res.json({ message: "No low stock products to notify about" });
      }
      
      // Limit to the first 5 products to avoid long messages
      const productsToNotify = lowStockProducts.slice(0, 5);
      let successCount = 0;
      
      for (const product of productsToNotify) {
        const success = await notifications.sendLowStockAlert(
          user.id,
          product.name,
          product.quantity
        );
        
        if (success) {
          successCount++;
        }
      }
      
      res.json({ 
        message: `Sent ${successCount} out of ${productsToNotify.length} low stock notifications` 
      });
    } catch (error) {
      res.status(500).json({ message: "Error sending low stock notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
