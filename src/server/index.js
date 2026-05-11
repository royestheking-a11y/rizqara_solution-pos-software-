import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import { Shop, User, Product, Category, Brand, Supplier } from './models/Core.js';
import { Customer, Sale, Purchase, Expense, StockMovement, Return } from './models/Transactions.js';
import { ActivityLog, Notification, SupportTicket, Register, HeldOrder, Package, Announcement, SystemSettings } from './models/Utility.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mapping collections to models
const models = {
  shops: Shop,
  users: User,
  products: Product,
  categories: Category,
  brands: Brand,
  suppliers: Supplier,
  customers: Customer,
  sales: Sale,
  purchases: Purchase,
  expenses: Expense,
  stockMovements: StockMovement,
  activityLogs: ActivityLog,
  notifications: Notification,
  supportTickets: SupportTicket,
  registers: Register,
  heldOrders: HeldOrder,
  packages: Package,
  returns: Return,
  announcements: Announcement,
  system_settings: SystemSettings
};

// Generic CRUD Routes
Object.entries(models).forEach(([key, Model]) => {
  // Get All
  app.get(`/api/${key}`, async (req, res) => {
    try {
      const items = await Model.find().lean();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  app.post(`/api/${key}`, async (req, res) => {
    try {
      const newItem = new Model(req.body);
      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update
  app.put(`/api/${key}/:id`, async (req, res) => {
    try {
      const updatedItem = await Model.findOneAndUpdate(
        { id: req.params.id },
        req.body,
        { new: true }
      );
      if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
      res.json(updatedItem);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete
  app.delete(`/api/${key}/:id`, async (req, res) => {
    try {
      const deletedItem = await Model.findOneAndDelete({ id: req.params.id });
      if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
      res.json({ message: 'Item deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// Special routes (e.g. bulk create for migration)
app.post('/api/bulk/:key', async (req, res) => {
  const { key } = req.params;
  const Model = models[key];
  if (!Model) return res.status(404).json({ error: 'Model not found' });
  
  try {
    const items = req.body;
    console.log(`Received bulk import request for ${key}: ${Array.isArray(items) ? items.length : 'not an array'} items`);
    
    if (Array.isArray(items) && items.length > 0) {
      // Clear existing if any? No, let's just insert
      await Model.insertMany(items, { ordered: false });
      console.log(`Successfully imported ${items.length} items to ${key}`);
      res.json({ message: `Bulk import to ${key} successful`, count: items.length });
    } else {
      res.json({ message: `No items to import for ${key}`, count: 0 });
    }
  } catch (err) {
    console.error(`Bulk import error for ${key}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'mongodb' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Self-ping logic for Render (prevents sleep)
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    console.log(`Self-pinging enabled for: ${RENDER_URL}`);
    setInterval(() => {
      const url = `${RENDER_URL}/api/health`;
      const protocol = url.startsWith('https') ? import('https') : import('http');
      
      protocol.then(mod => {
        mod.get(url, (res) => {
          console.log(`Self-ping status: ${res.statusCode}`);
        }).on('error', (err) => {
          console.error(`Self-ping error: ${err.message}`);
        });
      });
    }, 10 * 60 * 1000); // Every 10 minutes
  }
});
