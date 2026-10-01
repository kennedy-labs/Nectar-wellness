import { BUSINESS_CONFIG } from '../config/constants';
import { Order, Product } from '../types';

export function buildWhatsAppOrderUrl(order: Order): string {
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
    ? `*Delivery Fee:* KSh ${order.deliveryFee.toLocaleString()}\n*Total:* KSh ${order.totalAmount.toLocaleString()}`
    : `*Delivery Fee:* (Awaiting manual confirmation based on location)`
}
*Payment Preference:* ${order.paymentMethod.replace(/_/g, ' ')}

Kindly confirm delivery cost and total to finalize. Asante sana!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppProductInquiryUrl(product: Product): string {
  const text = `Habari Nature’s Nectar Wellness! 🌿

I am inquiring about *${product.name}* (KSh ${product.price.toLocaleString()}).

Could you kindly advise on recommended usage, benefits, and current shop availability?`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(text)}`;
}

export function buildAdminCustomerWhatsAppUrl(order: Order, updateType: 'DELIVERY_QUOTE' | 'PAYMENT_CONFIRMED' | 'DISPATCHED'): string {
  // Clean phone number: remove leading 0 and add 254 if not present
  let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('254') && cleanPhone.length === 9) {
    cleanPhone = '254' + cleanPhone;
  }

  let text = '';
  if (updateType === 'DELIVERY_QUOTE') {
    text = `Habari ${order.customerName}! 🌿 Nature’s Nectar Wellness here regarding your Order #${order.id}.

We have reviewed your delivery to ${order.deliveryLocation}.
• Products Subtotal: KSh ${order.subtotal.toLocaleString()}
• Delivery Fee: KSh ${(order.deliveryFee || 0).toLocaleString()}
*Total Amount Due:* KSh ${order.totalAmount.toLocaleString()}

Payment via M-Pesa Buy Goods:
Till Number: ${BUSINESS_CONFIG.mpesaTill}
Name: ${BUSINESS_CONFIG.mpesaStoreName}

Once sent, kindly share the M-Pesa confirmation code here so we can prepare your dispatch. Asante!`;
  } else if (updateType === 'PAYMENT_CONFIRMED') {
    text = `Habari ${order.customerName}! 🌿 We have received your payment of KSh ${order.totalAmount.toLocaleString()} for Order #${order.id}.

Your herbal wellness package is now being carefully prepared at our apothecary. We will update you with rider/courier tracking details shortly!`;
  } else {
    text = `Habari ${order.customerName}! 🌿 Your Nature’s Nectar order #${order.id} is now on its way to you (${order.deliveryLocation}).

Delivery method: ${order.deliveryMethod.replace(/_/g, ' ')}.
Please let us know once you safely receive your package. Wishing you vibrant health!`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
