# 🚀 Rizqara Solution - Enterprise POS System

**Rizqara Solution** is a professional-grade, offline-first Point of Sale (POS) ecosystem designed for high-standard retail operations. Built by **Rizqara Tech**, it combines the reliability of local software with the power of cloud synchronization.

---

## 🌟 Enterprise Features

### 📶 Offline-First & PWA
- **Work Anywhere**: Full functionality even without an active internet connection.
- **Background Sync**: Automatic outbox-based synchronization when back online.
- **Installable App**: Progressive Web App (PWA) support for desktop and mobile installation.
- **Smart Caching**: Service worker integration ensures zero-downtime reloads.

### 🇧🇩 Multi-Language Support
- **Full Localization**: Seamlessly switch between **English** and **Bengali (বাংলা)**.
- **Native Experience**: Interface tailored for local shopkeepers and staff.
- **Dynamic Translation**: Instant UI updates across all modules without page refresh.

### ⚡ Real-Time Synchronization
- **Live Inventory**: Instant stock updates across all connected cash registers via **Socket.io**.
- **Collaborative Sales**: Cashiers see new sales and invoices from colleagues in real-time.
- **Global Updates**: System-wide notifications and maintenance alerts pushed instantly.

### 🛡️ Security & Reliability
- **Data Protection**: 256-bit SSL encryption and GDPR-compliant data handling.
- **Encrypted Storage**: Sensitive business data is encrypted at rest and in transit.
- **Production Hardening**: Self-ping architecture to ensure 100% backend uptime on cloud providers.
- **Maintenance Mode**: Global toggle for Super Admins to lock the system for essential updates.

### 📊 Business Intelligence
- **Deep Analytics**: Real-time revenue, profit, and expense visualization.
- **Recent Transactions**: Live feed of sales activity with status tracking.
- **Multi-Tenant Architecture**: Manage hundreds of independent shops with tiered subscription control.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Real-Time**: Socket.io (WebSockets)
- **Offline**: VitePWA, LocalStorage Outbox Sync
- **Backend**: Node.js, Express (ES Modules)
- **Database**: MongoDB Atlas
- **Icons**: Lucide React
- **Notifications**: Sonner (Rich Toast System)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Git

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/royestheking-a11y/rizqara_solution-pos-software-.git
   cd rizqara_solution-pos-software-
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file:
   ```env
   MONGODB_URI=your_connection_string
   PORT=5001
   VITE_API_URL=http://localhost:5001
   ```

3. **Database Initialization**
   ```bash
   # Seed production-ready demo data (MAXWEAR)
   node src/server/seed.js
   ```

### Execution

**Developer Mode:**
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

**Production Build:**
```bash
npm run build
npm run preview
```

---

## 🏢 About Rizqara Tech
Rizqara Tech is an Advanced Agentic Coding firm specializing in premium digital transformations. We build software that doesn't just work—it excels.

---

© 2026 **Rizqara Tech**. All Rights Reserved.  
*Precision Engineered for Modern Commerce.*