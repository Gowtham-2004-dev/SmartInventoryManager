import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "smart-inventory-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create some initial products for the user
      await createInitialProducts(user.id);

      req.login(user, (err) => {
        if (err) return next(err);
        // Remove the password before sending the user back
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Remove the password before sending the user back
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove the password before sending the user back
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}

// Function to create initial products for new users
async function createInitialProducts(userId: number) {
  const initialProducts = [
    {
      name: "Arabica Coffee",
      sku: "COF-ARA-500",
      description: "Premium Arabica coffee beans, 500g bag",
      category: "Coffee",
      price: "15.99",
      cost: "8.50",
      quantity: 5,
      minStock: 10,
      supplier: "Global Coffee Imports"
    },
    {
      name: "Caramel Syrup",
      sku: "SYR-CAR-750",
      description: "Caramel flavoring syrup, 750ml bottle",
      category: "Syrups",
      price: "9.99",
      cost: "4.75",
      quantity: 12,
      minStock: 15,
      supplier: "Flavor Solutions Inc."
    },
    {
      name: "Green Tea",
      sku: "TEA-GRN-250",
      description: "Organic green tea leaves, 250g package",
      category: "Tea",
      price: "12.50",
      cost: "6.25",
      quantity: 8,
      minStock: 10,
      supplier: "Organic Tea Traders"
    },
    {
      name: "Vanilla Syrup",
      sku: "SYR-VAN-750",
      description: "Vanilla flavoring syrup, 750ml bottle",
      category: "Syrups",
      price: "9.99",
      cost: "4.75",
      quantity: 50,
      minStock: 15,
      supplier: "Flavor Solutions Inc."
    },
    {
      name: "Organic Honey",
      sku: "HON-ORG-500",
      description: "Raw organic honey, 500g jar",
      category: "Sweeteners",
      price: "8.75",
      cost: "4.50",
      quantity: 25,
      minStock: 10,
      supplier: "Local Organic Farms"
    },
    {
      name: "Colombian Coffee",
      sku: "COF-COL-500",
      description: "Medium roast Colombian coffee, 500g bag",
      category: "Coffee",
      price: "14.50",
      cost: "7.25",
      quantity: 18,
      minStock: 10,
      supplier: "Global Coffee Imports"
    },
    {
      name: "Almond Milk",
      sku: "MLK-ALM-1L",
      description: "Unsweetened almond milk, 1L carton",
      category: "Milk",
      price: "4.99",
      cost: "2.80",
      quantity: 15,
      minStock: 20,
      supplier: "Plant Based Foods Co."
    }
  ];

  // Add products
  for (const product of initialProducts) {
    await storage.createProduct(product);
  }

  // Add some sample inventory logs
  const logs = [
    { productId: 1, type: "IN", quantity: 10, reason: "Initial stock", userId },
    { productId: 1, type: "OUT", quantity: 5, reason: "Sales", userId },
    { productId: 4, type: "IN", quantity: 50, reason: "Resupply", userId },
    { productId: 7, type: "OUT", quantity: 5, reason: "Expired", userId }
  ];

  for (const log of logs) {
    await storage.createInventoryLog(log);
  }

  // Add some sample sales
  const sales = [
    { productId: 1, quantity: 2, salePrice: "15.99", totalAmount: "31.98", userId },
    { productId: 3, quantity: 1, salePrice: "12.50", totalAmount: "12.50", userId },
    { productId: 5, quantity: 3, salePrice: "8.75", totalAmount: "26.25", userId }
  ];

  for (const sale of sales) {
    await storage.createSale(sale);
  }

  // Add forecasts
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const forecasts = [
    { productId: 1, predictedDemand: 20, confidenceLevel: 0.85, forDate: nextWeek },
    { productId: 2, predictedDemand: 25, confidenceLevel: 0.78, forDate: nextWeek },
    { productId: 3, predictedDemand: 15, confidenceLevel: 0.92, forDate: nextWeek }
  ];

  for (const forecast of forecasts) {
    await storage.createForecast(forecast);
  }
}
