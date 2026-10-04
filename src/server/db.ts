import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../config/constants.js';
import { Category, Order, Product } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  orders: Order[];
  adminPin?: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: [
        {
          id: "NNW-1042",
          customerName: "Amina Wanjiku",
          customerPhone: "0722123456",
          customerEmail: "amina.w@example.com",
          deliveryMethod: "NAIROBI_LOCAL",
          deliveryLocation: "Kilimani, Dennis Pritt Rd, Apt 3A",
          orderNotes: "Please call when the rider arrives at the gate.",
          items: [
            {
              id: "item_1",
              productId: "prod_shilajit_gold",
              productName: "Pure Himalayan Shilajit Resin (Gold Grade)",
              productSlug: "pure-himalayan-shilajit-resin-gold-grade",
              productImage: "/src/assets/images/product_shilajit_resin_1790820595253.jpg",
              quantity: 1,
              priceAtPurchase: 3800,
            },
            {
              id: "item_2",
              productId: "prod_moringa_powder",
              productName: "Kilifi Raw Organic Moringa Leaf Powder",
              productSlug: "kilifi-raw-organic-moringa-leaf-powder",
              productImage: "/src/assets/images/product_moringa_powder_1790820605379.jpg",
              quantity: 1,
              priceAtPurchase: 950,
            }
          ],
          subtotal: 4750,
          deliveryFee: 300,
          totalAmount: 5050,
          paymentMethod: "MPESA_BUY_GOODS",
          paymentStatus: "CONFIRMED",
          paymentReference: "QJK8912P4",
          status: "PROCESSING",
          adminNotes: "Bolt rider dispatched, package verified with herbal usage guide.",
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

export const db = {
  read(): DatabaseSchema {
    try {
      ensureDataDir();
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {
        categories: INITIAL_CATEGORIES,
        products: INITIAL_PRODUCTS,
        orders: [],
      };
    }
  },

  write(data: DatabaseSchema): void {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database:', err);
    }
  },
};
