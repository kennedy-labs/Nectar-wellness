import { Category, Order, Product } from '../types/index.js';
import { db } from './db.js';

export const repository = {
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
    return product;
  },
  deleteProduct(id: string): boolean {
    const data = db.read();
    const existingIndex = data.products.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      // Soft deactivate
      data.products[existingIndex].isActive = false;
      data.products[existingIndex].updatedAt = new Date().toISOString();
      db.write(data);
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
  saveOrder(order: Order): Order {
    const data = db.read();
    const existingIndex = data.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      data.orders[existingIndex] = order;
    } else {
      data.orders.unshift(order);
    }
    db.write(data);
    return order;
  },
};
