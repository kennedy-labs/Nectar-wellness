import { BUSINESS_CONFIG } from '../config/constants.js';
import { Category, Order, PaymentSettings, Product } from '../types/index.js';
import { db, StoredAdminUser } from './db.js';
import { isPostgresReady, postgresDb } from './postgres.js';

export const repository = {
  // Synchronize memory cache with Neon at startup or refresh
  async syncFromPostgres(): Promise<void> {
    if (!isPostgresReady()) return;
    try {
      const [pgCategories, pgProducts, pgOrders, pgPin, pgAdminUser, pgPaymentSettings] = await Promise.all([
        postgresDb.getAllCategories(),
        postgresDb.getAllProducts(),
        postgresDb.getAllOrders(),
        postgresDb.getSetting('admin_pin'),
        postgresDb.getAdminUser(),
        postgresDb.getSetting('payment_settings'),
      ]);

      const localData = db.read();
      if (pgCategories.length > 0) localData.categories = pgCategories;
      if (pgProducts.length > 0) localData.products = pgProducts;
      if (pgOrders.length > 0) localData.orders = pgOrders;
      if (pgPin) localData.adminPin = pgPin;
      if (pgAdminUser) localData.adminUser = pgAdminUser;
      if (pgPaymentSettings) {
        try {
          const parsed = JSON.parse(pgPaymentSettings);
          if (parsed && typeof parsed === 'object') {
            localData.paymentSettings = {
              mpesaTill: String(parsed.mpesaTill || '').trim(),
              mpesaStoreName: String(parsed.mpesaStoreName || BUSINESS_CONFIG.mpesaStoreName).trim(),
            };
          }
        } catch {
          // Ignore malformed JSON setting
        }
      }
      db.write(localData);
      console.log('🔄 Repository synchronized from Neon PostgreSQL.');
    } catch (err: any) {
      console.warn('⚠️ Could not sync from Neon Postgres:', err.message);
    }
  },

  // Categories
  findAllCategories(): Category[] {
    return db.read().categories;
  },
  saveCategories(categories: Category[]): void {
    const data = db.read();
    data.categories = categories;
    db.write(data);
  },

  // Products
  findAllProducts(): Product[] {
    return db.read().products;
  },
  findProductById(id: string): Product | undefined {
    return db.read().products.find((p) => p.id === id);
  },
  findProductBySlug(slug: string): Product | undefined {
    return db.read().products.find((p) => p.slug === slug);
  },
  saveProduct(product: Product): Product {
    const data = db.read();
    const existingIndex = data.products.findIndex((p) => p.id === product.id);
    if (existingIndex >= 0) {
      data.products[existingIndex] = product;
    } else {
      data.products.push(product);
    }
    db.write(data);

    // Asynchronously persist to Neon PostgreSQL
    if (isPostgresReady()) {
      postgresDb.upsertProduct(product).catch((err) => {
        console.error('Failed to sync product to Neon:', err.message);
      });
    }

    return product;
  },
  deleteProduct(id: string): boolean {
    const data = db.read();
    const existingIndex = data.products.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      data.products.splice(existingIndex, 1);
      db.write(data);

      // Asynchronously delete from Neon PostgreSQL
      if (isPostgresReady()) {
        postgresDb.deleteProduct(id).catch((err) => {
          console.error('Failed to delete product from Neon:', err.message);
        });
      }

      return true;
    }
    return false;
  },

  // Orders
  findAllOrders(): Order[] {
    return db.read().orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  findOrderById(id: string): Order | undefined {
    return db.read().orders.find((o) => o.id === id || o.id === `NNW-${id}`);
  },
  findOrderByCheckoutRequestId(checkoutRequestId: string): Order | undefined {
    if (!checkoutRequestId) return undefined;
    return db.read().orders.find((o) => o.mpesaCheckoutRequestId === checkoutRequestId);
  },
  saveOrder(order: Order): Order {
    const data = db.read();
    const existingIndex = data.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      data.orders[existingIndex] = order;
    } else {
      data.orders.unshift(order);
    }
    db.write(data);

    // Asynchronously persist to Neon PostgreSQL
    if (isPostgresReady()) {
      postgresDb.upsertOrder(order).catch((err) => {
        console.error('Failed to sync order to Neon:', err.message);
      });
    }

    return order;
  },

  // Owner Admin PIN
  getAdminPin(): string | undefined {
    return db.read().adminPin;
  },
  async setAdminPin(pin: string): Promise<void> {
    const data = db.read();
    data.adminPin = pin;
    db.write(data);

    if (isPostgresReady()) {
      await postgresDb.setSetting('admin_pin', pin).catch((err) => {
        console.error('Failed to sync admin pin to Neon:', err.message);
      });
    }
  },

  // Owner Admin Account
  getAdminUser(): StoredAdminUser | null {
    return db.read().adminUser || null;
  },
  async saveAdminUser(user: StoredAdminUser): Promise<void> {
    const data = db.read();
    data.adminUser = user;
    db.write(data);

    if (isPostgresReady()) {
      await postgresDb.saveAdminUser(user).catch((err) => {
        console.error('Failed to sync admin user to Neon:', err.message);
      });
    }
  },

  // Runtime Payment & M-Pesa Till Settings
  getPaymentSettings(): PaymentSettings {
    const saved = db.read().paymentSettings;
    return {
      mpesaTill: (saved?.mpesaTill || '').trim(),
      mpesaStoreName: (saved?.mpesaStoreName || BUSINESS_CONFIG.mpesaStoreName).trim(),
    };
  },
  async savePaymentSettings(settings: PaymentSettings): Promise<PaymentSettings> {
    const cleaned: PaymentSettings = {
      mpesaTill: (settings.mpesaTill || '').trim(),
      mpesaStoreName: (settings.mpesaStoreName || BUSINESS_CONFIG.mpesaStoreName).trim(),
    };
    const data = db.read();
    data.paymentSettings = cleaned;
    db.write(data);

    if (isPostgresReady()) {
      await postgresDb.setSetting('payment_settings', JSON.stringify(cleaned)).catch((err) => {
        console.error('Failed to sync payment settings to Neon:', err.message);
      });
    }
    return cleaned;
  },
};
