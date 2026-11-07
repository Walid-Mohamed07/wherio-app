'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Video,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface SmartParkingAndStoreHubProps {
  mode: 'parking' | 'store';
  cityId: string;
  isAr: boolean;
  currentUser?: any;
}

export default function SmartParkingAndStoreHub({
  mode,
  cityId,
  isAr,
  currentUser,
}: SmartParkingAndStoreHubProps) {
  // Parking State
  const [parkingPlaces, setParkingPlaces] = useState<any[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>(
    currentUser?.name || 'Omar Al-Nuaimi',
  );
  const [driverPhone, setDriverPhone] = useState<string>(
    currentUser?.phone || '+971504445566',
  );
  const [vehiclePlate, setVehiclePlate] = useState<string>('AUH-77420');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [reserving, setReserving] = useState(false);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // E-Commerce Store & Cart State
  const [catalog, setCatalog] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartPreview, setCartPreview] = useState<any | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    cityId === 'riyadh'
      ? 'Al Olaya Towers, King Fahd Rd, Riyadh'
      : 'Ansam Residences, Yas Island, Abu Dhabi',
  );
  const [checkingOut, setCheckingOut] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const loadHubData = async () => {
    try {
      const [pkRes, myRes, catRes, ordRes] = await Promise.all([
        fetch(`${API_BASE_URL}/parking/places?cityId=${cityId}`).then((r) =>
          r.json(),
        ),
        fetch(`${API_BASE_URL}/parking/reservations`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/commerce/catalog?cityId=${cityId}`).then((r) =>
          r.json(),
        ),
        fetch(`${API_BASE_URL}/commerce/orders?cityId=${cityId}`).then((r) =>
          r.json(),
        ),
      ]);

      const pkList = Array.isArray(pkRes) ? pkRes : [];
      setParkingPlaces(pkList);
      if (
        pkList.length > 0 &&
        (!selectedParkingId ||
          !pkList.some((p: any) => p.placeId === selectedParkingId))
      ) {
        setSelectedParkingId(pkList[0].placeId);
      }
      setMyReservations(Array.isArray(myRes) ? myRes : []);
      setCatalog(Array.isArray(catRes) ? catRes : []);
      setOrders(Array.isArray(ordRes) ? ordRes : []);
    } catch (e) {
      console.error('Failed to load Parking/Store Hub:', e);
    }
  };

  useEffect(() => {
    loadHubData();
  }, [cityId, mode]);

  // Live 3D Cart Fit Preview whenever cart changes
  useEffect(() => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setCartPreview(null);
      return;
    }

    fetch(`${API_BASE_URL}/commerce/cart/preview-optimization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data) => setCartPreview(data))
      .catch(() => {});
  }, [cart]);

  const activeParking =
    parkingPlaces.find((p) => p.placeId === selectedParkingId) ||
    parkingPlaces[0];

  const handleReserveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParking) return;
    setReserving(true);
    setFeedbackBanner(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/parking/places/${activeParking.placeId}/reserve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slotId: selectedSlotId || undefined,
            userName: driverName,
            userPhone: driverPhone,
            vehiclePlate,
            durationHours,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data?.reservation) {
        setFeedbackBanner(
          (isAr ? data?.messageAr : data?.messageEn) ||
            (isAr ? 'تعذر حجز الموقف.' : 'Could not reserve slot.'),
        );
      } else {
        setFeedbackBanner(
          isAr
            ? `تم حجز الموقف ${data.reservation.slotId} بنجاح! الموقف مقفل لك لمدة 15 دقيقة لحين الوصول.`
            : `Reserved slot ${data.reservation.slotId}! Locked as RESERVED for 15 minutes until arrival.`,
        );
        setSelectedSlotId('');
        await loadHubData();
      }
    } finally {
      setReserving(false);
    }
  };

  const handleReservationCheckInOrCancel = async (
    resId: string,
    action: 'check-in' | 'cancel',
  ) => {
    await fetch(`${API_BASE_URL}/parking/reservations/${resId}/${action}`, {
      method: 'POST',
    });
    setFeedbackBanner(
      action === 'check-in'
        ? isAr
          ? 'تم تسجيل وصول مركبتك للموقف المحجوز بنجاح!'
          : 'Checked in! Your reserved slot is now marked OCCUPIED by your vehicle.'
        : isAr
          ? 'تم إلغاء الحجز وإتاحة الموقف.'
          : 'Reservation cancelled and slot released.',
    );
    await loadHubData();
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[productId] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleCheckoutTestMode = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;

    setCheckingOut(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch(`${API_BASE_URL}/commerce/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: driverName || 'Omar Al-Nuaimi',
          customerPhone: driverPhone || '+971504445566',
          deliveryAddress,
          cityId,
          items,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.order) {
        setCart({});
        setFeedbackBanner(
          isAr
            ? `تم تأكيد الطلب ${data.order.orderNumber} (الوضع التجريبي)! المركبة الموصى بها حسب الأبعاد: ${data.order.recommendedSingleOrderVehicle}`
            : `Order ${data.order.orderNumber} confirmed (Test Mode)! 3D Vehicle Match: ${data.order.recommendedSingleOrderVehicle}`,
        );
        await loadHubData();
      }
    } finally {
      setCheckingOut(false);
    }
  };

  // ===========================================================================
  // VIEW 1: SMART PARKING LIVE CAMERA AI MONITOR & SLOT RESERVATION
  // ===========================================================================
  if (mode === 'parking') {
    return (
      <div className="space-y-4 pb-24">
        {/* Header Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#072549] via-[#0A2E5C] to-[#0072DC] p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00D2B4]/20 px-2.5 py-0.5 text-[10px] font-extrabold text-[#00D2B4]">
              <Video className="h-3.5 w-3.5" />
              {isAr
                ? 'مراقبة الكاميرات وحجز المواقف الفوري'
                : 'LIVE CAMERA AI SLOT MONITOR & RESERVATION'}
            </span>
            <button
              onClick={loadHubData}
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <h2 className="mt-2 text-base font-extrabold">
            {isAr
              ? 'احجز موقف سيارتك قبل الوصول'
              : 'Reserve Your Parking Slot Before You Arrive'}
          </h2>
          <p className="mt-1 text-[11px] text-sky-100">
            {isAr
              ? 'شاهد عدد وأرقام المواقف المتاحة مباشرة عبر كاميرات الذكاء الاصطناعي واحجز موقفك مع مهلة وصول 15 دقيقة.'
              : 'View real-time available slot IDs detected by parking cameras and lock your slot with a 15-minute arrival grace period.'}
          </p>
        </div>

        {feedbackBanner && (
          <div className="rounded-2xl border border-[#00B89C] bg-emerald-50 p-3 text-xs font-extrabold text-[#072549]">
            {feedbackBanner}
          </div>
        )}

        {/* Parking Area Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {parkingPlaces.map((pk) => {
            const active = activeParking?.placeId === pk.placeId;
            return (
              <button
                key={pk.placeId}
                onClick={() => {
                  setSelectedParkingId(pk.placeId);
                  setSelectedSlotId('');
                }}
                className={`shrink-0 rounded-2xl border px-3.5 py-2 text-left text-xs transition ${
                  active
                    ? 'border-[#072549] bg-[#072549] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="font-extrabold">
                  {isAr ? pk.placeNameAr : pk.placeNameEn}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] opacity-85">
                  <span className="font-bold text-[#00D2B4]">
                    {pk.availableSlotsCount}/{pk.totalSlots}{' '}
                    {isAr ? 'متاح' : 'Available'}
                  </span>
                  <span>•</span>
                  <span>
                    {pk.managementMode === 'CAMERA_AI'
                      ? '📹 AI Camera'
                      : '🛠️ Manual'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {activeParking && (
          <>
            {/* Camera Feed Status & Slot Availability Counter */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <div className="relative h-36 w-full bg-slate-900">
                <img
                  src={activeParking.cameraSnapshotUrl}
                  alt={activeParking.placeNameEn}
                  className="h-full w-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-extrabold text-white">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeParking.managementMode === 'CAMERA_AI'
                        ? 'animate-pulse bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {activeParking.managementMode === 'CAMERA_AI'
                      ? isAr
                        ? 'مراقبة تلقائية بالكاميرا والذكاء الاصطناعي'
                        : 'AI CAMERA VEHICLE DETECTION LIVE'
                      : isAr
                        ? 'إدارة إشرافية مباشرة'
                        : 'MANAGED PARKING AREA'}
                  </span>
                </div>
                <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {isAr
                        ? activeParking.placeNameAr
                        : activeParking.placeNameEn}
                    </h3>
                    <p className="text-[10px] text-sky-200">
                      {isAr
                        ? `إجمالي المواقف: ${activeParking.totalSlots} • متاح الآن: ${activeParking.availableSlotsCount}`
                        : `Total: ${activeParking.totalSlots} slots • Available now: ${activeParking.availableSlotsCount}`}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#00B89C] px-2.5 py-1 text-[11px] font-extrabold text-slate-950">
                    {activeParking.hourlyRate} {activeParking.currency}/hr
                  </span>
                </div>
              </div>

              {/* Interactive Slot Grid */}
              <div className="p-3.5">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-[#072549]">
                    {isAr
                      ? 'اضغط على أي موقف أخضر متاح لحجزه:'
                      : 'Tap an AVAILABLE (green) slot to reserve it:'}
                  </span>
                  <span className="text-slate-500">
                    {selectedSlotId
                      ? `${isAr ? 'المحدد:' : 'Selected:'} ${selectedSlotId}`
                      : isAr
                        ? 'تعيين تلقائي لأفضل موقف'
                        : 'Auto-assigns if none tapped'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {activeParking.slots?.map((slot: any) => {
                    const isAvail = slot.status === 'AVAILABLE';
                    const isRes = slot.status === 'RESERVED';
                    const isSelected = selectedSlotId === slot.slotId;

                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        disabled={!isAvail}
                        onClick={() =>
                          setSelectedSlotId(
                            isSelected ? '' : String(slot.slotId),
                          )
                        }
                        className={`rounded-xl border-2 p-2 text-left transition ${
                          isSelected
                            ? 'border-[#0072DC] bg-[#0072DC] text-white shadow-sm'
                            : isAvail
                              ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 hover:border-emerald-500'
                              : isRes
                                ? 'cursor-not-allowed border-amber-300 bg-amber-50/70 text-amber-900 opacity-75'
                                : 'cursor-not-allowed border-rose-200 bg-rose-50/60 text-rose-900 opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-extrabold">
                            {slot.slotId}
                          </span>
                          <span className="text-[9px] font-bold opacity-80">
                            #{slot.slotNumber}
                          </span>
                        </div>
                        <div className="mt-1 text-[9px] font-bold">
                          {isAvail
                            ? isAr
                              ? '✓ متاح'
                              : '✓ AVAILABLE'
                            : isRes
                              ? isAr
                                ? '🔒 محجوز'
                                : '🔒 RESERVED'
                              : isAr
                                ? '🚗 مشغول'
                                : '🚗 OCCUPIED'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Apply for Parking Slot Reservation Form */}
            <form
              onSubmit={handleReserveSlot}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <h4 className="text-xs font-extrabold text-[#072549]">
                {isAr
                  ? 'بيانات طلب حجز الموقف (قفل فوري لمدة 15 دقيقة)'
                  : 'Apply for Slot Reservation (Immediate 15-Min Lock)'}
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-600">
                    {isAr ? 'اسم السائق' : 'Driver Name'}
                  </label>
                  <input
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-600">
                    {isAr ? 'رقم لوحة المركبة' : 'Vehicle Plate Number'}
                  </label>
                  <input
                    required
                    value={vehiclePlate}
                    onChange={(e) =>
                      setVehiclePlate(e.target.value.toUpperCase())
                    }
                    placeholder="AUH-77420"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-600">
                    {isAr ? 'رقم الجوال' : 'Phone Number'}
                  </label>
                  <input
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-600">
                    {isAr ? 'مدة الوقوف (ساعات)' : 'Duration (Hours)'}
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 6, 12].map((h) => (
                      <option key={h} value={h}>
                        {h} {isAr ? 'ساعة' : 'Hour(s)'} (
                        {h * (activeParking.hourlyRate || 10)}{' '}
                        {activeParking.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={reserving || activeParking.availableSlotsCount === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0072DC] py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#072549] disabled:opacity-50"
              >
                <Car className="h-4 w-4" />
                <span>
                  {reserving
                    ? isAr
                      ? 'جاري تأكيد الحجز...'
                      : 'Locking Slot...'
                    : selectedSlotId
                      ? isAr
                        ? `تأكيد حجز الموقف ${selectedSlotId}`
                        : `Reserve Slot ${selectedSlotId} Now`
                      : isAr
                        ? 'حجز أقرب موقف متاح الآن'
                        : 'Reserve Best Available Slot Now'}
                </span>
              </button>
            </form>

            {/* User's Active Parking Reservations */}
            {myReservations.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-extrabold text-[#072549]">
                  {isAr ? 'حجوزات المواقف الخاصة بك' : 'Your Parking Reservations'}
                </h4>
                {myReservations.slice(0, 4).map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#072549] px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                          {r.slotId}
                        </span>
                        <span className="font-extrabold text-[#072549]">
                          {isAr ? r.placeNameAr : r.placeNameEn}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Plate: <strong>{r.vehiclePlate}</strong> • Status:{' '}
                        <strong>{r.status}</strong>
                      </p>
                    </div>

                    {r.status === 'RESERVED' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleReservationCheckInOrCancel(r.id, 'check-in')
                          }
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-extrabold text-white"
                        >
                          {isAr ? 'وصلت للموقف' : 'I Arrived'}
                        </button>
                        <button
                          onClick={() =>
                            handleReservationCheckInOrCancel(r.id, 'cancel')
                          }
                          className="rounded-lg bg-rose-100 px-2 py-1.5 text-[10px] font-extrabold text-rose-700"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ===========================================================================
  // VIEW 2: E-COMMERCE STORE, MULTI-MERCHANT CART & 3D VEHICLE CHECKOUT
  // ===========================================================================
  const filteredCatalog = catalog.filter((item) =>
    categoryFilter === 'ALL' ? true : item.merchantType === categoryFilter,
  );
  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 pb-28">
      {/* Store Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#072549] via-[#0A2E5C] to-[#00B89C] p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold">
            <ShoppingBag className="h-3.5 w-3.5" />
            {isAr
              ? 'متجر ويريو متعدد المتاجر + تحسين التوصيل 3D'
              : 'MULTI-STORE CART & 3D VEHICLE OPTIMIZER'}
          </span>
          <span className="rounded-lg bg-slate-950/40 px-2.5 py-1 text-[10px] font-extrabold">
            {cartTotalItems} {isAr ? 'منتجات في السلة' : 'items in cart'}
          </span>
        </div>
        <h2 className="mt-2 text-base font-extrabold">
          {isAr
            ? 'اطلب من المطاعم، السوبرماركت، والصيدليات في سلة واحدة'
            : 'Shop Restaurants, Groceries & Pharmacies in One Cart'}
        </h2>
        <p className="mt-1 text-[11px] text-sky-100">
          {isAr
            ? 'يطابق النظام أبعاد ووزن مشترياتك تلقائياً مع صندوق الدراجة النارية (45×45×45 سم) أو صندوق السيارة (100×95×50 سم).'
            : 'Our engine matches item 3D dimensions & weights against Motorcycle Box (45×45×45 cm) vs. Car Trunk (100×95×50 cm).'}
        </p>
      </div>

      {feedbackBanner && (
        <div className="rounded-2xl border border-[#00B89C] bg-emerald-50 p-3 text-xs font-extrabold text-[#072549]">
          {feedbackBanner}
        </div>
      )}

      {/* Store Type Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', labelEn: 'All Stores', labelAr: 'الكل' },
          { id: 'MARKET', labelEn: '🛒 Markets & Groceries', labelAr: '🛒 مقاضي وسوبرماركت' },
          { id: 'RESTAURANT', labelEn: '🍽️ Restaurants', labelAr: '🍽️ مطاعم' },
          { id: 'PHARMACY', labelEn: '💊 Pharmacies', labelAr: '💊 صيدليات' },
          { id: 'CAFE', labelEn: '☕ Specialty Cafes', labelAr: '☕ مقاهي' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              categoryFilter === tab.id
                ? 'bg-[#072549] text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Product Cards */}
      <div className="space-y-3">
        {filteredCatalog.map((prod) => {
          const qty = cart[prod.id] || 0;
          return (
            <div
              key={prod.id}
              className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs"
            >
              <img
                src={prod.imageUrl}
                alt={prod.nameEn}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#0072DC]">
                      {prod.merchantType} •{' '}
                      {isAr ? prod.placeNameAr : prod.placeNameEn}
                    </span>
                    <h3 className="mt-1 text-xs font-extrabold text-[#072549]">
                      {isAr ? prod.nameAr : prod.nameEn}
                    </h3>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold text-[#00B89C]">
                    {prod.price} {prod.currency}
                  </span>
                </div>

                {/* 3D Dimensions & Weight Badge */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-700">
                    📦 {prod.dimensionsCm.length}×{prod.dimensionsCm.width}×
                    {prod.dimensionsCm.height} cm
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-700">
                    ⚖️ {prod.weightKg} kg
                  </span>
                  {prod.handlingFlags?.map((f: string) => (
                    <span
                      key={f}
                      className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Add / Quantity Controls */}
                <div className="mt-2.5 flex items-center justify-end">
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => updateCartQty(prod.id, 1)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#072549] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#0072DC]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-[#0072DC] bg-sky-50 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(prod.id, -1)}
                        className="rounded-lg bg-white p-1 text-[#072549] shadow-2xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[20px] text-center text-xs font-extrabold text-[#072549]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(prod.id, 1)}
                        className="rounded-lg bg-[#0072DC] p-1 text-white shadow-2xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Cart & 3D Delivery Vehicle Preview + Test Mode Checkout */}
      {cartTotalItems > 0 && cartPreview && (
        <form
          onSubmit={handleCheckoutTestMode}
          className="rounded-2xl border-2 border-[#0072DC] bg-white p-4 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#0072DC]" />
              <h3 className="text-xs font-extrabold text-[#072549]">
                {isAr
                  ? `ملخص السلة وتحليل مركبة التوصيل (${cartPreview.merchantsCount} متجر)`
                  : `Cart & 3D Vehicle Fit (${cartPreview.merchantsCount} Merchant Sub-Order(s))`}
              </h3>
            </div>
            <span className="rounded-lg bg-[#072549] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
              {cartPreview.recommendedVehicle === 'MOTORCYCLE'
                ? '🏍️ 1 MOTORCYCLE'
                : '🚗 1 CAR TRUNK'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700 space-y-1">
            <p className="font-extrabold text-[#0072DC]">
              {isAr ? cartPreview.reasonAr : cartPreview.reasonEn}
            </p>
            <p className="text-[10px] text-slate-500">
              Volume: <strong>{cartPreview.totalVolumeCm3?.toLocaleString()} cm³</strong>{' '}
              (Moto Box: {cartPreview.motorcycleUtilizationPercent}% • Car Trunk:{' '}
              {cartPreview.carTrunkUtilizationPercent}%) • Weight:{' '}
              <strong>{cartPreview.totalWeightKg} kg</strong>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-600">
              {isAr ? 'عنوان التوصيل' : 'Delivery Drop-off Address'}
            </label>
            <input
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={checkingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B89C] py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#072549]"
          >
            <Truck className="h-4 w-4" />
            <span>
              {checkingOut
                ? isAr
                  ? 'جاري إتمام الطلب...'
                  : 'Placing Test Order...'
                : isAr
                  ? `إتمام الطلب الآن (الوضع التجريبي — ${cartPreview.subtotal} درهم/ريال)`
                  : `Proceed to Checkout (Test Mode — Subtotal ${cartPreview.subtotal})`}
            </span>
          </button>
        </form>
      )}

      {/* Recent Orders & State Machine Tracker */}
      {orders.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
          <h4 className="text-xs font-extrabold text-[#072549]">
            {isAr
              ? 'متابعة حالة طلباتك وتوصيل Talabat'
              : 'Your Orders & Live Delivery State Machine'}
          </h4>
          {orders.slice(0, 4).map((ord: any) => (
            <div
              key={ord.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-[#072549]">
                  {ord.orderNumber}
                </span>
                <span className="rounded bg-[#0072DC] px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {ord.state}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {ord.subOrders?.length} store sub-order(s) • Total:{' '}
                <strong>
                  {ord.totalAmount} {ord.currency}
                </strong>{' '}
                • Vehicle: <strong>{ord.recommendedSingleOrderVehicle}</strong>
              </p>
              {ord.externalProviderDispatch && (
                <p className="rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold text-orange-800">
                  🚀 Dispatched to {ord.externalProviderDispatch.providerName} •
                  Tracking: {ord.externalProviderDispatch.externalTrackingId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
