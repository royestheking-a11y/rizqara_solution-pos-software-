# 🚀 Rizqara Solution - Premium POS System

**Rizqara Solution** is a state-of-the-art, cloud-integrated Point of Sale (POS) software designed for modern retail businesses. It is a flagship product of **Rizqara Tech**, built to streamline sales, inventory management, and business analytics.

## 🌟 Key Features
- **Cloud-Synced Architecture**: Powered by **MongoDB**, ensuring your data is accessible from anywhere while maintaining local speed.
- **Smart Inventory Management**: Track products, variants (size/color), and low-stock alerts in real-time.
- **Advanced POS Interface**: Optimized for speed with barcode support, invoice generation, and WhatsApp integration.
- **Comprehensive Reporting**: Daily, monthly, and yearly reports for revenue, profit, and expenses.
- **Multi-tenant Support**: Manage multiple shops under a single platform with tiered subscription packages.
- **Customer Loyalty System**: Built-in point-based loyalty rewards to keep your customers coming back.
- **Staff Management**: Role-based access control for Owners, Managers, and Cashiers.

## 🛠️ Technology Stack
- **Frontend**: React.js with TypeScript & Tailwind CSS
- **Backend**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB Atlas (Primary Cloud Storage)
- **State Management**: Optimized Local-First with Hybrid Cloud Sync
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Connection String

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root and add:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   ```

3. Seed the database (Optional - for demo data):
   ```bash
   node src/server/seed.js
   ```

### Running the App
Start the backend server:
```bash
npm run server
```

Start the frontend development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5180`.

## 🏢 About Rizqara Tech
Rizqara Tech is committed to providing high-standard digital solutions for businesses. **Rizqara Solution** represents our dedication to quality, efficiency, and modern engineering.

---
© 2026 **Rizqara Tech**. All Rights Reserved.