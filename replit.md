# SmartInventory – Kirana Store Management System

## Overview
A full-stack inventory management system tailored for Indian kirana (local grocery) stores. Features include INR pricing, Indian product catalog (81 products), 14 Indian suppliers, sales trend charts, ML demand forecasting, SMS notifications via Twilio, and email order notifications to suppliers.

## Architecture
- **Frontend**: React + Vite + TypeScript, shadcn/ui, TailwindCSS, Recharts, TanStack Query, Wouter routing
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: Passport.js (session-based)
- **Email**: Nodemailer (SMTP – user-configurable in Settings)
- **SMS**: Twilio (env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)

## Key Features
- Dashboard with 4 stat cards: Total Items, Low Stock, Today's Sales, Monthly Revenue
- Sales trend chart (10-day area + day-over-day variation line)
- Inventory health donut chart (Critical/Warning/Healthy/Overstock)
- AI Insights (restock recommendations, demand spikes, pricing opportunities)
- Low Stock table with "Order Now" button → email dialog → sends purchase order to supplier
- ML demand forecasting (7-day forward, only products with sales data)
- Supplier management with email addresses
- SMS low-stock alerts and sales summaries via Twilio
- Settings: profile, notifications, email SMTP credentials, preferences

## Database Notes
- `npm run db:push` times out — use `executeSql` in code_execution to run raw SQL instead
- 8 tables: users, products, suppliers, sales, purchase_orders, purchase_order_items, inventory_logs, forecasts, email_settings
- 81 Indian products (Tata, Amul, Parle, MDH, Haldiram, Britannia, etc.)
- 14 Indian suppliers (Metro, Reliance, HUL, ITC, Nestlé, Britannia, Parle, Mother Dairy, Dabur, PepsiCo, Marico, D-Mart, Big Bazaar)
- 17 low-stock products (reduced for realistic alerts)
- 130 sales records (March 4–14, 2026)
- 100 forecast records (top 10 products, March 15–24)

## INR Currency
- All prices in Indian Rupees (₹), formatted with `en-IN` locale, no decimal places

## Email Order Flow
1. User clicks "Order Now" on a low-stock product in the dashboard
2. Dialog opens: choose quantity + optional notes
3. On confirm → POST /api/orders/place → server finds supplier email from product.supplier field
4. Email sent via Nodemailer using SMTP credentials from Settings > Email (SMTP) tab
5. Professionally formatted HTML email with product, SKU, quantity, business name

## File Structure
- `shared/schema.ts` — all DB schemas and types
- `server/routes.ts` — all API routes
- `server/storage.ts` — storage interface and implementation
- `server/ml.ts` — ML forecasting engine
- `server/email.ts` — Nodemailer email service
- `server/notifications.ts` — Twilio SMS service
- `client/src/pages/` — all page components (dashboard, inventory, sales, forecasting, suppliers, settings)
- `client/src/components/dashboard/` — stat-card, sales-chart, inventory-health-chart, ai-insights, low-stock-table, recent-activity-table
