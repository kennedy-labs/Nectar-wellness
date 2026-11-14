import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../config/constants.js';
import { Category, Order, Product } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredAdminUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  passwordHash: string;
  role: 'owner';
  claimedAt: string;
}

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  orders: Order[];
  adminPin?: string;
  adminUser?: StoredAdminUser | null;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: [],
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
