import { BUSINESS_CONFIG } from '../config/constants';
import { CreateOrderDTO } from '../server/service';
import { AdminSetupStatus, AdminUser, Category, Order, OrderStatus, Product } from '../types';
import { storage } from './storage';

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = storage.getAdminToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized(status: number) {
  if (status === 401) {
    storage.setAdminLoggedIn(false);
    throw new Error('Admin session expired. Please sign in again.');
  }
}

export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products', {
        headers: getAuthHeaders(),
      });
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
    const isNew = !productData.id;
    const url = isNew ? '/api/products' : `/api/products/${productData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(productData),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to save product.');
    }

    const products = storage.getProducts();
    const updated = isNew
      ? [json.data, ...products]
      : products.map((p) => (p.id === json.data.id ? json.data : p));
    storage.saveProducts(updated);
    return json.data;
  },

  async updateStock(productId: string, stockQuantity: number): Promise<Product | null> {
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ stockQuantity }),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update stock.');
    }
    const products = storage.getProducts().map((p) => (p.id === productId ? json.data : p));
    storage.saveProducts(products);
    return json.data;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (res.ok && json.success) {
      const products = storage.getProducts().filter((p) => p.id !== productId);
      storage.saveProducts(products);
      return true;
    }
    return false;
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

  // Orders (Admin List)
  async getOrders(): Promise<Order[]> {
    if (!storage.getAdminToken()) {
      return [];
    }
    try {
      const res = await fetch('/api/orders', {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        storage.setAdminLoggedIn(false);
        return [];
      }
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
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
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
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Could not submit order. Please check your details and try again.');
    }
    storage.addOrder(json.data);
    return json.data;
  },

  async updateDeliveryFee(orderId: string, deliveryFee: number, adminNotes?: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}/delivery-fee`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ deliveryFee, adminNotes }),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update delivery fee.');
    }
    storage.updateOrder(json.data);
    return json.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, adminNotes?: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, adminNotes }),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update order status.');
    }
    storage.updateOrder(json.data);
    return json.data;
  },

  async confirmPayment(orderId: string, paymentReference?: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ paymentReference: paymentReference?.trim() || 'VERIFIED_VIA_SMS' }),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to confirm payment.');
    }
    storage.updateOrder(json.data);
    return json.data;
  },

  async revertPayment(orderId: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}/payment/revert`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    handleUnauthorized(res.status);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to revert payment.');
    }
    storage.updateOrder(json.data);
    return json.data;
  },

  async getAdminSetupStatus(): Promise<AdminSetupStatus> {
    try {
      const res = await fetch('/api/admin/setup-status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return {
      isClaimed: false,
      ownerPhone: BUSINESS_CONFIG.adminDefaultPhone,
      ownerName: 'Store Owner',
    };
  },

  async loginAdmin(credentials: { phone: string; password: string }): Promise<{
    success: boolean;
    user?: AdminUser;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (json.success && json.token) {
        storage.setAdminToken(json.token);
        storage.setAdminLoggedIn(true);
        if (json.user) storage.setAdminUser(json.user);
        return { success: true, user: json.user };
      }
      return { success: false, error: json.error || 'Invalid phone number or password.' };
    } catch {
      return { success: false, error: 'Network error or server unreachable.' };
    }
  },

  async changeOwnerPassword(data: {
    currentPassword: string;
    newPassword?: string;
    newPhone?: string;
    name?: string;
  }): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        storage.setAdminLoggedIn(false);
        return { success: false, error: 'Session expired. Please sign in again.' };
      }
      const json = await res.json();
      if (json.success && json.user) {
        storage.setAdminUser(json.user);
      }
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },
};
