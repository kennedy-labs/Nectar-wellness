import { BUSINESS_CONFIG } from '../config/constants';
import { Order, Product } from '../types';

function getStoreBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://nectar-wellness.onrender.com';
}

export function buildWhatsAppOrderUrl(order: Order): string {
  const baseUrl = getStoreBaseUrl();
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.productName} — KSh ${(
          item.priceAtPurchase * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const deliveryMethodLabel =
    order.deliveryMethod === 'PICKUP'
      ? 'Shop Pickup (Nairobi CBD - Free)'
      : order.deliveryMethod === 'NAIROBI_LOCAL'
      ? 'Nairobi Local Delivery (Bolt/Rider)'
      : 'Countrywide Delivery (Matatu/Courier)';

  const text = `Habari Nature’s Nectar Wellness! 🌿

I have submitted an order on your website:
*Order Reference:* #${order.id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Delivery Option:* ${deliveryMethodLabel}
*Delivery Location / Address:* ${order.deliveryLocation}
${order.orderNotes ? `*Notes:* ${order.orderNotes}\n` : ''}
*Items:*
${itemsText}

*Products Subtotal:* KSh ${order.subtotal.toLocaleString()}
${
  order.deliveryFee !== null
    ? `*Delivery Fee:* KSh ${order.deliveryFee.toLocaleString()}\n*Total Due:* KSh ${order.totalAmount.toLocaleString()}`
    : `*Delivery Fee:* (Awaiting route review)`
}
*Payment Preference:* ${order.paymentMethod.replace(/_/g, ' ')}

🔍 *Track order online:*
${baseUrl}/?track=${order.id}

Kindly confirm delivery transport fee and total to finalize. Asante sana!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppProductInquiryUrl(product: Product): string {
  const baseUrl = getStoreBaseUrl();
  const text = `Habari Nature’s Nectar Wellness! 🌿

I am inquiring about *${product.name}* (KSh ${product.price.toLocaleString()}).
Link: ${baseUrl}/#apothecary-remedies

Could you kindly advise on recommended usage, benefits, and current shop availability? Asante!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(text)}`;
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
    text = `Habari ${order.customerName}! 🌿 Nature’s Nectar Wellness here regarding your Order #${order.id}.

We have reviewed your delivery route to *${order.deliveryLocation}*:
• Remedies Subtotal: KSh ${order.subtotal.toLocaleString()}
• Transport / Delivery Fee: KSh ${(order.deliveryFee || 0).toLocaleString()}
👉 *Total Amount Due: KSh ${order.totalAmount.toLocaleString()}*

💳 *Lipa na M-Pesa (Buy Goods Till)*
Till Number: *${BUSINESS_CONFIG.mpesaTill}*
Store Name: ${BUSINESS_CONFIG.mpesaStoreName}
*(You can copy just the Till digits above)*

📍 *Speed up dispatch:* Kindly reply with your WhatsApp Live Location pin or landmark for the rider.

🔍 *Live Order Tracker:*
${baseUrl}/?track=${order.id}

Asante sana for choosing natural remedies!`;
  } else if (updateType === 'PAYMENT_CONFIRMED') {
    text = `Habari ${order.customerName}! 🌿 Payment Confirmed for Order #${order.id}.

✅ We have confirmed receipt of *KSh ${order.totalAmount.toLocaleString()}* on our Till.

🌿 Your herbal wellness remedies are now being carefully prepared and packaged in our apothecary.

🔍 *Track order progress live:*
${baseUrl}/?track=${order.id}

We will share rider/courier tracking details shortly!`;
  } else {
    text = `Habari ${order.customerName}! 🌿 Order #${order.id} is Dispatched & On The Way!

🛵 Your herbal remedies package has been handed over to the courier for delivery to *${order.deliveryLocation}*.
Delivery Method: ${order.deliveryMethod.replace(/_/g, ' ')}.
${order.adminNotes ? `Courier Note: ${order.adminNotes}\n` : ''}
🔍 *Track delivery status live:*
${baseUrl}/?track=${order.id}

Please let us know once you safely receive your package. Wishing you vibrant health!`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
