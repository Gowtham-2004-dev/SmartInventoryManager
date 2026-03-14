import { storage } from "./storage";
import { Forecast } from "@shared/schema";
import { db } from "./db";
import { forecasts as forecastsTable } from "@shared/schema";

export class ML {
  async forecastProductDemand(productId: number, days: number = 7): Promise<Forecast[]> {
    try {
      const allSales = await storage.getSales();
      const productSales = allSales.filter(sale => sale.productId === productId);

      let baseAvg = 10;
      let confidence = 0.60;

      if (productSales.length > 0) {
        const salesByDay: Record<string, number> = {};
        for (const sale of productSales) {
          const dateStr = new Date(sale.date!).toISOString().split("T")[0];
          salesByDay[dateStr] = (salesByDay[dateStr] || 0) + Number(sale.quantity);
        }
        const dailySales = Object.values(salesByDay);
        const sum = dailySales.reduce((a, b) => a + b, 0);
        baseAvg = sum / dailySales.length;
        const squareDiffs = dailySales.map(s => Math.pow(s - baseAvg, 2));
        const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / dailySales.length);
        const cv = baseAvg > 0 ? stdDev / baseAvg : 1;
        confidence = 1 - Math.min(0.4, cv / 2);
      }

      const results: Forecast[] = [];
      for (let d = 1; d <= days; d++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + d);
        const dayFactor = 1 + Math.sin(d * 0.9) * 0.18;
        const predicted = Math.max(1, Math.round(baseAvg * 1.1 * dayFactor));

        const forecast = await storage.createForecast({
          productId,
          predictedDemand: predicted,
          confidenceLevel: Math.min(0.97, confidence - d * 0.01),
          forDate: forecastDate,
        });
        results.push(forecast);
      }
      return results;
    } catch (error) {
      console.error("Error forecasting product", productId, error);
      return [];
    }
  }

  async forecastAllProducts(days: number = 7): Promise<Forecast[]> {
    // Clear all existing forecasts first to avoid duplicates
    await db.delete(forecastsTable);

    const allSales = await storage.getSales();
    // Only forecast products that have actual sales data
    const productIdsWithSales = [...new Set(allSales.map(s => s.productId))];

    // Fallback to top 20 products if no sales
    let productIds = productIdsWithSales;
    if (productIds.length === 0) {
      const products = await storage.getProducts();
      productIds = products.slice(0, 20).map(p => p.id);
    }

    const allForecasts: Forecast[] = [];
    for (const productId of productIds) {
      const forecasts = await this.forecastProductDemand(productId, days);
      allForecasts.push(...forecasts);
    }
    return allForecasts;
  }

  async generateInsights(): Promise<any[]> {
    try {
      const products = await storage.getProducts();
      const lowStockProducts = await storage.getLowStockProducts();
      const sales = await storage.getSales();
      const insights: any[] = [];

      for (const product of lowStockProducts.slice(0, 6)) {
        const productSales = sales.filter(s => s.productId === product.id);
        const totalSold = productSales.reduce((sum, s) => sum + Number(s.quantity), 0);
        const avgDailySales = productSales.length > 0 ? totalSold / productSales.length : 1;
        const daysUntilStockout = Math.round(product.quantity / avgDailySales);

        insights.push({
          type: "restock",
          title: "Restock Recommendation",
          product: product.name,
          message: `Order ${product.name} within ${daysUntilStockout} day${daysUntilStockout === 1 ? "" : "s"} to avoid stockout based on current usage.`,
          priority: daysUntilStockout <= 3 ? "high" : "medium",
        });
      }

      const forecastData = await storage.getForecasts();
      const productForecasts: Record<number, number[]> = {};
      for (const f of forecastData) {
        if (!productForecasts[f.productId]) productForecasts[f.productId] = [];
        productForecasts[f.productId].push(f.predictedDemand);
      }

      for (const [productIdStr, demands] of Object.entries(productForecasts)) {
        const productId = Number(productIdStr);
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        const avgForecast = demands.reduce((a, b) => a + b, 0) / demands.length;
        const productSales = sales.filter(s => s.productId === productId);
        const avgSales = productSales.length > 0
          ? productSales.reduce((sum, s) => sum + Number(s.quantity), 0) / productSales.length
          : 0;

        if (avgForecast > avgSales * 1.2 && insights.filter(i => i.type === "demand").length < 4) {
          const pct = avgSales > 0 ? Math.round((avgForecast / avgSales - 1) * 100) : 10;
          insights.push({
            type: "demand",
            title: "Demand Spike Forecast",
            product: product.name,
            message: `Expect ${pct}% higher demand for ${product.name} next week based on seasonal trends.`,
            priority: "medium",
          });
        }
      }

      for (const product of products) {
        if (insights.filter(i => i.type === "pricing").length >= 3) break;
        const margin = (Number(product.price) - Number(product.cost)) / Number(product.price);
        if (margin < 0.3 && product.quantity > product.minStock * 1.5) {
          insights.push({
            type: "pricing",
            title: "Pricing Opportunity",
            product: product.name,
            message: `Consider raising ${product.name} price by 5–8% — margin is below 30% with healthy stock levels.`,
            priority: "low",
          });
        }
      }

      return insights.slice(0, 8);
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }
}

export const ml = new ML();
