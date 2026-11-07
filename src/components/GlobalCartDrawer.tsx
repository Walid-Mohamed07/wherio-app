'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  Package,
  Scale,
  Box,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface GlobalCartItem {
  productId: string;
  placeId: string;
  placeNameEn: string;
  placeNameAr: string;
  nameEn: string;
  nameAr: string;
  price: number;
  currency: 'AED' | 'SAR' | 'EGP';
  imageUrl?: string;
  dimensionsCm: { length: number; width: number; height: number };
  weightKg: number;
  handlingFlags?: string[];
  quantity: number;
}

interface CartOptimizationPreview {
  totalItemsCount: number;
  merchantsCount: number;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
  vehicleOptimization: {
    recommendedVehicleType: 'MOTORCYCLE' | 'CAR' | 'MULTI_VEHICLE';
    vehiclesRequiredCount: number;
    fitsSingleMotorcycle: boolean;
    fitsSingleCar: boolean;
    totalVolumeCm3: number;
    totalWeightKg: number;
    motorcycleVolumeUtilizationPct: number;
    carVolumeUtilizationPct: number;
    reasonEn: string;
    reasonAr: string;
  };
  vehicleSpecs?: {
    MOTORCYCLE: {
      boxDimensionsCm: { length: number; width: number; height: number };
      maxUsableVolumeCm3: number;
      maxWeightKg: number;
    };
    CAR: {
      boxDimensionsCm: { length: number; width: number; height: number };
      maxUsableVolumeCm3: number;
      maxWeightKg: number;
    };
  };
}

interface ActiveOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  lifecycleState: string;
  paymentMode: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
  totalVolumeCm3: number;
  totalWeightKg: number;
  createdAt: string;
  subOrders: Array<{
    subOrderId: string;
    placeNameEn: string;
    placeNameAr: string;
    status: string;
    subtotal: number;
    items: Array<{
      productId: string;
      nameEn: string;
      nameAr: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>;
  vehicleRequirement: {
    recommendedVehicleType: 'MOTORCYCLE' | 'CAR' | 'MULTI_VEHICLE';
    vehiclesRequiredCount: number;
    reasonEn: string;
    reasonAr: string;
  };
  assignedRideBatchId?: string;
  externalProviderTrackingCode?: string;
}

/** Pure Vector SVG Icon for Motorcycle Delivery Top-Box (45x45x45 cm) */
export function MotorcycleDeliveryVectorIcon({
  className = 'h-5 w-5',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Rear delivery box */}
      <rect x="2" y="6" width="7" height="6" rx="1.2" />
      <path d="M5.5 6v6" />
      {/* Bike frame & handlebars */}
      <path d="M9 12h4l2.5-5H13" />
      <path d="M15.5 7l2.5 7" />
      <path d="M5.5 12l2 4h6.5" />
      {/* Wheels */}
      <circle cx="6" cy="17.5" r="3" />
      <circle cx="18" cy="17.5" r="3" />
    </svg>
  );
}

/** Pure Vector SVG Icon for Car Trunk Cargo (100x95x50 cm) */
export function CarTrunkVectorIcon({
  className = 'h-5 w-5',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
      {/* Trunk cargo box indicator */}
      <rect x="3.5" y="5" width="4.5" height="3.5" rx="0.7" />
    </svg>
  );
}

/** Compact Animated Header Cart Button with SVG Bag & Live Badge */
export function HeaderCartButton({
  totalItemsCount,
  activeOrdersCount,
  pulse,
  onClick,
  isAr,
}: {
  totalItemsCount: number;
  activeOrdersCount: number;
  pulse: boolean;
  onClick: () => void;
  isAr: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isAr ? 'سلة التسوق والطلبات' : 'Shopping Cart & Orders'}
      className={`relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition-all duration-300 ${
        totalItemsCount > 0
          ? 'border-[#0072DC] bg-[#072549] text-white shadow-sm hover:bg-[#0c3566]'
          : 'border-slate-200 bg-white text-[#072549] hover:border-[#0072DC]'
      } ${pulse ? 'scale-110 ring-4 ring-[#00B89C]/35' : 'scale-100'}`}
    >
      <span className="relative flex items-center justify-center">
        <ShoppingBag
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            pulse ? '-rotate-12 scale-110 text-[#00D2B4]' : totalItemsCount > 0 ? 'text-[#00D2B4]' : 'text-[#0072DC]'
          }`}
        />
        {activeOrdersCount > 0 && totalItemsCount === 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </span>
      <span className="hidden xs:inline">
        {isAr ? 'السلة' : 'Cart'}
      </span>
      <span
        className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black transition-all ${
          totalItemsCount > 0
            ? 'bg-[#FF991F] text-[#072549]'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {totalItemsCount}
      </span>
    </button>
  );
}

export default function GlobalCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onClearCart,
  cityId,
  lang,
  user,
  initialTab = 'cart',
  onActiveOrdersCountChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: GlobalCartItem[];
  onUpdateQty: (item: GlobalCartItem, delta: number) => void;
  onClearCart: () => void;
  cityId: string;
  lang: 'en' | 'ar';
  user?: { id?: string; displayName?: string; phone?: string } | null;
  initialTab?: 'cart' | 'orders';
  onActiveOrdersCountChange?: (count: number) => void;
}) {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>(initialTab);
  const [preview, setPreview] = useState<CartOptimizationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Checkout state
  const [customerName, setCustomerName] = useState(
    user?.displayName || 'Ahmed Al-Mansoori',
  );
  const [customerPhone, setCustomerPhone] = useState(
    user?.phone || '+971501234567',
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    cityId === 'riyadh'
      ? 'Al Olaya District, King Fahd Rd, Tower B, Apt 902'
      : cityId === 'cairo'
        ? 'New Cairo, 5th Settlement, Road 90, Building 14'
        : 'Al Reem Island, Marina Square Tower 4, Apt 1402',
  );
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Active orders state
  const [orders, setOrders] = useState<ActiveOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) setCustomerName(user.displayName);
    if (user?.phone) setCustomerPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch live 3D vehicle optimization preview whenever cart changes
  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    apiFetch<CartOptimizationPreview>('/commerce/cart/preview-optimization', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        })),
      }),
    })
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cart]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await apiFetch<ActiveOrderRecord[]>(
        `/commerce/orders?cityId=${encodeURIComponent(cityId)}`,
      );
      const list = Array.isArray(res) ? res : [];
      setOrders(list);
      onActiveOrdersCountChange?.(list.length);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }, [cityId, onActiveOrdersCountChange]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      loadOrders();
    }
  }, [isOpen, activeTab, loadOrders]);

  if (!isOpen) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const fallbackSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const fallbackVolumeCm3 = cart.reduce(
    (sum, item) =>
      sum +
      (item.dimensionsCm?.length || 25) *
        (item.dimensionsCm?.width || 20) *
        (item.dimensionsCm?.height || 15) *
        item.quantity,
    0,
  );
  const fallbackWeightKg = Number(
    cart
      .reduce((sum, item) => sum + (item.weightKg || 0.5) * item.quantity, 0)
      .toFixed(2),
  );
  const hasOversizedItemForMoto = cart.some((item) => {
    const dim = item.dimensionsCm || { length: 25, width: 20, height: 15 };
    return Math.max(dim.length, dim.width, dim.height) > 45;
  });
  const fallbackFitsMoto =
    !hasOversizedItemForMoto &&
    fallbackVolumeCm3 <= 72900 &&
    fallbackWeightKg <= 18;
  const fallbackFitsCar =
    fallbackVolumeCm3 <= 389500 && fallbackWeightKg <= 120;
  const fallbackVehicleType: 'MOTORCYCLE' | 'CAR' | 'MULTI_VEHICLE' =
    fallbackFitsMoto
      ? 'MOTORCYCLE'
      : fallbackFitsCar
        ? 'CAR'
        : 'MULTI_VEHICLE';

  const vehicleOpt = preview?.vehicleOptimization || {
    recommendedVehicleType: fallbackVehicleType,
    vehiclesRequiredCount: fallbackVehicleType === 'MULTI_VEHICLE' ? 2 : 1,
    fitsSingleMotorcycle: fallbackFitsMoto,
    fitsSingleCar: fallbackFitsCar,
    totalVolumeCm3: fallbackVolumeCm3,
    totalWeightKg: fallbackWeightKg,
    motorcycleVolumeUtilizationPct: Math.min(
      999,
      Math.round((fallbackVolumeCm3 / 72900) * 100),
    ),
    carVolumeUtilizationPct: Math.min(
      999,
      Math.round((fallbackVolumeCm3 / 389500) * 100),
    ),
    reasonEn: fallbackFitsMoto
      ? `Fits inside 1 Motorcycle Delivery Box (${fallbackVolumeCm3.toLocaleString()}/72,900 cm³, ${fallbackWeightKg}/18 kg).`
      : `Upgraded to Car Trunk: ${hasOversizedItemForMoto ? 'Item exceeds 45 cm motorcycle box limit' : 'Volume/weight exceeds motorcycle payload'}.`,
    reasonAr: fallbackFitsMoto
      ? `يناسب صندوق دراجة نارية واحدة (${fallbackVolumeCm3.toLocaleString()}/72,900 سم³، ${fallbackWeightKg}/18 كجم).`
      : `تم التوجيه لسيارة توصيل بسبب أبعاد أو حجم المنتجات.`,
  };

  const currency = cart[0]?.currency || preview?.currency || 'AED';

  // Group cart items by merchant placeId
  const groupedByMerchant = cart.reduce<
    Record<
      string,
      {
        placeId: string;
        placeNameEn: string;
        placeNameAr: string;
        items: GlobalCartItem[];
      }
    >
  >((acc, item) => {
    if (!acc[item.placeId]) {
      acc[item.placeId] = {
        placeId: item.placeId,
        placeNameEn: item.placeNameEn,
        placeNameAr: item.placeNameAr,
        items: [],
      };
    }
    acc[item.placeId].items.push(item);
    return acc;
  }, {});

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    setCheckoutFeedback(null);
    try {
      const res = await apiFetch<{
        messageEn: string;
        messageAr: string;
        order: ActiveOrderRecord;
      }>('/commerce/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user?.id || 'usr-customer-1',
          customerName,
          customerPhone,
          deliveryAddress,
          cityId,
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
          })),
        }),
      });
      setCheckoutFeedback({
        type: 'success',
        text: isAr ? res.messageAr : res.messageEn,
      });
      onClearCart();
      await loadOrders();
      setActiveTab('orders');
    } catch (err) {
      setCheckoutFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Checkout failed',
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const renderOrderStateBadge = (state: string) => {
    const map: Record<
      string,
      { labelEn: string; labelAr: string; cls: string }
    > = {
      CONFIRMED_TEST_MODE: {
        labelEn: 'Confirmed (Test Mode)',
        labelAr: 'مؤكد (الوضع التجريبي)',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      PREPARING_AT_MERCHANT: {
        labelEn: 'Preparing at Merchant',
        labelAr: 'قيد التحضير لدى المتجر',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      READY_FOR_PICKUP: {
        labelEn: 'Ready for Pickup',
        labelAr: 'جاهز للاستلام',
        cls: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      OPTIMIZED_FOR_DISPATCH: {
        labelEn: '3D Vehicle Batch Optimized',
        labelAr: 'تم تحسين مركبة التوصيل',
        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      DISPATCHED_TO_PROVIDER: {
        labelEn: 'Dispatched to Talabat',
        labelAr: 'تم الإرسال لمزود التوصيل (طلبات)',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      OUT_FOR_DELIVERY: {
        labelEn: 'Out for Delivery',
        labelAr: 'في الطريق إليك',
        cls: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      DELIVERED: {
        labelEn: 'Delivered',
        labelAr: 'تم التوصيل',
        cls: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      },
    };
    const info = map[state] || {
      labelEn: state,
      labelAr: state,
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${info.cls}`}
      >
        <Clock className="h-3 w-3" />
        {isAr ? info.labelAr : info.labelEn}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
        {/* Top Drawer Header */}
        <div className="bg-gradient-to-r from-[#072549] via-[#0b3568] to-[#0072DC] px-4 py-3.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
                <ShoppingBag className="h-5 w-5 text-[#00D2B4]" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">
                  {isAr
                    ? 'سلة ويريو الموحدة ومتابعة الطلبات'
                    : 'Wherio Unified Cart & Live Orders'}
                </h2>
                <p className="text-[11px] text-slate-200">
                  {isAr
                    ? 'طلب متعدد المتاجر مع حساب أبعاد مركبة التوصيل (دراجة / سيارة)'
                    : 'Multi-store cart with 3D delivery vehicle box optimization'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
              aria-label="Close Cart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 2 Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-950/30 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-extrabold transition ${
                activeTab === 'cart'
                  ? 'bg-white text-[#072549] shadow-xs'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>
                {isAr ? 'السلة وإتمام الطلب' : 'Active Cart'} ({totalItemsCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-extrabold transition ${
                activeTab === 'orders'
                  ? 'bg-white text-[#072549] shadow-xs'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>
                {isAr ? 'طلباتي وحالتها' : 'My Orders'} ({orders.length})
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {checkoutFeedback && (
          <div
            className={`mx-4 mt-3 flex items-center justify-between rounded-2xl border p-3 text-xs font-bold ${
              checkoutFeedback.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-rose-300 bg-rose-50 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {checkoutFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{checkoutFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutFeedback(null)}
              className="text-[11px] underline"
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {activeTab === 'cart' ? (
            cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-extrabold text-slate-800">
                  {isAr ? 'سلة التسوق فارغة حالياً' : 'Your cart is currently empty'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isAr
                    ? 'افتح أي مطعم أو متجر أو كافيه من صفحة "استكشف"، ثم انتقل إلى تبويب "القوائم والملصقات" لإضافة المنتجات إلى السلة.'
                    : 'Open any restaurant, cafe, or market from Explore and visit its "Menus & Posters" tab to add items to your cart.'}
                </p>
              </div>
            ) : (
              <>
                {/* Grouped by Merchant Sub-Orders */}
                <div className="space-y-3">
                  {Object.values(groupedByMerchant).map((group) => (
                    <div
                      key={group.placeId}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
                    >
                      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-[#0072DC]" />
                          <span className="text-xs font-extrabold text-[#072549]">
                            {isAr ? group.placeNameAr : group.placeNameEn}
                          </span>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {group.items.reduce((s, i) => s + i.quantity, 0)}{' '}
                          {isAr ? 'عناصر' : 'items'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {group.items.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 p-2"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={isAr ? item.nameAr : item.nameEn}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-extrabold text-slate-900">
                                {isAr ? item.nameAr : item.nameEn}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                <span className="inline-flex items-center gap-0.5">
                                  <Box className="h-3 w-3 text-slate-400" />
                                  {item.dimensionsCm.length}×
                                  {item.dimensionsCm.width}×
                                  {item.dimensionsCm.height} cm
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Scale className="h-3 w-3 text-slate-400" />
                                  {item.weightKg} kg
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-black text-[#0072DC]">
                                {item.price * item.quantity} {item.currency}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item, -1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                                aria-label="Decrease quantity"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <span className="min-w-[20px] text-center text-xs font-black text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item, 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#072549] text-white hover:bg-[#0d386b]"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live 3D Delivery Vehicle Box Fit Card (Pure Vector Icons) */}
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-[#072549] to-slate-900 p-3.5 text-white shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#00D2B4]">
                        {vehicleOpt.recommendedVehicleType === 'MOTORCYCLE' ? (
                          <MotorcycleDeliveryVectorIcon className="h-5 w-5" />
                        ) : (
                          <CarTrunkVectorIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                          {isAr
                            ? 'تحليل سعة مركبة التوصيل ثلاثي الأبعاد'
                            : '3D Delivery Vehicle Box Fit'}
                        </span>
                        <h4 className="text-xs font-black text-white">
                          {vehicleOpt.recommendedVehicleType === 'MOTORCYCLE'
                            ? isAr
                              ? 'صندوق دراجة نارية واحدة (45×45×45 سم)'
                              : '1× Motorcycle Top-Box (45×45×45 cm)'
                            : vehicleOpt.recommendedVehicleType === 'CAR'
                              ? isAr
                                ? 'صندوق سيارة توصيل (100×95×50 سم)'
                                : '1× Car Trunk Cargo (100×95×50 cm)'
                              : isAr
                                ? `${vehicleOpt.vehiclesRequiredCount || 2}× مركبات توصيل`
                                : `${vehicleOpt.vehiclesRequiredCount || 2}× Split Delivery Vehicles`}
                        </h4>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#00B89C]/20 px-2.5 py-1 text-[10px] font-extrabold text-[#00D2B4]">
                      {previewLoading
                        ? '...'
                        : `${vehicleOpt.totalWeightKg} kg`}
                    </span>
                  </div>

                  {/* Volume & Utilization Bars */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/10 p-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-200">
                          <MotorcycleDeliveryVectorIcon className="h-3.5 w-3.5 text-[#00D2B4]" />
                          {isAr ? 'سعة الدراجة' : 'Moto Box'}
                        </span>
                        <span className="font-extrabold">
                          {vehicleOpt.motorcycleVolumeUtilizationPct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            vehicleOpt.fitsSingleMotorcycle
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                          }`}
                          style={{
                            width: `${Math.min(100, vehicleOpt.motorcycleVolumeUtilizationPct)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-200">
                          <CarTrunkVectorIcon className="h-3.5 w-3.5 text-amber-300" />
                          {isAr ? 'صندوق السيارة' : 'Car Trunk'}
                        </span>
                        <span className="font-extrabold">
                          {vehicleOpt.carVolumeUtilizationPct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{
                            width: `${Math.min(100, vehicleOpt.carVolumeUtilizationPct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-2.5 text-[11px] leading-relaxed text-indigo-100">
                    {isAr ? vehicleOpt.reasonAr : vehicleOpt.reasonEn}
                  </p>
                </div>

                {/* Test-Mode Checkout Form */}
                <form
                  onSubmit={handleCheckout}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-[#072549]">
                      <ShieldCheck className="h-4 w-4 text-[#00B89C]" />
                      {isAr
                        ? 'بيانات التوصيل وإتمام الطلب (الوضع التجريبي)'
                        : 'Delivery Details & Test-Mode Checkout'}
                    </h4>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                      TEST MODE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">
                        {isAr ? 'الاسم' : 'Recipient Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">
                        {isAr ? 'رقم الجوال' : 'Phone Number'}
                      </label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <MapPin className="h-3 w-3 text-[#0072DC]" />
                      {isAr ? 'عنوان التوصيل' : 'Delivery Address'}
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Totals Breakdown */}
                  <div className="space-y-1 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {isAr ? 'المجموع الفرعي' : 'Items Subtotal'} (
                        {Object.keys(groupedByMerchant).length}{' '}
                        {isAr ? 'متاجر' : 'merchants'})
                      </span>
                      <span className="font-bold">
                        {preview?.subtotal ?? fallbackSubtotal} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {isAr
                          ? 'رسوم التوصيل (حسب المركبة)'
                          : 'Optimized Vehicle Delivery Fee'}
                      </span>
                      <span className="font-bold">
                        {preview?.deliveryFee ?? 12} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-black text-[#072549]">
                      <span>{isAr ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                      <span>
                        {preview?.grandTotal ?? fallbackSubtotal + 12}{' '}
                        {currency}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0072DC] to-[#00B89C] py-3 text-xs font-extrabold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {checkoutSubmitting
                        ? isAr
                          ? 'جاري تأكيد الطلب...'
                          : 'Confirming Test Order...'
                        : isAr
                          ? 'إتمام الطلب الآن (وضع الاختبار - بدون بوابة دفع)'
                          : 'Proceed to Checkout (Test Mode — No Payment Gateway)'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </>
            )
          ) : (
            /* TAB 2: MY ORDERS & LIVE STATE TRACKER */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800">
                  {isAr
                    ? 'حالة الطلبات الحالية ومزود التوصيل (طلبات)'
                    : 'Active Orders & Talabat Dispatch Status'}
                </h3>
                <button
                  type="button"
                  onClick={loadOrders}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${ordersLoading ? 'animate-spin' : ''}`}
                  />
                  {isAr ? 'تحديث' : 'Refresh'}
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Truck className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-700">
                    {isAr
                      ? 'لا توجد طلبات مسجلة في هذه المدينة بعد.'
                      : 'No orders placed in this city yet.'}
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black text-[#072549]">
                          {order.orderNumber}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {order.deliveryAddress}
                        </p>
                      </div>
                      {renderOrderStateBadge(
                        order.lifecycleState ||
                          (order as any).state ||
                          'CONFIRMED_TEST_MODE',
                      )}
                    </div>

                    {/* Vehicle Fit Summary */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        {(order.vehicleRequirement?.recommendedVehicleType ||
                          (order as any).recommendedSingleOrderVehicle) ===
                        'MOTORCYCLE' ? (
                          <MotorcycleDeliveryVectorIcon className="h-4 w-4 text-[#0072DC]" />
                        ) : (
                          <CarTrunkVectorIcon className="h-4 w-4 text-amber-600" />
                        )}
                        <span>
                          {(order.vehicleRequirement?.recommendedVehicleType ||
                            (order as any).recommendedSingleOrderVehicle) ===
                          'MOTORCYCLE'
                            ? isAr
                              ? 'دراجة نارية (45×45×45 سم)'
                              : 'Motorcycle Box (45×45×45 cm)'
                            : isAr
                              ? 'صندوق سيارة (100×95×50 سم)'
                              : 'Car Trunk (100×95×50 cm)'}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#072549]">
                        {order.grandTotal ??
                          (order as any).totalAmount ??
                          order.subtotal}{' '}
                        {order.currency}
                      </span>
                    </div>

                    {/* Sub-orders breakdown */}
                    <div className="space-y-1">
                      {order.subOrders.map((sub) => (
                        <div
                          key={sub.subOrderId}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5 text-[11px]"
                        >
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Layers className="h-3 w-3 text-[#0072DC]" />
                            {isAr ? sub.placeNameAr : sub.placeNameEn} (
                            {sub.items.reduce((s, i) => s + i.quantity, 0)})
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.externalProviderTrackingCode && (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {isAr
                            ? 'رقم تتبع مزود التوصيل (طلبات):'
                            : 'Talabat Dispatch Tracking:'}
                        </span>
                        <span className="font-mono font-black">
                          {order.externalProviderTrackingCode}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
