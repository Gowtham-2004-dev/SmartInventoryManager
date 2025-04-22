import { 
  User, InsertUser, Product, InsertProduct, 
  Sale, InsertSale, InventoryLog, InsertInventoryLog,
  Forecast, InsertForecast
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private inventoryLogs: Map<number, InventoryLog>;
  private forecasts: Map<number, Forecast>;
  private userIdCounter: number;
  private productIdCounter: number;
  private saleIdCounter: number;
  private inventoryLogIdCounter: number;
  private forecastIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.inventoryLogs = new Map();
    this.forecasts = new Map();
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.saleIdCounter = 1;
    this.inventoryLogIdCounter = 1;
    this.forecastIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clean expired sessions every day
    });
    
    // Add some sample data for development (will be removed in production)
    this.initSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: "admin", 
      businessType: insertUser.businessType || "Small Business",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.sku === sku
    );
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category === category
    );
  }

  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.quantity <= product.minStock
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSalesByDate(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      (sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      }
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.saleIdCounter++;
    const sale: Sale = {
      ...insertSale,
      id,
      date: new Date()
    };
    this.sales.set(id, sale);
    
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
    return this.inventoryLogs.get(id);
  }

  async getInventoryLogs(): Promise<InventoryLog[]> {
    return Array.from(this.inventoryLogs.values());
  }

  async getInventoryLogsByProduct(productId: number): Promise<InventoryLog[]> {
    return Array.from(this.inventoryLogs.values())
      .filter((log) => log.productId === productId);
  }

  async getRecentActivityLogs(limit: number): Promise<InventoryLog[]> {
    return Array.from(this.inventoryLogs.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createInventoryLog(insertLog: InsertInventoryLog): Promise<InventoryLog> {
    const id = this.inventoryLogIdCounter++;
    const log: InventoryLog = {
      ...insertLog,
      id,
      date: new Date()
    };
    this.inventoryLogs.set(id, log);
    return log;
  }

  // Forecast operations
  async getForecast(id: number): Promise<Forecast | undefined> {
    return this.forecasts.get(id);
  }

  async getForecasts(): Promise<Forecast[]> {
    return Array.from(this.forecasts.values());
  }

  async getForecastsByProduct(productId: number): Promise<Forecast[]> {
    return Array.from(this.forecasts.values())
      .filter((forecast) => forecast.productId === productId);
  }

  async createForecast(insertForecast: InsertForecast): Promise<Forecast> {
    const id = this.forecastIdCounter++;
    const forecast: Forecast = {
      ...insertForecast,
      id,
      createdAt: new Date()
    };
    this.forecasts.set(id, forecast);
    return forecast;
  }

  // Initialize some sample data for development
  private initSampleData() {
    // This is just for development purposes
    // Sample products will be added when a user is created
  }
}

export const storage = new MemStorage();
