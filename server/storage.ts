import { 
  User, InsertUser, Product, InsertProduct, 
  Sale, InsertSale, InventoryLog, InsertInventoryLog,
  Forecast, InsertForecast, users, products, sales, 
  inventoryLogs, forecasts
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, lte, desc, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Sale operations
  getSale(id: number): Promise<Sale | undefined>;
  getSales(): Promise<Sale[]>;
  getSalesByDate(startDate: Date, endDate: Date): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  
  // Inventory Log operations
  getInventoryLog(id: number): Promise<InventoryLog | undefined>;
  getInventoryLogs(): Promise<InventoryLog[]>;
  getInventoryLogsByProduct(productId: number): Promise<InventoryLog[]>;
  getRecentActivityLogs(limit: number): Promise<InventoryLog[]>;
  createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;
  
  // Forecast operations
  getForecast(id: number): Promise<Forecast | undefined>;
  getForecasts(): Promise<Forecast[]>;
  getForecastsByProduct(productId: number): Promise<Forecast[]>;
  createForecast(forecast: InsertForecast): Promise<Forecast>;
  
  // Session store
  sessionStore: any; // Store from express-session
}

// PostgreSQL implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async getLowStockProducts(): Promise<Product[]> {
    // Find products where quantity is less than or equal to minStock
    return await db.select().from(products).where(
      lte(products.quantity, products.minStock)
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const updateWith = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedProduct] = await db
      .update(products)
      .set(updateWith)
      .where(eq(products.id, id))
      .returning();
      
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    // Check if product still exists to determine if delete was successful
    const product = await this.getProduct(id);
    return product === undefined;
  }

  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales);
  }

  async getSalesByDate(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db.select().from(sales).where(
      and(
        lte(sales.date, sql`${endDate}`),
        sql`${startDate} <= ${sales.date}`
      )
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const [sale] = await db.insert(sales).values(insertSale).returning();
    
    // Update product quantity
    const product = await this.getProduct(insertSale.productId);
    if (product) {
      await this.updateProduct(product.id, {
        quantity: product.quantity - insertSale.quantity
      });
    }
    
    return sale;
  }

  // Inventory Log operations
  async getInventoryLog(id: number): Promise<InventoryLog | undefined> {
    const [log] = await db.select().from(inventoryLogs).where(eq(inventoryLogs.id, id));
    return log;
  }

  async getInventoryLogs(): Promise<InventoryLog[]> {
    return await db.select().from(inventoryLogs);
  }

  async getInventoryLogsByProduct(productId: number): Promise<InventoryLog[]> {
    return await db.select().from(inventoryLogs).where(eq(inventoryLogs.productId, productId));
  }

  async getRecentActivityLogs(limit: number): Promise<InventoryLog[]> {
    return await db.select().from(inventoryLogs).orderBy(desc(inventoryLogs.date)).limit(limit);
  }

  async createInventoryLog(insertLog: InsertInventoryLog): Promise<InventoryLog> {
    const [log] = await db.insert(inventoryLogs).values(insertLog).returning();
    return log;
  }

  // Forecast operations
  async getForecast(id: number): Promise<Forecast | undefined> {
    const [forecast] = await db.select().from(forecasts).where(eq(forecasts.id, id));
    return forecast;
  }

  async getForecasts(): Promise<Forecast[]> {
    return await db.select().from(forecasts);
  }

  async getForecastsByProduct(productId: number): Promise<Forecast[]> {
    return await db.select().from(forecasts).where(eq(forecasts.productId, productId));
  }

  async createForecast(insertForecast: InsertForecast): Promise<Forecast> {
    const [forecast] = await db.insert(forecasts).values(insertForecast).returning();
    return forecast;
  }
}

export const storage = new DatabaseStorage();
