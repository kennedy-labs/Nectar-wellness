import { BUSINESS_CONFIG } from '../config/constants.js';
import { generateOrderId, generateSlug } from '../lib/utils.js';
import { DeliveryMethod, Order, OrderItem, OrderStatus, PaymentMethod, Product } from '../types/index.js';
import { repository } from './repository.js';

export interface CreateOrderDTO {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  deliveryLocation: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
}

export const service = {
  // Products
  listActiveProducts(): Product[] {
    return repository.findAllProducts().filter((p) => p.isActive);
  },
  listAllProducts(): Product[] {
    return repository.findAllProducts();
  },
  getProductBySlug(slug: string): Product | undefined {
    return repository.findProductBySlug(slug);
  },
  createOrUpdateProduct(productData: Partial<Product>): Product {
    const isNew = !productData.id;
    const now = new Date().toISOString();

    const product: Product = {
      id: productData.id || `prod_${Date.now()}`,
      name: productData.name?.trim() || 'Untitled Herbal Product',
      slug: productData.slug || generateSlug(productData.name || 'product'),
      description: productData.description?.trim() || '',
      benefits: productData.benefits || [],
      ingredients: productData.ingredients || [],
      usageInstructions: productData.usageInstructions?.trim() || '',
      price: Math.max(0, Number(productData.price) || 0),
      stockQuantity: Math.max(0, Number(productData.stockQuantity) || 0),
      categoryId: productData.categoryId || 'cat_powders',
      categoryName: productData.categoryName || 'Herbal Powders',
      image: productData.image || '/src/assets/images/hero_wellness_botanicals_1790820582973.jpg',
      isFeatured: Boolean(productData.isFeatured),
      isActive: productData.isActive !== false,
      createdAt: isNew ? now : productData.createdAt || now,
      updatedAt: now,
    };

    return repository.saveProduct(product);
  },
  updateStock(productId: string, newStock: number): Product | null {
    const product = repository.findProductById(productId);
    if (!product) return null;
    product.stockQuantity = Math.max(0, newStock);
    product.updatedAt = new Date().toISOString();
    return repository.saveProduct(product);
  },
  deleteProduct(productId: string): boolean {
    return repository.deleteProduct(productId);
  },

  // Orders
  createOrder(dto: CreateOrderDTO): Order {
    if (!dto.customerName?.trim() || !dto.customerPhone?.trim()) {
      throw new Error('Customer name and phone number are required.');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Order must include at least one product.');
    }

    const allProducts = repository.findAllProducts();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const qty = Math.max(1, item.quantity);
      const itemTotal = product.price * qty;
      subtotal += itemTotal;

      orderItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.image,
        quantity: qty,
        priceAtPurchase: product.price, // Preserving historical price integrity
      });
    }

    // Dynamic Delivery Handling
    // Shop pickup in Nairobi CBD is 0 KES delivery
    const isPickup = dto.deliveryMethod === 'PICKUP';
    const deliveryFee: number | null = isPickup ? 0 : null;
    const initialStatus: OrderStatus = isPickup ? 'AWAITING_PAYMENT' : 'REVIEWING_DELIVERY';

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      customerEmail: dto.customerEmail?.trim() || undefined,
      deliveryMethod: dto.deliveryMethod,
      deliveryLocation: dto.deliveryLocation.trim(),
      orderNotes: dto.orderNotes?.trim() || undefined,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount: subtotal + (deliveryFee || 0),
      paymentMethod: dto.paymentMethod,
      paymentStatus: 'UNPAID',
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };

    return repository.saveOrder(order);
  },

  updateDeliveryFee(orderId: string, deliveryFee: number, adminNotes?: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;

    order.deliveryFee = Math.max(0, deliveryFee);
    order.totalAmount = order.subtotal + order.deliveryFee;
    if (order.status === 'REVIEWING_DELIVERY' || order.status === 'PENDING') {
      order.status = 'AWAITING_PAYMENT';
    }
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }
    order.updatedAt = new Date().toISOString();
    return repository.saveOrder(order);
  },

  updateOrderStatus(orderId: string, status: OrderStatus, adminNotes?: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;

    order.status = status;
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }
    order.updatedAt = new Date().toISOString();
    return repository.saveOrder(order);
  },

  confirmPayment(orderId: string, paymentReference: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;

    order.paymentStatus = 'CONFIRMED';
    order.paymentReference = paymentReference.trim().toUpperCase();
    if (order.status === 'AWAITING_PAYMENT' || order.status === 'REVIEWING_DELIVERY' || order.status === 'PENDING') {
      order.status = 'PAID';
    }
    order.updatedAt = new Date().toISOString();

    // Decrement stock upon payment confirmation
    for (const item of order.items) {
      const product = repository.findProductById(item.productId);
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        repository.saveProduct(product);
      }
    }

    return repository.saveOrder(order);
  },

  // Auth verification
  getSecurityStatus(): { hasEnvOverride: boolean; isDefaultPin: boolean } {
    const envPin = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD;
    const storedPin = repository.getAdminPin();
    const hasEnvOverride = Boolean(envPin);
    const isDefaultPin = !hasEnvOverride && !storedPin;
    return { hasEnvOverride, isDefaultPin };
  },

  verifyAdminPin(pin: string): boolean {
    const trimmed = (pin || '').trim();
    if (!trimmed) return false;

    // 1. Render/Cloud Environment Variable has highest priority
    const envPin = (process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || '').trim();
    if (envPin) {
      return trimmed === envPin;
    }

    // 2. Custom Owner PIN persisted in PostgreSQL/db.json
    const storedPin = repository.getAdminPin();
    if (storedPin) {
      return trimmed === storedPin.trim();
    }

    // 3. Fallback to initial setup PIN
    return trimmed === BUSINESS_CONFIG.adminDefaultPin;
  },

  async updateAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const envPin = (process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || '').trim();
    if (envPin) {
      return {
        success: false,
        error: 'Admin PIN is locked by the ADMIN_PIN environment variable on your server (e.g. Render Dashboard). Update it directly in your environment variables.',
      };
    }

    if (!this.verifyAdminPin(currentPin)) {
      return { success: false, error: 'Current PIN is incorrect' };
    }

    const trimmedNew = (newPin || '').trim();
    if (trimmedNew.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 characters/digits' };
    }

    await repository.setAdminPin(trimmedNew);
    return { success: true };
  },
};
