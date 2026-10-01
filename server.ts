import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { repository } from './src/server/repository.js';
import { service } from './src/server/service.js';
import { initPostgres } from './src/server/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Initialize and sync with Neon PostgreSQL if configured
  try {
    const initialCats = repository.findAllCategories();
    const initialProds = repository.findAllProducts();
    await initPostgres(initialCats, initialProds);
    await repository.syncFromPostgres();
  } catch (err: any) {
    console.warn('PostgreSQL initialization skipped/failed:', err.message);
  }

  app.use(express.json());

  // Products API
  app.get('/api/products', (_req: Request, res: Response) => {
    try {
      const products = service.listAllProducts();
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const product = service.createOrUpdateProduct(req.body);
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    try {
      const product = service.createOrUpdateProduct({ ...req.body, id: req.params.id });
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    try {
      const ok = repository.deleteProduct(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/products/:id/stock', (req: Request, res: Response) => {
    try {
      const { stockQuantity } = req.body;
      const updated = service.updateStock(req.params.id, Number(stockQuantity));
      if (!updated) return res.status(404).json({ success: false, error: 'Product not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Categories API
  app.get('/api/categories', (_req: Request, res: Response) => {
    try {
      const categories = repository.findAllCategories();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Orders API
  app.get('/api/orders', (_req: Request, res: Response) => {
    try {
      const orders = repository.findAllOrders();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    try {
      const order = repository.findOrderById(req.params.id);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const order = service.createOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/delivery-fee', (req: Request, res: Response) => {
    try {
      const { deliveryFee, adminNotes } = req.body;
      const updated = service.updateDeliveryFee(req.params.id, Number(deliveryFee), adminNotes);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { status, adminNotes } = req.body;
      const updated = service.updateOrderStatus(req.params.id, status, adminNotes);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/payment', (req: Request, res: Response) => {
    try {
      const { paymentReference } = req.body;
      if (!paymentReference) {
        return res.status(400).json({ success: false, error: 'Payment reference is required' });
      }
      const updated = service.confirmPayment(req.params.id, paymentReference);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Admin Auth Verification
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (service.verifyAdminPin(pin)) {
      res.json({ success: true, token: 'nnw_owner_session_' + Date.now() });
    } else {
      res.status(401).json({ success: false, error: 'Invalid Admin PIN' });
    }
  });

  // Dev mode: Mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: verify dist folder exists or build it
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log('📦 Client bundle not found. Building with Vite for production...');
      try {
        execSync('npm run build || bun run build || npx vite build', { stdio: 'inherit' });
      } catch (buildErr: any) {
        console.error('Failed to auto-build client bundle:', buildErr.message);
      }
    }

    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Client build is processing. Please refresh in a few moments.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nature’s Nectar Wellness server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
