export type OrderStatus =
  | 'PENDING'
  | 'REVIEWING_DELIVERY'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryMethod = 'PICKUP' | 'NAIROBI_LOCAL' | 'COUNTRYWIDE';

export type PaymentMethod =
  | 'MPESA_BUY_GOODS'
  | 'BANK_TRANSFER'
  | 'CASH_ON_PICKUP'
  | 'CASH_ON_DELIVERY';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  usageInstructions: string;
  price: number; // in Kenyan Shillings (KES / KSh)
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  image: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string; // e.g. "NNW-2841"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  deliveryLocation: string; // e.g. "Nairobi Westlands, Muthithi Rd" or "Nakuru stage pickup"
  orderNotes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number | null; // null indicates admin review required
  totalAmount: number; // subtotal + (deliveryFee || 0)
  paymentMethod: PaymentMethod;
  paymentStatus: 'UNPAID' | 'CONFIRMED';
  paymentReference?: string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner';
  claimedAt: string;
}

export interface AdminSetupStatus {
  isClaimed: boolean;
  ownerEmail?: string;
  ownerName?: string;
  claimedAt?: string;
  hasEnvOverride?: boolean;
}

