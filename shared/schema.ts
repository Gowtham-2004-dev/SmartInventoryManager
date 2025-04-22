import { pgTable, text, serial, integer, boolean, timestamp, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").default("Small Business"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  businessName: true,
  businessType: true,
});

// Products schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  description: true,
  category: true,
  price: true,
  cost: true,
  quantity: true,
  minStock: true,
  supplier: true,
});

// Sales schema
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow(),
  userId: integer("user_id").notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  productId: true,
  quantity: true,
  salePrice: true,
  totalAmount: true,
  userId: true,
});

// Inventory Logs (for tracking inventory changes)
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // IN, OUT, ADJUSTMENT
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  date: timestamp("date").defaultNow(),
  userId: integer("user_id").notNull(),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).pick({
  productId: true,
  type: true,
  quantity: true,
  reason: true,
  userId: true,
});

// ML Forecasts
export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  predictedDemand: integer("predicted_demand").notNull(),
  confidenceLevel: real("confidence_level").notNull(),
  forDate: timestamp("for_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForecastSchema = createInsertSchema(forecasts).pick({
  productId: true,
  predictedDemand: true,
  confidenceLevel: true,
  forDate: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;
