import { BUSINESS_CONFIG } from '../config/constants';
import { CartItem, Order, Product } from '../types';

function getStoreBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://nectar-wellness.onrender.com';
}

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}`;
  if (!message || !message.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function buildWhatsAppGeneralUrl(): string {
  const baseUrl = getStoreBaseUrl();
  const text = `Hello ${BUSINESS_CONFIG.name}!

I'm visiting your online apothecary (${baseUrl}) and would like to inquire about your botanical remedies, guidance on what suits my wellness goals, and delivery or Odeon Nairobi CBD pickup options.`;

  return buildWhatsAppUrl(text);
}

export function buildWhatsAppProductInquiryUrl(product: Product): string {
  const baseUrl = getStoreBaseUrl();
  const productUrl = `${baseUrl}/?product=${encodeURIComponent(product.slug || product.id)}`;
  const stockLabel =
    product.stockQuantity > 0
      ? `${product.stockQuantity} in stock`
      : 'Currently restocking';

  const text = `Hello ${BUSINESS_CONFIG.name}!

I'm interested in this specific product from your apothecary:
*Product:* ${product.name}
*Category:* ${product.categoryName}
*Price:* KSh ${Number(product.price || 0).toLocaleString()}
*Availability:* ${stockLabel}
*Product Link:* ${productUrl}

Could you kindly advise on usage, benefits, and delivery options to my location?`;

  return buildWhatsAppUrl(text);
}

export function buildWhatsAppCartInquiryUrl(items: CartItem[]): string {
  const baseUrl = getStoreBaseUrl();
  const lines = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product.name} — KSh ${(
          item.product.price * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const text = `Hello ${BUSINESS_CONFIG.name}!

I'd like to inquire / order the following items from my bag:
${lines}

*Items Subtotal:* KSh ${subtotal.toLocaleString()}
*Store:* ${baseUrl}

Please let me know the delivery options and total to finalize via M-Pesa Till ${BUSINESS_CONFIG.mpesaTill}.`;

  return buildWhatsAppUrl(text);
}

export function buildWhatsAppOrderUrl(order: Order): string {
  const baseUrl = getStoreBaseUrl();
  const itemsText = (order.items || [])
    .map(
      (item) =>
        `• ${item.quantity}x ${item.productName} — KSh ${(
          item.priceAtPurchase * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const deliveryMethodLabel =
    order.deliveryMethod === 'PICKUP'
      ? `Shop Pickup (${BUSINESS_CONFIG.location} - Free)`
      : order.deliveryMethod === 'NAIROBI_LOCAL'
      ? 'Nairobi Local Delivery (Bolt/Rider)'
      : 'Countrywide Delivery (Matatu/Courier)';

  const text = `Hello ${BUSINESS_CONFIG.name}!

I have submitted an order on your website:
*Order Reference:* #${order.id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Delivery Option:* ${deliveryMethodLabel}
*Delivery Location / Address:* ${order.deliveryLocation}
${order.orderNotes ? `*Notes:* ${order.orderNotes}\n` : ''}
*Items:*
${itemsText}

*Products Subtotal:* KSh ${(order.subtotal || 0).toLocaleString()}
${
  order.deliveryFee !== null
    ? `*Delivery Fee:* KSh ${order.deliveryFee.toLocaleString()}\n*Total Due:* KSh ${order.totalAmount.toLocaleString()}`
    : `*Delivery Fee:* (Awaiting route review)`
}
*Payment Preference:* ${(order.paymentMethod || 'MPESA_BUY_GOODS').replace(/_/g, ' ')}

*Track order online:*
${baseUrl}/?track=${order.id}

Kindly confirm delivery transport fee and total to finalize. Asante sana!`;

  return buildWhatsAppUrl(text);
}

export function buildAdminCustomerWhatsAppUrl(
  order: Order,
  updateType: 'DELIVERY_QUOTE' | 'PAYMENT_CONFIRMED' | 'DISPATCHED'
): string {
  const baseUrl = getStoreBaseUrl();

  // Clean phone number: remove non-digits, ensure 254 prefix for Kenya
  let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('254') && cleanPhone.length === 9) {
    cleanPhone = '254' + cleanPhone;
  }

  let text = '';
  if (updateType === 'DELIVERY_QUOTE') {
    text = `Habari ${order.customerName}! ${BUSINESS_CONFIG.name} here regarding your Order #${order.id}.

We have reviewed your delivery route to *${order.deliveryLocation}*:
• Remedies Subtotal: KSh ${order.subtotal.toLocaleString()}
• Transport / Delivery Fee: KSh ${(order.deliveryFee || 0).toLocaleString()}
*Total Amount Due: KSh ${order.totalAmount.toLocaleString()}*

*Lipa na M-Pesa (Buy Goods Till)*
Till Number: *${BUSINESS_CONFIG.mpesaTill}*
Store Name: ${BUSINESS_CONFIG.mpesaStoreName}

*Speed up dispatch:* Kindly reply with your WhatsApp Live Location pin or landmark for the rider.

*Live Order Tracker:*
${baseUrl}/?track=${order.id}

Asante sana for choosing natural remedies!`;
  } else if (updateType === 'PAYMENT_CONFIRMED') {
    text = `Habari ${order.customerName}! Payment Confirmed for Order #${order.id}.

We have confirmed receipt of *KSh ${order.totalAmount.toLocaleString()}* on our Till (${BUSINESS_CONFIG.mpesaTill}).

Your herbal wellness remedies are now being carefully prepared and packaged in our apothecary.

*Track order progress live:*
${baseUrl}/?track=${order.id}

We will share rider/courier tracking details shortly!`;
  } else {
    text = `Habari ${order.customerName}! Order #${order.id} is Dispatched & On The Way!

Your herbal remedies package has been handed over to the courier for delivery to *${order.deliveryLocation}*.
Delivery Method: ${order.deliveryMethod.replace(/_/g, ' ')}.
${order.adminNotes ? `Courier Note: ${order.adminNotes}\n` : ''}
*Track delivery status live:*
${baseUrl}/?track=${order.id}

Please let us know once you safely receive your package. Wishing you vibrant health!`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
