import { BUSINESS_CONFIG } from '../config/constants.js';
import { generateOrderId, generateSlug } from '../lib/utils.js';
import { AdminSetupStatus, AdminUser, DeliveryMethod, Order, OrderItem, OrderStatus, PaymentMethod, Product } from '../types/index.js';
import { repository } from './repository.js';
import { hashPassword, verifyPassword } from './auth.js';
import { StoredAdminUser } from './db.js';

export interface CreateOrderDTO {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryMethod?: DeliveryMethod;
  deliveryLocation?: string;
  orderNotes?: string;
  paymentMethod?: PaymentMethod;
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
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Order must include at least one product.');
    }

    const customerName = (dto.customerName || '').trim();
    const customerPhone = (dto.customerPhone || '').trim();
    const cleanPhoneDigits = customerPhone.replace(/[^0-9]/g, '');
    if (!customerName) {
      throw new Error('Please enter your name so we can process your order.');
    }
    if (cleanPhoneDigits.length < 9) {
      throw new Error('Please enter a valid phone number so we can send your delivery quote and updates.');
    }

    const deliveryMethod = dto.deliveryMethod || 'NAIROBI_LOCAL';
    const isPickup = deliveryMethod === 'PICKUP';
    const deliveryLocation = isPickup
      ? BUSINESS_CONFIG.location
      : (dto.deliveryLocation || '').trim();
    if (!isPickup && !deliveryLocation) {
      throw new Error('Please enter your delivery estate, landmark, or destination town.');
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
    const deliveryFee: number | null = isPickup ? 0 : null;
    const initialStatus: OrderStatus = isPickup ? 'AWAITING_PAYMENT' : 'REVIEWING_DELIVERY';

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      customerName,
      customerPhone,
      customerEmail: dto.customerEmail?.trim() || undefined,
      deliveryMethod,
      deliveryLocation,
      orderNotes: dto.orderNotes?.trim() || undefined,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount: subtotal + (deliveryFee || 0),
      paymentMethod: dto.paymentMethod || 'MPESA_BUY_GOODS',
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

  confirmPayment(orderId: string, paymentReference?: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;

    const wasAlreadyConfirmed = order.paymentStatus === 'CONFIRMED';
    order.paymentStatus = 'CONFIRMED';
    order.paymentReference = (paymentReference?.trim() || 'VERIFIED_VIA_SMS').toUpperCase();
    order.mpesaStatus = 'CONFIRMED';
    order.mpesaStatusMessage = 'Payment confirmed.';
    if (order.status === 'AWAITING_PAYMENT' || order.status === 'REVIEWING_DELIVERY' || order.status === 'PENDING') {
      order.status = 'PAID';
    }
    order.updatedAt = new Date().toISOString();

    // Decrement stock upon payment confirmation only if not previously confirmed
    if (!wasAlreadyConfirmed) {
      for (const item of order.items) {
        const product = repository.findProductById(item.productId);
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
          repository.saveProduct(product);
        }
      }
    }

    return repository.saveOrder(order);
  },

  recordMpesaInitiation(orderId: string, checkoutRequestId: string, message?: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;
    order.mpesaCheckoutRequestId = checkoutRequestId;
    order.mpesaStatus = 'PENDING';
    order.mpesaStatusMessage = message || 'M-Pesa prompt sent to your phone.';
    order.updatedAt = new Date().toISOString();
    return repository.saveOrder(order);
  },

  recordMpesaResult(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'FAILED', message: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;
    if (order.paymentStatus === 'CONFIRMED') return order;
    order.mpesaStatus = status;
    order.mpesaStatusMessage = message;
    order.updatedAt = new Date().toISOString();
    return repository.saveOrder(order);
  },

  revertPayment(orderId: string): Order | null {
    const order = repository.findOrderById(orderId);
    if (!order) return null;

    const wasConfirmed = order.paymentStatus === 'CONFIRMED';
    order.paymentStatus = 'UNPAID';
    order.paymentReference = undefined;
    order.mpesaStatus = undefined;
    order.mpesaStatusMessage = undefined;

    // If order is currently in PAID, return it to AWAITING_PAYMENT
    if (order.status === 'PAID') {
      order.status = 'AWAITING_PAYMENT';
    }
    order.updatedAt = new Date().toISOString();

    // Restore stock if payment was previously confirmed
    if (wasConfirmed) {
      for (const item of order.items) {
        const product = repository.findProductById(item.productId);
        if (product) {
          product.stockQuantity = product.stockQuantity + item.quantity;
          repository.saveProduct(product);
        }
      }
    }

    return repository.saveOrder(order);
  },

  // Store Owner Setup & Phone + Password Auth Verification
  normalizePhone(phone: string): string {
    const cleaned = (phone || '').replace(/[\s\-()]/g, '').trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('+254')) return '0' + cleaned.slice(4);
    if (cleaned.startsWith('254') && cleaned.length >= 12) return '0' + cleaned.slice(3);
    if (/^[71]\d{8}$/.test(cleaned)) return '0' + cleaned;
    return cleaned;
  },

  getAdminSetupStatus(): AdminSetupStatus {
    const adminUser = repository.getAdminUser();
    const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || '').trim();
    return {
      isClaimed: Boolean(adminUser),
      ownerPhone: adminUser?.phone || BUSINESS_CONFIG.adminDefaultPhone,
      ownerEmail: adminUser?.email,
      ownerName: adminUser?.name || 'Store Owner',
      claimedAt: adminUser?.claimedAt,
      hasEnvOverride: Boolean(envPass),
    };
  },

  authenticateAdmin(credentials: { phone?: string; password?: string }): {
    success: boolean;
    user?: AdminUser;
    error?: string;
  } {
    const inputPhone = this.normalizePhone(credentials.phone || '');
    const inputPassword = (credentials.password ?? '').trim();

    if (!inputPhone || !inputPassword) {
      return { success: false, error: 'Please enter both phone number and password.' };
    }

    const adminUser = repository.getAdminUser();
    const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || '').trim();
    const expectedPhone = this.normalizePhone(
      adminUser?.phone || BUSINESS_CONFIG.adminDefaultPhone
    );

    if (inputPhone !== expectedPhone) {
      return { success: false, error: 'Invalid phone number or password.' };
    }

    if (adminUser) {
      const passwordMatches =
        verifyPassword(inputPassword, adminUser.passwordHash) ||
        Boolean(envPass && inputPassword === envPass);

      if (!passwordMatches) {
        return { success: false, error: 'Invalid phone number or password.' };
      }

      return {
        success: true,
        user: {
          id: adminUser.id,
          phone: adminUser.phone || BUSINESS_CONFIG.adminDefaultPhone,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          claimedAt: adminUser.claimedAt,
        },
      };
    }

    // Default credentials when no custom owner credentials have been saved yet
    const defaultPassword = envPass || BUSINESS_CONFIG.adminDefaultPassword;
    if (inputPassword !== defaultPassword) {
      return { success: false, error: 'Invalid phone number or password.' };
    }

    return {
      success: true,
      user: {
        id: 'default_owner',
        phone: BUSINESS_CONFIG.adminDefaultPhone,
        name: 'Store Owner',
        role: 'owner',
      },
    };
  },

  async updateAdminCredentials(params: {
    currentPassword: string;
    newPhone?: string;
    newPassword?: string;
    name?: string;
  }): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const adminUser = repository.getAdminUser();
    const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || '').trim();
    const currentPass = (params.currentPassword ?? '').trim();

    if (!currentPass) {
      return { success: false, error: 'Current password is required.' };
    }

    if (adminUser) {
      const validCurrent =
        verifyPassword(currentPass, adminUser.passwordHash) ||
        Boolean(envPass && currentPass === envPass);
      if (!validCurrent) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    } else {
      const defaultPassword = envPass || BUSINESS_CONFIG.adminDefaultPassword;
      if (currentPass !== defaultPassword) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }

    const nextPhone = params.newPhone
      ? this.normalizePhone(params.newPhone)
      : this.normalizePhone(adminUser?.phone || BUSINESS_CONFIG.adminDefaultPhone);

    if (!nextPhone || nextPhone.length < 9) {
      return { success: false, error: 'Please enter a valid admin phone number.' };
    }

    const trimmedNewPass = (params.newPassword ?? '').trim();
    if (params.newPassword !== undefined && trimmedNewPass.length > 0 && trimmedNewPass.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    const nextPasswordHash =
      trimmedNewPass.length >= 4
        ? hashPassword(trimmedNewPass)
        : adminUser?.passwordHash || hashPassword(currentPass);

    const updatedUser: StoredAdminUser = {
      id: adminUser?.id || `owner_${Date.now()}`,
      phone: nextPhone,
      email: adminUser?.email,
      name: (params.name || adminUser?.name || 'Store Owner').trim(),
      passwordHash: nextPasswordHash,
      role: 'owner',
      claimedAt: adminUser?.claimedAt || new Date().toISOString(),
    };

    await repository.saveAdminUser(updatedUser);

    return {
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        claimedAt: updatedUser.claimedAt,
      },
    };
  },

  async changeOwnerPassword(
    currentPass: string,
    newPass: string,
    newPhone?: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    return this.updateAdminCredentials({
      currentPassword: currentPass,
      newPassword: newPass,
      newPhone,
    });
  },
};
