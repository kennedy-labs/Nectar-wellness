import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { repository } from './src/server/repository.js';
import { service } from './src/server/service.js';
import { initPostgres } from './src/server/postgres.js';
import { createAdminToken, verifyAdminToken } from './src/server/auth.js';
import { getMpesaConfig, initiateStkPush, queryStkPushStatus } from './src/server/mpesa.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function isAdminRequest(req: Request): boolean {
  return Boolean(verifyAdminToken(extractBearerToken(req)));
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Please sign in as admin.' });
  }
  next();
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
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
  app.get('/api/products', (req: Request, res: Response) => {
    try {
      const products = isAdminRequest(req)
        ? service.listAllProducts()
        : service.listActiveProducts();
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
    try {
      const product = service.createOrUpdateProduct(req.body);
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const product = service.createOrUpdateProduct({ ...req.body, id: req.params.id });
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const ok = repository.deleteProduct(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/products/:id/stock', requireAdmin, (req: Request, res: Response) => {
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
  app.get('/api/orders', requireAdmin, (_req: Request, res: Response) => {
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

  app.patch('/api/orders/:id/delivery-fee', requireAdmin, (req: Request, res: Response) => {
    try {
      const { deliveryFee, adminNotes } = req.body;
      const updated = service.updateDeliveryFee(req.params.id, Number(deliveryFee), adminNotes);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
    try {
      const { status, adminNotes } = req.body;
      const updated = service.updateOrderStatus(req.params.id, status, adminNotes);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/payment', requireAdmin, (req: Request, res: Response) => {
    try {
      const { paymentReference } = req.body || {};
      const updated = service.confirmPayment(req.params.id, paymentReference);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/orders/:id/payment/revert', requireAdmin, (req: Request, res: Response) => {
    try {
      const updated = service.revertPayment(req.params.id);
      if (!updated) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Safaricom Daraja M-Pesa Direct API Routes
  app.get('/api/mpesa/config', (_req: Request, res: Response) => {
    const cfg = getMpesaConfig();
    res.json({
      success: true,
      data: {
        enabled: cfg.enabled,
        till: cfg.till,
        storeName: cfg.storeName,
      },
    });
  });

  app.post('/api/mpesa/stkpush', async (req: Request, res: Response) => {
    try {
      const { orderId, phone } = req.body || {};
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required.' });
      }
      const order = repository.findOrderById(String(orderId).trim());
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }
      if (order.paymentStatus === 'CONFIRMED') {
        return res.status(400).json({ success: false, error: 'This order is already paid.' });
      }
      if (order.deliveryMethod !== 'PICKUP' && order.deliveryFee === null) {
        return res.status(400).json({
          success: false,
          error: 'Delivery fee is still awaiting confirmation before payment.',
        });
      }

      const protoHeader = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const proto = protoHeader.split(',')[0].trim();
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
      const requestOrigin = host ? `${proto}://${host}` : 'https://nectar-wellness.onrender.com';

      const stk = await initiateStkPush({
        orderId: order.id,
        phone: String(phone || order.customerPhone),
        amount: order.totalAmount,
        requestOrigin,
      });

      const updated = service.recordMpesaInitiation(
        order.id,
        stk.checkoutRequestId,
        stk.customerMessage
      );

      res.json({
        success: true,
        data: {
          order: updated,
          customerMessage: stk.customerMessage,
          phone: stk.formattedPhone,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not initiate M-Pesa prompt.' });
    }
  });

  app.post('/api/mpesa/query', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.body || {};
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required.' });
      }
      const order = repository.findOrderById(String(orderId).trim());
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }
      if (order.paymentStatus === 'CONFIRMED') {
        return res.json({ success: true, data: order });
      }
      if (!order.mpesaCheckoutRequestId) {
        return res.json({ success: true, data: order });
      }

      const result = await queryStkPushStatus(order.mpesaCheckoutRequestId);
      let updated: any = order;
      if (result.status === 'CONFIRMED') {
        updated = service.confirmPayment(order.id, order.paymentReference || 'MPESA_STK_VERIFIED');
      } else if (result.status === 'FAILED') {
        updated = service.recordMpesaResult(order.id, 'FAILED', result.resultDesc);
      }

      res.json({ success: true, data: updated || order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not verify payment status.' });
    }
  });

  app.post('/api/mpesa/callback', (req: Request, res: Response) => {
    const cfg = getMpesaConfig();
    if (cfg.callbackToken) {
      const provided = String(req.query.token || '');
      const expectedBuf = Buffer.from(cfg.callbackToken);
      const providedBuf = Buffer.from(provided);
      if (
        expectedBuf.length !== providedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        return res.status(403).json({ ResultCode: 1, ResultDesc: 'Forbidden' });
      }
    }

    try {
      const stkCallback = req.body?.Body?.stkCallback;
      const checkoutRequestId = stkCallback?.CheckoutRequestID;
      if (checkoutRequestId) {
        const order = repository.findOrderByCheckoutRequestId(String(checkoutRequestId));
        if (order && order.paymentStatus !== 'CONFIRMED') {
          const resultCode = Number(stkCallback.ResultCode);
          if (resultCode === 0) {
            const items: any[] = stkCallback?.CallbackMetadata?.Item || [];
            const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber');
            const amountItem = items.find((i) => i.Name === 'Amount');
            const receipt = receiptItem?.Value ? String(receiptItem.Value) : 'MPESA_CONFIRMED';
            const paidAmount = Number(amountItem?.Value ?? order.totalAmount);
            if (paidAmount >= Math.floor(order.totalAmount)) {
              service.confirmPayment(order.id, receipt);
            } else {
              service.recordMpesaResult(
                order.id,
                'FAILED',
                `Partial amount KSh ${paidAmount} received; expected KSh ${order.totalAmount}.`
              );
            }
          } else {
            service.recordMpesaResult(
              order.id,
              'FAILED',
              String(stkCallback?.ResultDesc || 'M-Pesa payment was cancelled or failed.')
            );
          }
        }
      }
    } catch (err: any) {
      console.error('M-Pesa callback processing error:', err?.message || err);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  });

  // Admin Auth & Credentials Routes
  app.get('/api/admin/setup-status', (_req: Request, res: Response) => {
    res.json({ success: true, data: service.getAdminSetupStatus() });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { phone, password } = req.body || {};
    const result = service.authenticateAdmin({ phone, password });
    if (result.success) {
      const token = createAdminToken(result.user?.id || 'default_owner');
      res.json({
        success: true,
        token,
        user: result.user,
      });
    } else {
      res.status(401).json({ success: false, error: result.error || 'Authentication failed' });
    }
  });

  app.post('/api/admin/change-password', requireAdmin, async (req: Request, res: Response) => {
    const { currentPassword, newPassword, newPhone, name } = req.body || {};
    const result = await service.updateAdminCredentials({
      currentPassword,
      newPassword,
      newPhone,
      name,
    });
    if (result.success) {
      res.json({ success: true, user: result.user, message: 'Admin credentials updated successfully' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  });

  app.get('/api/admin/security-status', (_req: Request, res: Response) => {
    res.json({ success: true, data: service.getAdminSetupStatus() });
  });

  app.post('/api/admin/payment-settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      const rawTill = String(req.body?.mpesaTill ?? '').trim();
      const rawStoreName = String(req.body?.mpesaStoreName ?? '').trim();

      if (rawTill && !/^\d{4,12}$/.test(rawTill)) {
        return res.status(400).json({
          success: false,
          error: 'M-Pesa Buy Goods Till must be 4 to 12 digits (or left blank until ready).',
        });
      }

      await repository.savePaymentSettings({
        mpesaTill: rawTill,
        mpesaStoreName: rawStoreName,
      });

      const cfg = getMpesaConfig();
      res.json({
        success: true,
        data: {
          enabled: cfg.enabled,
          till: cfg.till,
          storeName: cfg.storeName,
        },
        message: rawTill
          ? `M-Pesa Till ${cfg.till} saved successfully.`
          : 'M-Pesa Till cleared. Storefront will confirm payments via WhatsApp until added.',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err?.message || 'Failed to update M-Pesa payment settings.',
      });
    }
  });

  // Explicit SEO Routes
  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(robotsPath);
    } else {
      res.status(404).send('Robots not found');
    }
  });

  // Serve static asset folders directly (ensures images always load in dev & cloud deployments)
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'src/assets')));
  app.use('/images', express.static(path.resolve(__dirname, 'src/assets/images')));
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Dev mode: Mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
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
        execSync('npm run build || npx vite build', { stdio: 'inherit' });
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nature’s Nectar Wellness server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
