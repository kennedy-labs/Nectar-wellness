import { CreateOrderDTO } from '../server/service';
import { Category, Order, OrderStatus, Product } from '../types';
import { storage } from './storage';

export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch from server');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        storage.saveProducts(json.data);
        return json.data;
      }
    } catch {
      // Fallback to local storage cache
    }
    return storage.getProducts();
  },

  async createOrUpdateProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const isNew = !productData.id;
      const url = isNew ? '/api/products' : `/api/products/${productData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const products = storage.getProducts();
        const updated = isNew
          ? [json.data, ...products]
          : products.map((p) => (p.id === json.data.id ? json.data : p));
        storage.saveProducts(updated);
        return json.data;
      }
    } catch (e) {
      console.warn('Network call failed, saving to local repository:', e);
    }

    // Local fallback update
    const products = storage.getProducts();
    const id = productData.id || `prod_${Date.now()}`;
    const product: Product = {
      id,
      name: productData.name || 'Untitled',
      slug: productData.slug || id,
      description: productData.description || '',
      benefits: productData.benefits || [],
      ingredients: productData.ingredients || [],
      usageInstructions: productData.usageInstructions || '',
      price: productData.price || 0,
      stockQuantity: productData.stockQuantity || 0,
      categoryId: productData.categoryId || 'cat_powders',
      categoryName: productData.categoryName || 'Herbal Powders',
      image: productData.image || '/src/assets/images/hero_wellness_botanicals_1790820582973.jpg',
      isFeatured: Boolean(productData.isFeatured),
      isActive: productData.isActive !== false,
      createdAt: productData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = productData.id
      ? products.map((p) => (p.id === id ? product : p))
      : [product, ...products];
    storage.saveProducts(updated);
    return product;
  },

  async updateStock(productId: string, stockQuantity: number): Promise<Product | null> {
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity }),
      });
      const json = await res.json();
      if (json.success) {
        const products = storage.getProducts().map((p) => (p.id === productId ? json.data : p));
        storage.saveProducts(products);
        return json.data;
      }
    } catch {
      // Local fallback
    }

    const products = storage.getProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) return null;
    target.stockQuantity = stockQuantity;
    storage.saveProducts(products);
    return target;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        const products = storage.getProducts().filter((p) => p.id !== productId);
        storage.saveProducts(products);
        return true;
      }
    } catch {
      // Local fallback
    }

    const products = storage.getProducts().filter((p) => p.id !== productId);
    storage.saveProducts(products);
    return true;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          storage.saveCategories(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback to local storage
    }
    return storage.getCategories();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          storage.saveOrders(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return storage.getOrders();
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const orders = storage.getOrders();
    return orders.find((o) => o.id === id || o.id === `NNW-${id}`) || null;
  },

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          storage.addOrder(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    // Client-side fallback creation
    const products = storage.getProducts();
    const orderItems = dto.items.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return {
        id: `item_${Date.now()}_${Math.random()}`,
        productId: i.productId,
        productName: p?.name || 'Herbal Product',
        productSlug: p?.slug || 'product',
        productImage: p?.image || '',
        quantity: i.quantity,
        priceAtPurchase: p?.price || 0,
      };
    });

    const subtotal = orderItems.reduce((acc, item) => acc + item.priceAtPurchase * item.quantity, 0);
    const isPickup = dto.deliveryMethod === 'PICKUP';
    const order: Order = {
      id: `NNW-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      deliveryMethod: dto.deliveryMethod,
      deliveryLocation: dto.deliveryLocation,
      orderNotes: dto.orderNotes,
      items: orderItems,
      subtotal,
      deliveryFee: isPickup ? 0 : null,
      totalAmount: subtotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: 'UNPAID',
      status: isPickup ? 'AWAITING_PAYMENT' : 'REVIEWING_DELIVERY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.addOrder(order);
    return order;
  },

  async updateDeliveryFee(orderId: string, deliveryFee: number, adminNotes?: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery-fee`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryFee, adminNotes }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          storage.updateOrder(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    const order = storage.getOrders().find((o) => o.id === orderId);
    if (!order) return null;
    order.deliveryFee = deliveryFee;
    order.totalAmount = order.subtotal + deliveryFee;
    if (order.status === 'REVIEWING_DELIVERY' || order.status === 'PENDING') {
      order.status = 'AWAITING_PAYMENT';
    }
    if (adminNotes) order.adminNotes = adminNotes;
    storage.updateOrder(order);
    return order;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, adminNotes?: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          storage.updateOrder(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    const order = storage.getOrders().find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    storage.updateOrder(order);
    return order;
  },

  async confirmPayment(orderId: string, paymentReference: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          storage.updateOrder(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    const order = storage.getOrders().find((o) => o.id === orderId);
    if (!order) return null;
    order.paymentStatus = 'CONFIRMED';
    order.paymentReference = paymentReference.toUpperCase();
    if (['AWAITING_PAYMENT', 'REVIEWING_DELIVERY', 'PENDING'].includes(order.status)) {
      order.status = 'PAID';
    }
    storage.updateOrder(order);
    return order;
  },

  async loginAdmin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          storage.setAdminLoggedIn(true);
          return true;
        }
      }
    } catch {
      // Fallback check
    }
    if (pin === '2540') {
      storage.setAdminLoggedIn(true);
      return true;
    }
    return false;
  },

  async getAdminSecurityStatus(): Promise<{ hasEnvOverride: boolean; isDefaultPin: boolean }> {
    try {
      const res = await fetch('/api/admin/security-status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return { hasEnvOverride: false, isDefaultPin: true };
  },

  async changeAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },
};
