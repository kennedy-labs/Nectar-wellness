import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../config/constants';
import { AdminUser, CartItem, Category, Order, Product } from '../types';

const STORAGE_KEYS = {
  CART: 'nnw_cart_v1',
  PRODUCTS: 'nnw_products_v1',
  CATEGORIES: 'nnw_categories_v1',
  ORDERS: 'nnw_orders_v1',
  ADMIN_AUTH: 'nnw_admin_auth_v1',
  ADMIN_TOKEN: 'nnw_admin_token_v1',
  ADMIN_USER: 'nnw_admin_user_v1',
  LAST_ORDER_ID: 'nnw_last_order_id_v1',
};

const DEMO_ORDERS: Order[] = [];

export const storage = {
  // Cart
  getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  },
  clearCart(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CART);
    } catch (e) {
      console.error(e);
    }
  },

  // Products
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
      // seed initial
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },
  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  },

  // Categories
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  },

  // Orders
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEMO_ORDERS));
      return DEMO_ORDERS;
    } catch {
      return DEMO_ORDERS;
    }
  },
  saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  },
  addOrder(order: Order): void {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    this.saveOrders(updated);
    this.setLastOrderId(order.id);
  },
  updateOrder(updatedOrder: Order): void {
    const orders = this.getOrders();
    const updated = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    this.saveOrders(updated);
  },

  // Last order ID for customer tracking
  getLastOrderId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_ORDER_ID);
    } catch {
      return null;
    }
  },
  setLastOrderId(orderId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ORDER_ID, orderId);
    } catch (e) {
      console.error(e);
    }
  },

  // Admin Auth
  getAdminToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    } catch {
      return null;
    }
  },
  setAdminToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      }
    } catch (e) {
      console.error(e);
    }
  },
  isAdminLoggedIn(): boolean {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true' &&
        Boolean(localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN))
      );
    } catch {
      return false;
    }
  },
  setAdminLoggedIn(value: boolean): void {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
      }
    } catch (e) {
      console.error(e);
    }
  },

  getAdminUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setAdminUser(user: AdminUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
      }
    } catch (e) {
      console.error(e);
    }
  },
};
