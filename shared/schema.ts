import { pgTable, text, serial, integer, timestamp, real, decimal, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  phoneNumber: text("phone_number"),
  emailNotifications: integer("email_notifications").default(1), // 1 for enabled, 0 for disabled
  smsNotifications: integer("sms_notifications").default(0), // 0 for disabled, 1 for enabled
  lowStockAlerts: integer("low_stock_alerts").default(1),
  salesReports: integer("sales_reports").default(1),
  forecastAlerts: integer("forecast_alerts").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  businessName: true,
  businessType: true,
  phoneNumber: true,
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
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  productId: true,
  quantity: true,
  salePrice: true,
  totalAmount: true,
  userId: true,
});

// Suppliers schema
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  phoneNumber: true,
  email: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  status: true,
});

// Purchase Orders schema
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  status: text("status").default("pending"), // pending, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  supplierId: true, 
  expectedDeliveryDate: true,
  status: true,
  totalAmount: true,
  notes: true,
  userId: true,
});

// Purchase Order Items schema
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).pick({
  purchaseOrderId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
});

// Inventory Logs (for tracking inventory changes)
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // IN, OUT, ADJUSTMENT
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  date: timestamp("date").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  inventoryLogs: many(inventoryLogs),
  purchaseOrders: many(purchaseOrders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  sales: many(sales),
  inventoryLogs: many(inventoryLogs),
  forecasts: many(forecasts),
  purchaseOrderItems: many(purchaseOrderItems),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [inventoryLogs.userId],
    references: [users.id],
  }),
}));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  product: one(products, {
    fields: [forecasts.productId],
    references: [products.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

// Email settings schema
export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  smtpHost: text("smtp_host").default("smtp.gmail.com"),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  fromEmail: text("from_email"),
  fromName: text("from_name").default("SmartInventory"),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({ id: true });
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;
