import { Pool } from 'pg';
import { Category, Order, OrderItem, Product } from '../types/index.js';

let pool: Pool | null = null;
let isConnected = false;

export function getPostgresPool(): Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.warn('PostgreSQL pool background error (fallback available):', err.message);
    });

    return pool;
  } catch (err: any) {
    console.warn('Could not initialize PostgreSQL pool:', err.message);
    return null;
  }
}

export async function initPostgres(initialCategories: Category[], initialProducts: Product[]) {
  const p = getPostgresPool();
  if (!p) {
    console.log('ℹ️ No DATABASE_URL provided. Using local JSON repository.');
    return false;
  }

  try {
    const client = await p.connect();
    try {
      // 1. Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT
        );
      `);

      // 2. Create products table
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          benefits JSONB DEFAULT '[]'::jsonb,
          ingredients JSONB DEFAULT '[]'::jsonb,
          usage_instructions TEXT,
          price NUMERIC NOT NULL DEFAULT 0,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
          category_name VARCHAR(255),
          image TEXT,
          is_featured BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. Create orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(64) PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(64) NOT NULL,
          customer_email VARCHAR(255),
          delivery_method VARCHAR(64) NOT NULL,
          delivery_location TEXT NOT NULL,
          order_notes TEXT,
          subtotal NUMERIC NOT NULL DEFAULT 0,
          delivery_fee NUMERIC,
          total_amount NUMERIC NOT NULL DEFAULT 0,
          payment_method VARCHAR(64) NOT NULL,
          payment_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
          payment_reference VARCHAR(255),
          status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
          admin_notes TEXT,
          items JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Check if categories need initial seeding
      const catCountRes = await client.query('SELECT COUNT(*) FROM categories');
      if (parseInt(catCountRes.rows[0].count, 10) === 0 && initialCategories.length > 0) {
        for (const cat of initialCategories) {
          await client.query(
            'INSERT INTO categories (id, name, slug, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [cat.id, cat.name, cat.slug, cat.description || '']
          );
        }
        console.log(`🌿 Seeded ${initialCategories.length} categories to Neon PostgreSQL`);
      }

      // Check if products need initial seeding
      const prodCountRes = await client.query('SELECT COUNT(*) FROM products');
      if (parseInt(prodCountRes.rows[0].count, 10) === 0 && initialProducts.length > 0) {
        for (const prod of initialProducts) {
          await client.query(
            `INSERT INTO products (
              id, name, slug, description, benefits, ingredients, usage_instructions,
              price, stock_quantity, category_id, category_name, image, is_featured, is_active,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO NOTHING`,
            [
              prod.id,
              prod.name,
              prod.slug,
              prod.description,
              JSON.stringify(prod.benefits || []),
              JSON.stringify(prod.ingredients || []),
              prod.usageInstructions || '',
              prod.price,
              prod.stockQuantity,
              prod.categoryId,
              prod.categoryName,
              prod.image,
              prod.isFeatured,
              prod.isActive,
              prod.createdAt || new Date().toISOString(),
              prod.updatedAt || new Date().toISOString(),
            ]
          );
        }
        console.log(`🌿 Seeded ${initialProducts.length} remedies to Neon PostgreSQL`);
      }

      isConnected = true;
      console.log('✅ Connected to Neon PostgreSQL database successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('⚠️ Could not connect to Neon PostgreSQL, continuing with file database:', err.message);
    isConnected = false;
    return false;
  }
}

export function isPostgresReady(): boolean {
  return isConnected;
}

// -------------------------------------------------------------
// POSTGRESQL CRUD METHODS
// -------------------------------------------------------------

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    benefits: Array.isArray(row.benefits) ? row.benefits : typeof row.benefits === 'string' ? JSON.parse(row.benefits) : [],
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : [],
    usageInstructions: row.usage_instructions || '',
    price: Number(row.price) || 0,
    stockQuantity: Number(row.stock_quantity) || 0,
    categoryId: row.category_id,
    categoryName: row.category_name,
    image: row.image,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    deliveryMethod: row.delivery_method,
    deliveryLocation: row.delivery_location,
    orderNotes: row.order_notes || undefined,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: row.delivery_fee !== null ? Number(row.delivery_fee) : null,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference || undefined,
    status: row.status,
    adminNotes: row.admin_notes || undefined,
    items: Array.isArray(row.items) ? row.items : typeof row.items === 'string' ? JSON.parse(row.items) : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export const postgresDb = {
  async getAllProducts(): Promise<Product[]> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('SELECT * FROM products ORDER BY created_at DESC');
    return res.rows.map(rowToProduct);
  },

  async getProductById(id: string): Promise<Product | null> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0] ? rowToProduct(res.rows[0]) : null;
  },

  async upsertProduct(product: Product): Promise<Product> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const query = `
      INSERT INTO products (
        id, name, slug, description, benefits, ingredients, usage_instructions,
        price, stock_quantity, category_id, category_name, image, is_featured, is_active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        benefits = EXCLUDED.benefits,
        ingredients = EXCLUDED.ingredients,
        usage_instructions = EXCLUDED.usage_instructions,
        price = EXCLUDED.price,
        stock_quantity = EXCLUDED.stock_quantity,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        image = EXCLUDED.image,
        is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await p.query(query, [
      product.id,
      product.name,
      product.slug,
      product.description,
      JSON.stringify(product.benefits || []),
      JSON.stringify(product.ingredients || []),
      product.usageInstructions || '',
      product.price,
      product.stockQuantity,
      product.categoryId,
      product.categoryName,
      product.image,
      product.isFeatured,
      product.isActive,
      product.createdAt || new Date().toISOString(),
      new Date().toISOString(),
    ]);
    return rowToProduct(res.rows[0]);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async getAllCategories(): Promise<Category[]> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('SELECT * FROM categories ORDER BY name ASC');
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    }));
  },

  async getAllOrders(): Promise<Order[]> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.rows.map(rowToOrder);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const res = await p.query('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] ? rowToOrder(res.rows[0]) : null;
  },

  async upsertOrder(order: Order): Promise<Order> {
    const p = getPostgresPool();
    if (!p) throw new Error('Postgres not connected');
    const query = `
      INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, delivery_method,
        delivery_location, order_notes, subtotal, delivery_fee, total_amount,
        payment_method, payment_status, payment_reference, status, admin_notes,
        items, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone,
        customer_email = EXCLUDED.customer_email,
        delivery_method = EXCLUDED.delivery_method,
        delivery_location = EXCLUDED.delivery_location,
        order_notes = EXCLUDED.order_notes,
        subtotal = EXCLUDED.subtotal,
        delivery_fee = EXCLUDED.delivery_fee,
        total_amount = EXCLUDED.total_amount,
        payment_method = EXCLUDED.payment_method,
        payment_status = EXCLUDED.payment_status,
        payment_reference = EXCLUDED.payment_reference,
        status = EXCLUDED.status,
        admin_notes = EXCLUDED.admin_notes,
        items = EXCLUDED.items,
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await p.query(query, [
      order.id,
      order.customerName,
      order.customerPhone,
      order.customerEmail || null,
      order.deliveryMethod,
      order.deliveryLocation,
      order.orderNotes || null,
      order.subtotal,
      order.deliveryFee,
      order.totalAmount,
      order.paymentMethod,
      order.paymentStatus,
      order.paymentReference || null,
      order.status,
      order.adminNotes || null,
      JSON.stringify(order.items || []),
      order.createdAt || new Date().toISOString(),
      new Date().toISOString(),
    ]);
    return rowToOrder(res.rows[0]);
  },
};
