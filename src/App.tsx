import React, { useEffect, useState, useMemo } from 'react';
import { api } from './lib/api';
import { storage } from './lib/storage';
import { buildWhatsAppOrderUrl } from './lib/whatsapp';
import { CartItem, Category, DeliveryMethod, Order, OrderStatus, PaymentMethod, Product } from './types';

// Layout Components
import { TopBar } from './components/layout/TopBar';
import { HeroSection } from './components/layout/HeroSection';
import { TrustFeatures } from './components/layout/TrustFeatures';
import { WhatsAppFloatingButton } from './components/layout/WhatsAppFloatingButton';
import { Footer } from './components/layout/Footer';

// Customer Feature Components
import { ProductFilter } from './features/products/components/ProductFilter';
import { ProductGrid } from './features/products/components/ProductGrid';
import { ProductDetailModal } from './features/products/components/ProductDetailModal';
import { CartDrawer } from './features/cart/components/CartDrawer';
import { CheckoutModal } from './features/checkout/components/CheckoutModal';
import { OrderSuccessModal } from './features/checkout/components/OrderSuccessModal';
import { OrderTrackerModal } from './features/orders/components/OrderTrackerModal';

// Dedicated Standalone Admin Page
import { AdminPage } from './features/admin/pages/AdminPage';

export default function App() {
  // Routing State: '/' for customer storefront, '/admin' for isolated owner portal
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path.startsWith('/admin') || hash === '#admin') {
        return '/admin';
      }
    }
    return '/';
  });

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState<string>('');

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Added animation tracker
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  // Listen to browser navigation changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path.startsWith('/admin') || hash === '#admin') {
        setCurrentRoute('/admin');
      } else {
        setCurrentRoute('/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    if (route === '/admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initial Data Load
  useEffect(() => {
    async function loadInitialData() {
      const [prods, cats, ords] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getOrders(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setCart(storage.getCart());
      setIsAdminLoggedIn(storage.isAdminLoggedIn());

      const lastId = storage.getLastOrderId();
      if (lastId) setTrackOrderId(lastId);
    }
    loadInitialData();
  }, []);

  // Sync Cart to LocalStorage
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    storage.setCart(newCart);
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((i) => i.product.id === product.id);
    let newCart: CartItem[];
    if (existingIndex >= 0) {
      newCart = [...cart];
      const maxStock = product.stockQuantity;
      const newQty = Math.min(maxStock, newCart[existingIndex].quantity + quantity);
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQty };
    } else {
      newCart = [...cart, { product, quantity: Math.min(product.stockQuantity, quantity) }];
    }
    updateCart(newCart);

    // Flash feedback
    setAddedProductIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    updateCart(newCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.product.id !== productId);
    updateCart(newCart);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleDirectWhatsAppCart = () => {
    if (cart.length === 0) return;
    const dummyOrder: Order = {
      id: 'INQUIRY-' + Math.floor(1000 + Math.random() * 9000),
      customerName: 'Customer',
      customerPhone: '',
      deliveryMethod: 'NAIROBI_LOCAL',
      deliveryLocation: 'To be determined',
      items: cart.map((c) => ({
        id: c.product.id,
        productId: c.product.id,
        productName: c.product.name,
        productSlug: c.product.slug,
        productImage: c.product.image,
        quantity: c.quantity,
        priceAtPurchase: c.product.price,
      })),
      subtotal: cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
      deliveryFee: null,
      totalAmount: cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
      paymentMethod: 'MPESA_BUY_GOODS',
      paymentStatus: 'UNPAID',
      status: 'REVIEWING_DELIVERY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    window.open(buildWhatsAppOrderUrl(dummyOrder), '_blank');
  };

  // Order Submission Handler
  const handleSubmitOrder = async (formData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryMethod: DeliveryMethod;
    deliveryLocation: string;
    orderNotes?: string;
    paymentMethod: PaymentMethod;
  }): Promise<Order | null> => {
    const orderItems = cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));

    const created = await api.createOrder({
      ...formData,
      items: orderItems,
    });

    if (created) {
      setOrders((prev) => [created, ...prev]);
      setCompletedOrder(created);
      setIsCheckoutOpen(false);
      updateCart([]); // Clear cart upon successful order creation
      setTrackOrderId(created.id);
      return created;
    }
    return null;
  };

  // Order Tracking Handler
  const handleSearchOrder = async (orderId: string): Promise<Order | null> => {
    return await api.getOrderById(orderId);
  };

  // Admin Handlers
  const handleAdminLogin = async (pin: string): Promise<boolean> => {
    const success = await api.loginAdmin(pin);
    if (success) {
      setIsAdminLoggedIn(true);
    }
    return success;
  };

  const handleAdminLogout = () => {
    storage.setAdminLoggedIn(false);
    setIsAdminLoggedIn(false);
  };

  const handleUpdateDeliveryFee = async (orderId: string, fee: number, notes?: string) => {
    const updated = await api.updateDeliveryFee(orderId, fee, notes);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    const updated = await api.updateOrderStatus(orderId, status, notes);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
  };

  const handleConfirmPayment = async (orderId: string, reference: string) => {
    const updated = await api.confirmPayment(orderId, reference);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      const freshProducts = await api.getProducts();
      setProducts(freshProducts);
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    const saved = await api.createOrUpdateProduct(productData);
    if (saved) {
      const freshProducts = await api.getProducts();
      setProducts(freshProducts);
    }
  };

  const handleUpdateStock = async (productId: string, stock: number) => {
    const updated = await api.updateStock(productId, stock);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    await handleSaveProduct({ id: product.id, isActive: !product.isActive });
  };

  // Filtered Products for Storefront
  const activeStorefrontProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchIngredients = p.ingredients.some((i) => i.toLowerCase().includes(q));
        const matchBenefits = p.benefits.some((b) => b.toLowerCase().includes(q));
        return matchName || matchDesc || matchIngredients || matchBenefits;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToProducts = () => {
    const el = document.getElementById('apothecary-remedies');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToDelivery = () => {
    const el = document.getElementById('delivery-flow');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // SEPARATE OWNER MANAGEMENT ROUTE: /admin
  // -------------------------------------------------------------
  if (currentRoute === '/admin') {
    return (
      <AdminPage
        orders={orders}
        products={products}
        categories={categories}
        isLoggedIn={isAdminLoggedIn}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onNavigateHome={() => navigateTo('/')}
        onUpdateDeliveryFee={handleUpdateDeliveryFee}
        onUpdateStatus={handleUpdateOrderStatus}
        onConfirmPayment={handleConfirmPayment}
        onSaveProduct={handleSaveProduct}
        onUpdateStock={handleUpdateStock}
        onToggleActive={handleToggleProductActive}
      />
    );
  }

  // -------------------------------------------------------------
  // CLEAN CUSTOMER STOREFRONT ROUTE: /
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-[#242A24]">
      {/* Customer Top Bar (No Admin / Owner Buttons) */}
      <TopBar
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrack={() => setIsTrackOpen(true)}
        onScrollToProducts={scrollToProducts}
        onScrollToDelivery={scrollToDelivery}
      />

      {/* Main Storefront Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onExploreClick={scrollToProducts} />

        {/* Real-World Operational Flow Explanation */}
        <TrustFeatures />

        {/* Product Catalog Section */}
        <section
          id="apothecary-remedies"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[#E8E6DF] pb-4">
            <div>
              <div className="text-xs font-semibold text-[#3A624F] uppercase tracking-wider mb-1">
                Small-Batch Herbal Apothecary
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#172A22] tracking-tight">
                Curated Natural Remedies
              </h2>
            </div>
            <p className="text-xs text-[#5D6B62] max-w-sm">
              Third-party tested pure resins, tinctures, teas, and nutrient-dense powders.
            </p>
          </div>

          {/* Filter Bar with Category Segmented Tabs & Instant Search */}
          <ProductFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Product Grid */}
          <ProductGrid
            products={activeStorefrontProducts}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            addedProductIds={addedProductIds}
          />
        </section>
      </main>

      {/* Footer with Compliance & Medical Health Disclaimer (Zero Admin Links) */}
      <Footer
        onOpenTrack={() => setIsTrackOpen(true)}
        onScrollToProducts={scrollToProducts}
      />

      {/* Quick Floating WhatsApp CTA for Customers */}
      <WhatsAppFloatingButton />

      {/* Customer Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        onDirectWhatsApp={handleDirectWhatsAppCart}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onSubmitOrder={handleSubmitOrder}
      />

      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
        onTrackOrder={(id) => {
          setCompletedOrder(null);
          setTrackOrderId(id);
          setIsTrackOpen(true);
        }}
      />

      <OrderTrackerModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        initialOrderId={trackOrderId}
        onSearchOrder={handleSearchOrder}
      />
    </div>
  );
}
