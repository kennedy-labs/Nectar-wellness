import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../config/constants';
import { AdminUser, CartItem, Category, Order, Product } from '../types';

const STORAGE_KEYS = {
  CART: 'nnw_cart_v1',
  PRODUCTS: 'nnw_products_v1',
  CATEGORIES: 'nnw_categories_v1',
  ORDERS: 'nnw_orders_v1',
  ADMIN_AUTH: 'nnw_admin_auth_v1',
  ADMIN_USER: 'nnw_admin_user_v1',
  LAST_ORDER_ID: 'nnw_last_order_id_v1',
};

// Seed demo order so admin and tracking have immediate operational reality to test
const DEMO_ORDERS: Order[] = [
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
  },
  {
    id: "NNW-1048",
    customerName: "David Ochieng",
    customerPhone: "0733987654",
    deliveryMethod: "COUNTRYWIDE",
    deliveryLocation: "Kisumu Central, Easy Coach Parcel Stage",
    items: [
      {
        id: "item_3",
        productId: "prod_ashwagandha_tincture",
        productName: "Organic Ashwagandha Root Extract (KSM-66)",
        productSlug: "organic-ashwagandha-root-extract",
        productImage: "/src/assets/images/product_ashwagandha_tincture_1790820615059.jpg",
        quantity: 2,
        priceAtPurchase: 2400,
      }
    ],
    subtotal: 4800,
    deliveryFee: null, // Awaiting manual delivery review!
    totalAmount: 4800,
    paymentMethod: "MPESA_BUY_GOODS",
    paymentStatus: "UNPAID",
    status: "REVIEWING_DELIVERY",
    orderNotes: "Need advice on sending via Easy Coach or 2NK matatu.",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  }
];

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
  isAdminLoggedIn(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
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
