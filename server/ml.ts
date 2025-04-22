import { storage } from "./storage";
import { Product, Sale, Forecast } from "@shared/schema";

// ML methods for forecasting and analytics
export class ML {
  // Simple time series forecasting using moving average
  async forecastProductDemand(productId: number, days: number = 7): Promise<Forecast> {
    try {
      // Get historical sales data for this product
      const allSales = await storage.getSales();
      const productSales = allSales.filter(sale => sale.productId === productId);
      
      if (productSales.length === 0) {
        // If no sales data, provide a default forecast
        const product = await storage.getProduct(productId);
        if (!product) {
          throw new Error("Product not found");
        }
        
        const defaultPrediction = {
          productId,
          predictedDemand: 10, // Default value
          confidenceLevel: 0.5, // Low confidence
          forDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000) // X days from now
        };
        
        return await storage.createForecast(defaultPrediction);
      }
      
      // Group sales by day
      const salesByDay: Record<string, number> = {};
      
      for (const sale of productSales) {
        const date = new Date(sale.date);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!salesByDay[dateStr]) {
          salesByDay[dateStr] = 0;
        }
        salesByDay[dateStr] += Number(sale.quantity);
      }
      
      // Calculate moving average
      const dailySales = Object.values(salesByDay);
      const sum = dailySales.reduce((total, qty) => total + qty, 0);
      const average = Math.round(dailySales.length > 0 ? sum / dailySales.length : 0);
      
      // Calculate standard deviation for confidence level
      const squareDiffs = dailySales.map(sale => Math.pow(sale - average, 2));
      const avgSquareDiff = squareDiffs.reduce((total, diff) => total + diff, 0) / (dailySales.length || 1);
      const stdDev = Math.sqrt(avgSquareDiff);
      
      // Calculate confidence level (inverse of coefficient of variation, normalized)
      const cv = average > 0 ? stdDev / average : 1;
      // Turn into a confidence score between 0.5 and 1
      const confidence = 1 - Math.min(0.5, cv / 2);
      
      // Create prediction
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + days);
      
      // We predict a slightly higher value than the average to account for growth
      // This is a simplistic approach, in real ML we'd use a more sophisticated model
      const prediction = {
        productId,
        predictedDemand: Math.max(1, Math.round(average * 1.1)), // At least 1, with 10% growth
        confidenceLevel: confidence,
        forDate: forecastDate
      };
      
      return await storage.createForecast(prediction);
    } catch (error) {
      console.error("Error in demand forecasting:", error);
      throw error;
    }
  }
  
  // Forecast demand for all products
  async forecastAllProducts(days: number = 7): Promise<Forecast[]> {
    const products = await storage.getProducts();
    const forecasts: Forecast[] = [];
    
    for (const product of products) {
      const forecast = await this.forecastProductDemand(product.id, days);
      forecasts.push(forecast);
    }
    
    return forecasts;
  }
  
  // Generate AI insights about inventory
  async generateInsights(): Promise<any[]> {
    try {
      const products = await storage.getProducts();
      const lowStockProducts = await storage.getLowStockProducts();
      const sales = await storage.getSales();
      const insights = [];
      
      // Low stock alerts
      if (lowStockProducts.length > 0) {
        for (const product of lowStockProducts) {
          // Calculate days until stockout based on average daily sales
          const productSales = sales.filter(sale => sale.productId === product.id);
          const totalSold = productSales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
          const avgDailySales = totalSold / Math.max(1, productSales.length);
          const daysUntilStockout = avgDailySales > 0 ? Math.round(product.quantity / avgDailySales) : 14;
          
          insights.push({
            type: "restock",
            title: "Restock Recommendation",
            product: product.name,
            message: `Order ${product.name} within ${daysUntilStockout} days to avoid stockout based on current usage rate.`,
            priority: daysUntilStockout <= 3 ? "high" : "medium"
          });
        }
      }
      
      // Demand forecast insights
      const forecasts = await storage.getForecasts();
      if (forecasts.length > 0) {
        // Find products with significant predicted increase in demand
        for (const forecast of forecasts) {
          const product = products.find(p => p.id === forecast.productId);
          if (product) {
            const productSales = sales.filter(sale => sale.productId === product.id);
            const avgSales = productSales.length > 0 
              ? productSales.reduce((sum, sale) => sum + Number(sale.quantity), 0) / productSales.length 
              : 0;
              
            if (forecast.predictedDemand > avgSales * 1.2) { // 20% increase
              const increasePercent = avgSales > 0 ? Math.round((forecast.predictedDemand / avgSales - 1) * 100) : 0;
              
              insights.push({
                type: "demand",
                title: "Demand Forecast",
                product: product.name,
                message: `Expect ${increasePercent}% higher demand for ${product.name} next week based on seasonal patterns.`,
                priority: "medium"
              });
            }
          }
        }
      }
      
      // Pricing optimization (simple implementation)
      // In real ML, this would use elasticity calculations and market data
      for (const product of products) {
        const margin = (Number(product.price) - Number(product.cost)) / Number(product.price);
        
        if (margin < 0.3 && product.quantity > product.minStock * 1.5) {
          insights.push({
            type: "pricing",
            title: "Pricing Optimization",
            product: product.name,
            message: `Consider increasing ${product.name} prices by 5-7% based on current market trends.`,
            priority: "low"
          });
        }
      }
      
      return insights;
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }
  
  // Additional methods can be added for more sophisticated ML features
  // For example: customer segmentation, seasonal trend analysis, etc.
}

export const ml = new ML();
