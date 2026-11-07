'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Car,
  Footprints,
  Image as ImageIcon,
  Flag,
  ExternalLink,
  AlertTriangle,
  Globe,
  Camera,
  Wrench,
  Lock,
  Zap,
  Crown,
  Accessibility,
  ShoppingBag,
  Plus,
  Minus,
  Box,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { AwfarApi, apiFetch, CountryCode, LangCode } from '@/lib/api';
import { GlobalCartItem } from './GlobalCartDrawer';

interface PlaceAndDealDrawerProps {
  placeId?: string | null;
  country: CountryCode;
  lang: LangCode;
  userCoords: { lat: number; lng: number };
  currentUser: {
    id: string;
    name: string;
    phone: string;
    email: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
  };
  isAuthenticated: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
  onRequireAuth: () => void;
  onRequireVerifyEmail?: () => void;
  onClose: () => void;
  initialTab?: 'overview' | 'parking' | 'media' | 'reviews';
  cart?: GlobalCartItem[];
  onUpdateCartItem?: (item: GlobalCartItem, delta: number) => void;
  onOpenCart?: () => void;
  onParkingUpdated?: () => void;
}

export default function PlaceAndDealDrawer({
  placeId,
  country,
  lang,
  userCoords,
  currentUser,
  isAuthenticated,
  isFavorite = false,
  onToggleFavorite,
  onRequireAuth,
  onRequireVerifyEmail,
  onClose,
  initialTab = 'overview',
  cart = [],
  onUpdateCartItem,
  onOpenCart,
  onParkingUpdated,
}: PlaceAndDealDrawerProps) {
  const isAr = lang === 'ar';
  const [loading, setLoading] = useState(true);
  const [placeData, setPlaceData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'parking' | 'media' | 'reviews'
  >(initialTab);

  // Parking reservation state (when viewing a cat-parking spot)
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState('AD-58291');
  const [durationHours, setDurationHours] = useState(2);
  const [reservingSlot, setReservingSlot] = useState(false);
  const [parkingFeedback, setParkingFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeParkingReservations, setActiveParkingReservations] = useState<
    any[]
  >([]);

  // Review & 4 Sub-Ratings state
  const [reviewRating, setReviewRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [atmosphereRating, setAtmosphereRating] = useState(5);
  const [facilitiesValueRating, setFacilitiesValueRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<any | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportedReviewIds, setReportedReviewIds] = useState<string[]>([]);

  const loadDetails = async () => {
    if (!placeId) return;
    setLoading(true);
    try {
      const p = await AwfarApi.getPlaceById(
        placeId,
        country,
        lang,
        userCoords.lat,
        userCoords.lng,
      );
      setPlaceData(p);

      if (p?.categoryId === 'cat-parking' || p?.parkingConfig) {
        if (initialTab === 'parking') {
          setActiveTab('parking');
        }
        try {
          const detail = await apiFetch<any>(`/parking/places/${p.id}`);
          if (detail) {
            setPlaceData((prev: any) =>
              prev ? { ...prev, parkingConfig: detail } : prev,
            );
            setActiveParkingReservations(detail.reservations || []);
          }
        } catch {
          // ignore
        }
      }

      // Pre-fill if current user already has an editable review on this place
      const existingRev = p?.reviews?.find(
        (r: any) => r.userId === currentUser.id,
      );
      if (existingRev) {
        setReviewRating(existingRev.rating || 5);
        setQualityRating(existingRev.subRatings?.quality || 5);
        setServiceRating(existingRev.subRatings?.service || 5);
        setAtmosphereRating(existingRev.subRatings?.atmosphere || 5);
        setFacilitiesValueRating(existingRev.subRatings?.facilitiesValue || 5);
        setReviewComment(
          isAr ? existingRev.commentAr : existingRev.commentEn || '',
        );
        setReviewPhotoUrl(existingRev.photos?.[0] || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
    loadDetails();
  }, [placeId, country, lang, initialTab]);

  const handleReserveParkingSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeData?.id) return;
    setReservingSlot(true);
    setParkingFeedback(null);
    try {
      const res = await apiFetch<{
        messageEn: string;
        messageAr: string;
        parkingConfig: any;
      }>(`/parking/places/${placeData.id}/reserve`, {
        method: 'POST',
        body: JSON.stringify({
          slotId: selectedSlotId || undefined,
          userId: currentUser.id,
          userName: currentUser.name || 'Wherio Member',
          userPhone: currentUser.phone || '+971501234567',
          vehiclePlate,
          durationHours,
        }),
      });
      setParkingFeedback({
        type: 'success',
        text: isAr ? res.messageAr : res.messageEn,
      });
      setSelectedSlotId('');
      await loadDetails();
      onParkingUpdated?.();
    } catch (err: any) {
      setParkingFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Reservation failed',
      });
    } finally {
      setReservingSlot(false);
    }
  };

  const handleParkingReservationAction = async (
    reservationId: string,
    action: 'check-in' | 'cancel',
  ) => {
    try {
      const res = await apiFetch<{ messageEn: string; messageAr: string }>(
        `/parking/reservations/${reservationId}/${action}`,
        { method: 'POST' },
      );
      setParkingFeedback({
        type: 'success',
        text: isAr ? res.messageAr : res.messageEn,
      });
      await loadDetails();
      onParkingUpdated?.();
    } catch (err: any) {
      setParkingFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Action failed',
      });
    }
  };

  const handleSubmitVerifiedReview = async () => {
    if (!placeData || reviewComment.trim().length < 10) return;
    setSubmittingReview(true);
    setReviewFeedback(null);
    try {
      const res = await AwfarApi.submitVerifiedReview(
        {
          placeId: placeData.id,
          userId: currentUser.id,
          rating: reviewRating,
          qualityRating,
          serviceRating,
          atmosphereRating,
          facilitiesValueRating,
          comment: reviewComment,
          photos: reviewPhotoUrl.trim() ? [reviewPhotoUrl.trim()] : [],
          reviewerLat: userCoords.lat,
          reviewerLng: userCoords.lng,
          tags: ['wherio_verified'],
        },
        country,
        lang,
      );
      setReviewFeedback(res);
      await loadDetails();
    } catch (err: any) {
      setReviewFeedback({ error: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    try {
      await AwfarApi.reportReview(
        reviewId,
        {
          reporterUserId: currentUser.id,
          reason: 'Flagged by community member for moderator review',
        },
        country,
        lang,
      );
      setReportedReviewIds((prev) => [...prev, reviewId]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveOwnReview = async (reviewId: string) => {
    setSubmittingReview(true);
    try {
      const res = await AwfarApi.removeOwnReview(
        reviewId,
        currentUser.id,
        country,
        lang,
      );
      setReviewComment('');
      setReviewPhotoUrl('');
      setReviewFeedback({
        withdrawnMessage: isAr ? res.messageAr : res.messageEn,
      });
      await loadDetails();
    } catch (err: any) {
      setReviewFeedback({ error: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderTriStateBadge = (status?: string) => {
    if (status === 'AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {isAr ? 'متاح' : 'Available'}
        </span>
      );
    }
    if (status === 'NOT_AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
          <XCircle className="h-3 w-3 text-rose-500" />
          {isAr ? 'غير متاح' : 'Not Available'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
        <HelpCircle className="h-3 w-3 text-amber-600" />
        {isAr ? 'غير معروف (لا يتم تخمينه)' : 'Unknown (Not Guessed)'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-[430px] rounded-2xl bg-white p-6 text-center text-xs font-bold text-[#072549]">
          {isAr
            ? 'جاري تحميل ملف المكان الموثق في ويريو...'
            : 'Loading Wherio verified place profile...'}
        </div>
      </div>
    );
  }

  const heroImage =
    placeData?.images?.[0] ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';

  const existingUserReview = placeData?.reviews?.find(
    (r: any) => r.userId === currentUser.id,
  );

  const isUnrated =
    placeData?.rating?.isUnrated ||
    (placeData?.rating?.reviewCount ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/70 backdrop-blur-xs">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative flex h-full w-full max-w-[430px] flex-col overflow-y-auto bg-slate-50 pb-20 no-scrollbar"
      >
        {/* Top Hero Image & Floating Controls */}
        <div className="relative h-56 w-full shrink-0 bg-[#072549]">
          <img
            src={heroImage}
            alt={placeData?.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072549]/85 via-transparent to-black/35" />

          <button
            onClick={onClose}
            className={`absolute top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur ${
              isAr ? 'right-4' : 'left-4'
            }`}
          >
            <ArrowLeft className={`h-5 w-5 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <div
            className={`absolute top-4 flex gap-2 ${
              isAr ? 'left-4' : 'right-4'
            }`}
          >
            {onToggleFavorite && placeData && (
              <button
                onClick={() => onToggleFavorite(placeData.id)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur transition ${
                  isFavorite
                    ? 'bg-rose-600 text-white'
                    : 'bg-black/50 text-white hover:bg-black/70'
                }`}
                title={isAr ? 'إضافة للمفضلة' : 'Save to Favorites'}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
                />
              </button>
            )}
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Data Completeness Badge */}
          <div
            className={`absolute bottom-3 flex items-center gap-1.5 rounded-xl bg-[#072549]/90 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur ${
              isAr ? 'left-4' : 'right-4'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#00D2B4]" />
            <span>
              {isAr ? 'اكتمال البيانات:' : 'Completeness:'}{' '}
              {placeData?.dataQuality?.completenessScore ?? 92}%
            </span>
          </div>
        </div>

        {/* Header Info */}
        <div className="bg-white px-4 pt-4 pb-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-[#0072DC]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#0072DC]">
              {placeData?.categoryName}
            </span>
            {placeData?.subCategoryName && (
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {placeData.subCategoryName}
              </span>
            )}
            {placeData?.brandName && (
              <span className="rounded-lg bg-[#00B89C]/10 px-2 py-0.5 text-[10px] font-bold text-[#008891]">
                {isAr ? 'العلامة:' : 'Brand:'} {placeData.brandName}
              </span>
            )}
            {placeData?.openNowStatus && (
              <span
                className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                  placeData.openNowStatus === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700'
                    : placeData.openNowStatus === 'CLOSED'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}
              >
                {placeData.openNowLabel ||
                  (placeData.openNowStatus === 'OPEN'
                    ? isAr
                      ? 'مفتوح الآن'
                      : 'Open Now'
                    : isAr
                      ? 'مغلق الآن'
                      : 'Closed')}
              </span>
            )}
          </div>

          <h1 className="mt-1.5 text-base font-extrabold leading-snug text-[#072549]">
            {placeData?.name}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {placeData?.description}
          </p>

          {/* Distance, ETA & Internal vs External Rating Row */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-3.5 w-3.5 text-[#0072DC]" />
              <span>{placeData?.distance?.etaSummary}</span>
            </div>

            <button
              onClick={() => setActiveTab('reviews')}
              className="flex items-center gap-1 font-extrabold text-[#072549] underline"
            >
              <Star className="h-3.5 w-3.5 fill-[#FF991F] text-[#FF991F]" />
              {isUnrated ? (
                <span className="text-[11px] font-bold text-slate-500">
                  {isAr ? 'بدون تقييم بعد' : 'Unrated'}
                </span>
              ) : (
                <>
                  <span>{placeData?.rating?.avgRating}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({placeData?.rating?.reviewCount}{' '}
                    {isAr ? 'تقييم ويريو' : 'Wherio Reviews'})
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Live Smart Parking Status Banner inside Header if Parking Spot */}
          {placeData?.parkingConfig && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
              <div className="flex items-center gap-2">
                {placeData.parkingConfig.managementMode === 'CAMERA_AI' ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    <Camera className="h-3 w-3" />
                    {isAr ? 'كاميرا ذكية مباشر' : 'Camera AI Live'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    <Wrench className="h-3 w-3" />
                    {isAr ? 'إدارة يدوية' : 'Manual Mode'}
                  </span>
                )}
                <span className="text-xs font-extrabold text-[#072549]">
                  {placeData.parkingConfig.availableSlotsCount} /{' '}
                  {placeData.parkingConfig.totalSlots}{' '}
                  {isAr ? 'موقف متاح الآن' : 'Slots Free'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('parking')}
                className="inline-flex items-center gap-1 rounded-lg bg-[#072549] px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-[#0c3566]"
              >
                <Car className="h-3 w-3 text-[#00D2B4]" />
                {isAr ? 'عرض المواقف والحجز' : 'Live Slots & Reserve'}
              </button>
            </div>
          )}
        </div>

        {/* Wherio Navigation Tabs */}
        <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white px-2 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 border-b-2 py-3 text-center transition ${
              activeTab === 'overview'
                ? 'border-[#0072DC] text-[#072549]'
                : 'border-transparent text-slate-400'
            }`}
          >
            {isAr ? 'التجهيزات والمواعيد' : 'Facilities & Hours'}
          </button>
          {placeData?.parkingConfig && (
            <button
              onClick={() => setActiveTab('parking')}
              className={`flex-1 border-b-2 py-3 text-center transition ${
                activeTab === 'parking'
                  ? 'border-[#00B89C] text-[#072549]'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1">
                <Car className="h-3.5 w-3.5 text-[#00B89C]" />
                {isAr ? 'حجز موقف' : 'Slots & Reserve'}
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 border-b-2 py-3 text-center transition ${
              activeTab === 'media'
                ? 'border-[#0072DC] text-[#072549]'
                : 'border-transparent text-slate-400'
            }`}
          >
            {isAr ? 'المنيو والمتجر' : 'Menus & Posters'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 border-b-2 py-3 text-center transition ${
              activeTab === 'reviews'
                ? 'border-[#0072DC] text-[#072549]'
                : 'border-transparent text-slate-400'
            }`}
          >
            {isAr ? 'التقييمات الموثقة' : 'Verified Reviews'}
          </button>
        </div>

        {/* TAB 1: OVERVIEW, TRI-STATE ATTRIBUTES & MULTI-SHIFT HOURS */}
        {activeTab === 'overview' && placeData && (
          <div className="space-y-3 p-4">
            {/* Pricing, Entry Conditions & Venue Policies (Explicitly handles UNKNOWN) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <h3 className="text-xs font-extrabold text-[#072549]">
                {isAr
                  ? 'الفئة السعرية وشروط الدخول وسياسات المكان:'
                  : 'Price Tier, Entry Conditions & Venue Policies:'}
              </h3>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {isAr ? 'الفئة السعرية' : 'Price Range'}
                  </p>
                  <p className="mt-0.5 font-extrabold text-[#072549]">
                    {placeData.priceRange === 'UNKNOWN' ? (
                      <span className="text-amber-700">
                        {isAr
                          ? 'غير متاح في البيانات'
                          : 'Unavailable (Not Guessed)'}
                      </span>
                    ) : (
                      placeData.priceRange
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {isAr ? 'رسوم الدخول' : 'Entry Fee Status'}
                  </p>
                  <p className="mt-0.5 font-extrabold text-[#072549]">
                    {placeData.entryFeeStatus === 'UNKNOWN' ? (
                      <span className="text-amber-700">
                        {isAr
                          ? 'غير متاح في البيانات'
                          : 'Unavailable (Not Guessed)'}
                      </span>
                    ) : (
                      placeData.entryFeeStatus
                    )}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-600">
                <strong>{isAr ? 'تفاصيل الدخول:' : 'Entry Details:'}</strong>{' '}
                {placeData.entryFeeDetails}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                <strong>{isAr ? 'الفئة العمرية:' : 'Age Policy:'}</strong>{' '}
                {placeData.ageRestriction}
              </p>
              {placeData.policies && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2 text-[10px]">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {isAr ? 'التدخين:' : 'Smoking:'}{' '}
                    {placeData.policies.smokingPolicy}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {isAr ? 'الحيوانات الأليفة:' : 'Pets:'}{' '}
                    {placeData.policies.petsPolicy}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {placeData.policies.dressCodeOrNotes}
                  </span>
                </div>
              )}
            </div>

            {/* Tri-State Practical Attributes (Available | Not Available | Unknown) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'التجهيزات العملية (متاح / غير متاح / غير معروف):'
                    : 'Practical Facilities & Attributes:'}
                </h3>
              </div>
              <div className="mt-2.5 space-y-2 text-xs">
                {[
                  {
                    labelEn: 'On-Site Parking',
                    labelAr: 'مواقف سيارات (Parking)',
                    val: placeData.attributes?.parking,
                  },
                  {
                    labelEn: 'Valet Parking Service',
                    labelAr: 'خدمة صف السيارات (فاليه - Valet)',
                    val: placeData.attributes?.valetParking,
                  },
                  {
                    labelEn: 'Kids Friendly',
                    labelAr: 'مناسب للأطفال (Kids Friendly)',
                    val: placeData.attributes?.kidsFriendly,
                  },
                  {
                    labelEn: 'Wheelchair Accessible',
                    labelAr: 'مجهز للكراسي المتحركة',
                    val: placeData.attributes?.wheelchairAccessible,
                  },
                  {
                    labelEn: 'Outdoor Seating',
                    labelAr: 'جلسات خارجية (Outdoor)',
                    val: placeData.attributes?.outdoorSeating,
                  },
                  {
                    labelEn: 'Family Seating',
                    labelAr: 'جلسات عائلية',
                    val: placeData.attributes?.familySeating,
                  },
                  {
                    labelEn: 'Wi-Fi Internet',
                    labelAr: 'واي فاي (Wi-Fi)',
                    val: placeData.attributes?.wifi,
                  },
                  {
                    labelEn: 'Prior Reservation Required',
                    labelAr: 'يشترط حجز مسبق',
                    val: placeData.attributes?.reservationRequired,
                  },
                ].map((attr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                  >
                    <span className="font-semibold text-slate-700">
                      {isAr ? attr.labelAr : attr.labelEn}
                    </span>
                    {renderTriStateBadge(attr.val)}
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Shift Working Hours & Special Day Exceptions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'فترات وساعات العمل المتعددة والاستثناءات:'
                    : 'Multi-Shift Working Hours & Exceptions:'}
                </h3>
                {placeData.openNowLabel && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {placeData.openNowLabel}
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1.5">
                {(placeData.shifts?.length > 0
                  ? placeData.shifts
                  : [
                      {
                        labelEn: 'Daily Shift',
                        labelAr: 'الفترة اليومية',
                        open: placeData.openingHours?.open,
                        close: placeData.openingHours?.close,
                      },
                    ]
                ).map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-sky-50/60 px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-[#072549]">
                      {isAr ? s.labelAr : s.labelEn}
                    </span>
                    <span className="font-extrabold text-[#0072DC]">
                      {s.open} – {s.close}
                    </span>
                  </div>
                ))}
              </div>
              {placeData.specialExceptions?.length > 0 && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
                  <p className="font-extrabold">
                    {isAr
                      ? 'استثناءات الأيام والمواسم الخاصة:'
                      : 'Special Day Exceptions:'}
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {(Array.isArray(placeData.specialExceptions)
                      ? placeData.specialExceptions
                      : [placeData.specialExceptions]
                    ).map((exc: string, i: number) => (
                      <li key={i}>{exc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Location, Contact & Google Maps */}
            <div
              onClick={(event) => {
                if (!isAuthenticated) {
                  event.preventDefault();
                  onRequireAuth();
                }
              }}
              className={`rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs ${
                !isAuthenticated ? 'cursor-pointer' : ''
              }`}
            >
              <h3 className="text-xs font-extrabold text-[#072549]">
                {isAr ? 'العنوان والتواصل المباشر:' : 'Location & Direct Contact:'}
              </h3>
              <p className="mt-1 text-xs text-slate-600">{placeData.address}</p>

              <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                  <Car className="h-3.5 w-3.5 text-[#0072DC]" />
                  {placeData.distance?.driveTimeMinutes}{' '}
                  {isAr ? 'دقائق بالسيارة' : 'min drive'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  <Footprints className="h-3.5 w-3.5" />
                  {placeData.distance?.walkTimeMinutes}{' '}
                  {isAr ? 'دقيقة مشي' : 'min walk'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${placeData.contact?.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#00B89C] py-2.5 text-xs font-extrabold text-white"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {isAr ? 'اتصال مباشر' : 'Call Venue'}
                </a>
                <a
                  href={placeData.coordinates?.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#072549] py-2.5 text-xs font-extrabold text-white"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {isAr ? 'خرائط جوجل' : 'Google Maps'}
                </a>
              </div>
              {placeData.contact?.websiteUrl && (
                <a
                  href={placeData.contact.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-[#0072DC]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {isAr ? 'الموقع الرسمي للمكان' : 'Official Website'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* TAB: SMART PARKING LIVE SLOTS & RESERVATION */}
        {activeTab === 'parking' && placeData?.parkingConfig && (
          <div className="space-y-3 p-4">
            {parkingFeedback && (
              <div
                className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-bold ${
                  parkingFeedback.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {parkingFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{parkingFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setParkingFeedback(null)}
                  className="text-[11px] underline"
                >
                  {isAr ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* Camera AI vs Manual Telemetry Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#072549] text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  {placeData.parkingConfig.managementMode === 'CAMERA_AI' ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                      <Camera className="h-3.5 w-3.5" />
                      {isAr
                        ? 'رصد تلقائي بالكاميرا والذكاء الاصطناعي'
                        : 'Camera AI Auto-Detection'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                      <Wrench className="h-3.5 w-3.5" />
                      {isAr
                        ? 'إدارة يدوية من مشرف المواقف'
                        : 'Manual Operator Slot Control'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadDetails}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-slate-200 hover:bg-white/20"
                >
                  <RefreshCw className="h-3 w-3" />
                  {isAr ? 'تحديث' : 'Sync'}
                </button>
              </div>

              <div className="p-3.5">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-white/10 p-2">
                    <span className="block text-[10px] text-slate-300">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </span>
                    <span className="text-base font-black text-white">
                      {placeData.parkingConfig.totalSlots}
                    </span>
                  </div>
                  <div className="rounded-xl bg-emerald-500/20 p-2">
                    <span className="block text-[10px] text-emerald-300">
                      {isAr ? 'متاح' : 'Available'}
                    </span>
                    <span className="text-base font-black text-emerald-300">
                      {placeData.parkingConfig.availableSlotsCount}
                    </span>
                  </div>
                  <div className="rounded-xl bg-amber-500/20 p-2">
                    <span className="block text-[10px] text-amber-300">
                      {isAr ? 'محجوز' : 'Reserved'}
                    </span>
                    <span className="text-base font-black text-amber-300">
                      {placeData.parkingConfig.reservedSlotsCount}
                    </span>
                  </div>
                  <div className="rounded-xl bg-rose-500/20 p-2">
                    <span className="block text-[10px] text-rose-300">
                      {isAr ? 'مشغول' : 'Occupied'}
                    </span>
                    <span className="text-base font-black text-rose-300">
                      {placeData.parkingConfig.occupiedSlotsCount}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    {isAr ? 'التعرفة:' : 'Rate:'}{' '}
                    <strong className="text-white">
                      {placeData.parkingConfig.hourlyRate === 0
                        ? isAr
                          ? 'مجاناً'
                          : 'Free'
                        : `${placeData.parkingConfig.hourlyRate} ${placeData.parkingConfig.currency} / hr`}
                    </strong>
                  </span>
                  <span>
                    {isAr ? 'مهلة الوصول للحجز:' : 'Arrival Grace Lock:'}{' '}
                    <strong className="text-[#00D2B4]">
                      {placeData.parkingConfig.gracePeriodMinutes || 15}{' '}
                      {isAr ? 'دقيقة' : 'min'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Slot Map Grid (Pure Vector Icons) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'خريطة المواقف الحية (اختر موقفاً متاحاً للحجز):'
                    : 'Live Parking Slot Grid (Tap an available slot to reserve):'}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedSlotId
                    ? isAr
                      ? `المحدد: ${selectedSlotId}`
                      : `Selected: ${selectedSlotId}`
                    : isAr
                      ? 'تعيين تلقائي أو اختر'
                      : 'Auto or tap slot'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(placeData.parkingConfig.slots || []).map((slot: any) => {
                  const isAvailable = slot.status === 'AVAILABLE';
                  const isReserved = slot.status === 'RESERVED';
                  const isOccupied = slot.status === 'OCCUPIED';
                  const isSelected = selectedSlotId === slot.slotId;

                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() =>
                        setSelectedSlotId(
                          isSelected ? '' : String(slot.slotId),
                        )
                      }
                      className={`flex flex-col items-start justify-between rounded-xl border p-2 text-left transition ${
                        isSelected
                          ? 'border-[#0072DC] bg-[#0072DC]/10 ring-2 ring-[#0072DC]'
                          : isAvailable
                            ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400'
                            : isReserved
                              ? 'cursor-not-allowed border-amber-200 bg-amber-50/70 opacity-85'
                              : 'cursor-not-allowed border-rose-200 bg-rose-50/60 opacity-75'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-mono text-[11px] font-black text-[#072549]">
                          #{slot.slotNumber}
                        </span>
                        {slot.type === 'EV_CHARGING' ? (
                          <Zap className="h-3.5 w-3.5 text-emerald-600" />
                        ) : slot.type === 'VIP' ? (
                          <Crown className="h-3.5 w-3.5 text-amber-600" />
                        ) : slot.type === 'ACCESSIBLE' ? (
                          <Accessibility className="h-3.5 w-3.5 text-sky-600" />
                        ) : isReserved ? (
                          <Lock className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <Car
                            className={`h-3.5 w-3.5 ${
                              isAvailable
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          />
                        )}
                      </div>
                      <span className="mt-1 font-mono text-[10px] font-bold text-slate-600">
                        {slot.slotId}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : isReserved
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isAvailable
                          ? isAr
                            ? 'متاح'
                            : 'FREE'
                          : isReserved
                            ? isAr
                              ? 'محجوز'
                              : 'RESERVED'
                            : isAr
                              ? 'مشغول'
                              : 'OCCUPIED'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply for Parking Slot Reservation Form */}
            <form
              onSubmit={handleReserveParkingSlot}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-[#072549]">
                  <Lock className="h-3.5 w-3.5 text-[#00B89C]" />
                  {isAr
                    ? 'حجز موقف فوري (قفل الموقف لمدة ١٥ دقيقة للوصول)'
                    : 'Reserve Parking Slot (15-Min Arrival Lock)'}
                </h4>
                {selectedSlotId && (
                  <span className="rounded-lg bg-[#0072DC]/10 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#0072DC]">
                    {selectedSlotId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">
                    {isAr ? 'رقم لوحة المركبة' : 'Vehicle Plate Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="AD-58291"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">
                    {isAr ? 'مدة الوقوف (ساعات)' : 'Duration (Hours)'}
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 6, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} {isAr ? 'ساعات' : 'Hours'} (
                        {h * (placeData.parkingConfig.hourlyRate || 0)}{' '}
                        {placeData.parkingConfig.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  reservingSlot ||
                  placeData.parkingConfig.availableSlotsCount === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#072549] to-[#0072DC] py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              >
                <Car className="h-4 w-4 text-[#00D2B4]" />
                <span>
                  {reservingSlot
                    ? isAr
                      ? 'جاري قفل وتأكيد الموقف...'
                      : 'Locking & Reserving Slot...'
                    : selectedSlotId
                      ? isAr
                        ? `تأكيد حجز الموقف ${selectedSlotId}`
                        : `Confirm Reservation for Slot ${selectedSlotId}`
                      : isAr
                        ? 'حجز أقرب موقف متاح تلقائياً'
                        : 'Auto-Assign & Reserve Best Available Slot'}
                </span>
              </button>
            </form>

            {/* Active Reservations for this Parking Spot */}
            {activeParkingReservations.filter((r) => r.status === 'RESERVED')
              .length > 0 && (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
                <h4 className="text-xs font-extrabold text-amber-950">
                  {isAr
                    ? 'الحجوزات النشطة في هذا الموقف (تسجيل وصول / إلغاء):'
                    : 'Active Slot Reservations (Check-In on Arrival or Cancel):'}
                </h4>
                {activeParkingReservations
                  .filter((r) => r.status === 'RESERVED')
                  .map((res) => (
                    <div
                      key={res.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white p-2.5 text-xs"
                    >
                      <div>
                        <span className="font-mono font-black text-[#072549]">
                          {res.slotId}
                        </span>{' '}
                        <span className="text-slate-600">
                          • {res.vehiclePlate} ({res.userName})
                        </span>
                        <p className="text-[10px] text-amber-700">
                          {isAr ? 'ينتهي قفل الوصول:' : 'Grace lock expires:'}{' '}
                          {new Date(res.graceExpiresAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleParkingReservationAction(res.id, 'check-in')
                          }
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-emerald-700"
                        >
                          {isAr ? 'تسجيل دخول المركبة' : 'Check-In'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleParkingReservationAction(res.id, 'cancel')
                          }
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERABLE STORE/MENU ITEMS + MENU GALLERY & ANNOUNCED POSTERS */}
        {activeTab === 'media' && placeData && (
          <div className="space-y-3 p-4">
            {/* Orderable Menu & Store Items (Integrated directly inside Menus & Posters) */}
            {Array.isArray(placeData.catalogProducts) &&
              placeData.catalogProducts.length > 0 && (
                <div className="rounded-2xl border border-[#0072DC]/25 bg-white p-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0072DC]/10 text-[#0072DC]">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-[#072549]">
                          {isAr
                            ? 'قائمة الطلب المباشر والمتجر الإلكتروني'
                            : 'Orderable Menu & Store Items'}
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          {isAr
                            ? 'أضف المنتجات للسلة الموحدة في أعلى التطبيق مع حساب سعة مركبة التوصيل'
                            : 'Add items to the global header cart with 3D delivery vehicle sizing'}
                        </p>
                      </div>
                    </div>

                    {onOpenCart && (
                      <button
                        type="button"
                        onClick={onOpenCart}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#072549] px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:bg-[#0d386b]"
                      >
                        <ShoppingBag className="h-3 w-3 text-[#00D2B4]" />
                        <span>
                          {isAr ? 'عرض السلة' : 'Open Cart'} (
                          {cart.reduce((s, i) => s + i.quantity, 0)})
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {placeData.catalogProducts.map((prod: any) => {
                      const inCart = cart.find(
                        (c) => c.productId === prod.id,
                      );
                      const qty = inCart?.quantity || 0;
                      const cartItemPayload: GlobalCartItem = {
                        productId: prod.id,
                        placeId: placeData.id,
                        placeNameEn: placeData.nameEn || placeData.name,
                        placeNameAr: placeData.nameAr || placeData.name,
                        nameEn: prod.nameEn,
                        nameAr: prod.nameAr,
                        price: prod.price,
                        currency: prod.currency,
                        imageUrl: prod.imageUrl,
                        dimensionsCm: prod.dimensionsCm,
                        weightKg: prod.weightKg,
                        handlingFlags: prod.handlingFlags,
                        quantity: qty,
                      };

                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-[#0072DC]/30 hover:bg-white"
                        >
                          {prod.imageUrl && (
                            <img
                              src={prod.imageUrl}
                              alt={isAr ? prod.nameAr : prod.nameEn}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[#0072DC]/10 px-1.5 py-0.5 text-[9px] font-extrabold text-[#0072DC]">
                                {prod.categoryTag}
                              </span>
                              {prod.dimensionsCm?.length > 45 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                  <Car className="h-2.5 w-2.5" />
                                  {isAr ? 'يتطلب سيارة' : 'Car Trunk'}
                                </span>
                              )}
                            </div>

                            <h4 className="mt-1 truncate text-xs font-extrabold text-[#072549]">
                              {isAr ? prod.nameAr : prod.nameEn}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-slate-500">
                              {isAr ? prod.descriptionAr : prod.descriptionEn}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                              <span className="inline-flex items-center gap-0.5 font-medium">
                                <Box className="h-3 w-3 text-slate-400" />
                                {prod.dimensionsCm?.length}×
                                {prod.dimensionsCm?.width}×
                                {prod.dimensionsCm?.height} cm
                              </span>
                              <span className="inline-flex items-center gap-0.5 font-medium">
                                <Scale className="h-3 w-3 text-slate-400" />
                                {prod.weightKg} kg
                              </span>
                              <span className="font-black text-[#0072DC]">
                                {prod.price} {prod.currency}
                              </span>
                            </div>
                          </div>

                          {onUpdateCartItem && (
                            <div className="shrink-0">
                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateCartItem(cartItemPayload, 1)
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#0072DC] px-3 py-2 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-[#005bb5] active:scale-95"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>{isAr ? 'أضف' : 'Add'}</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 rounded-xl border border-[#0072DC]/30 bg-white p-1 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateCartItem(cartItemPayload, -1)
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="min-w-[20px] text-center text-xs font-black text-[#072549]">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateCartItem(cartItemPayload, 1)
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#072549] text-white hover:bg-[#0d386b]"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Cinema Scope Notice if category is Cinemas */}
            {placeData.categoryId === 'cat-cinemas' && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs text-[#072549]">
                <p className="font-extrabold">
                  {isAr
                    ? 'تنبيه نطاق المرحلة الأولى للسينما:'
                    : 'Phase 1 Cinema Information Notice:'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {isAr
                    ? 'نعرض معلومات دار السينما وتجهيزات القاعات والبوسترات المعلنة، ولا نعرض جداول ومواعيد عرض الأفلام اللحظية في المرحلة الأولى.'
                    : 'Wherio displays cinema branch facilities, hall types, and announced posters. Live movie showtime schedules are excluded in Phase 1.'}
                </p>
              </div>
            )}

            {/* Menu Photo Gallery (View-Only, Zero Item Pricing/Cart) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#0072DC]" />
                  <h3 className="text-xs font-extrabold text-[#072549]">
                    {isAr
                      ? 'صور المنيو فقط (بدون تسعير فردي أو طلب إلكتروني):'
                      : 'Menu Photo Gallery (Informational View-Only):'}
                  </h3>
                </div>
              </div>

              {placeData.menuGallery?.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {placeData.menuGallery.map((m: any) => (
                    <div
                      key={m.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={m.imageUrl}
                        alt={isAr ? m.titleAr : m.titleEn}
                        className="h-44 w-full object-cover"
                      />
                      <div className="flex items-center justify-between p-2.5 text-xs">
                        <span className="font-bold text-[#072549]">
                          {isAr ? m.titleAr : m.titleEn}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'آخر تحديث:' : 'Updated:'} {m.lastUpdated}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                  {isAr
                    ? 'لا توجد صور منيو مرفوعة لهذا المكان حالياً.'
                    : 'No menu photos uploaded for this venue yet.'}
                </p>
              )}
            </div>

            {/* Announced Promotional Posters (View-Only, No Vouchers/Checkout) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <h3 className="text-xs font-extrabold text-[#072549]">
                {isAr
                  ? 'البوسترات والعروض المعلنة من المكان (للاطلاع فقط):'
                  : 'Announced Promotional Posters (Informational Only):'}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {isAr
                  ? 'تُعرض البوسترات الترويجية المعلنة من المكان نفسه دون أكواد خصم أو شراء قسائم عبر المنصة.'
                  : 'Displays official posters announced by the venue without in-app checkout or promo codes.'}
              </p>

              {placeData.announcedPosters?.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {placeData.announcedPosters.map((poster: any) => (
                    <div
                      key={poster.id}
                      className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40"
                    >
                      <img
                        src={poster.posterImageUrl}
                        alt={isAr ? poster.titleAr : poster.titleEn}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-xs font-extrabold text-[#072549]">
                          {isAr ? poster.titleAr : poster.titleEn}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {isAr ? poster.descriptionAr : poster.descriptionEn}
                        </p>
                        <p className="mt-1.5 text-[10px] font-bold text-[#FF6B2B]">
                          {isAr ? poster.validityNoteAr : poster.validityNoteEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                  {isAr
                    ? 'لا توجد بوسترات معلنة حالياً لهذا المكان.'
                    : 'No announced posters currently listed for this venue.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RATINGS & REVIEWS (4 SUB-RATINGS + SEPARATE EXTERNAL SCORE) */}
        {activeTab === 'reviews' && placeData && (
          <div className="space-y-3 p-4">
            {/* Internal Wherio Rating & 4 Sub-Ratings Breakdown */}
            <div className="rounded-2xl border border-[#0072DC]/25 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#072549] px-2 py-0.5 text-[10px] font-extrabold text-white">
                    <ShieldCheck className="h-3 w-3 text-[#00D2B4]" />
                    {isAr
                      ? 'تقييم ويريو الداخلي الموثق'
                      : 'Wherio Verified Internal Rating'}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {isAr
                      ? 'من مستخدمين موثقين برقم الهاتف (OTP) والبريد الإلكتروني الفريد'
                      : 'From members verified via both Phone OTP & Unique Email'}
                  </p>
                </div>
                <div className="text-right">
                  {isUnrated ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {isAr ? 'غير مقيّم بعد' : 'Unrated'}
                    </span>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-1 text-lg font-extrabold text-[#072549]">
                        <Star className="h-4 w-4 fill-[#FF991F] text-[#FF991F]" />
                        {placeData.internalRating?.overallAvg ??
                          placeData.rating?.avgRating}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {placeData.internalRating?.reviewCount ??
                          placeData.rating?.reviewCount}{' '}
                        {isAr ? 'مراجعة' : 'reviews'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4 Sub-Rating Bars */}
              {!isUnrated && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px]">
                  {[
                    {
                      labelEn: 'Quality',
                      labelAr: 'الجودة',
                      val:
                        placeData.internalRating?.criteriaAvg?.quality ?? 4.8,
                    },
                    {
                      labelEn: 'Service',
                      labelAr: 'الخدمة',
                      val:
                        placeData.internalRating?.criteriaAvg?.service ?? 4.7,
                    },
                    {
                      labelEn: 'Atmosphere',
                      labelAr: 'الأجواء',
                      val:
                        placeData.internalRating?.criteriaAvg?.atmosphere ??
                        4.8,
                    },
                    {
                      labelEn: 'Facilities & Value',
                      labelAr: 'المرافق والقيمة',
                      val:
                        placeData.internalRating?.criteriaAvg
                          ?.facilitiesValue ?? 4.6,
                    },
                  ].map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-50 px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between font-bold text-[#072549]">
                        <span>{isAr ? c.labelAr : c.labelEn}</span>
                        <span>{c.val} / 5</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#00B89C]"
                          style={{ width: `${(Number(c.val) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separate External Rating Card (Never mixed with Internal Wherio Rating) */}
            {placeData.externalRating && (
              <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {isAr
                        ? 'تقييم خارجي منفصل (للمقارنة فقط — لا يُدمج مع تقييم ويريو)'
                        : 'Separate External Rating (Never mixed with Wherio Score)'}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                      {placeData.externalRating.sourceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-slate-800 shadow-2xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {placeData.externalRating.rating} / 5.0
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      ({placeData.externalRating.reviewCount}{' '}
                      {isAr ? 'تقييم خارجي' : 'external ratings'})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Verified Review Form (Requires Phone OTP + Unique Email) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#072549]">
                  {existingUserReview
                    ? isAr
                      ? 'تعديل تقييمك الموثق لهذا المكان (تقييم واحد قابل للتعديل):'
                      : 'Edit Your Verified Review (1 Editable Review per Place):'
                    : isAr
                      ? 'أضف تقييمك الموثق (يتطلب توثيق الهاتف OTP + البريد الإلكتروني):'
                      : 'Write a Verified Review (Requires Phone OTP + Confirmed Email):'}
                </h4>
              </div>

              {(!currentUser.isPhoneVerified ||
                !currentUser.isEmailVerified) && (
                <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-extrabold">
                        {isAr
                          ? 'حسابك يحتاج استكمال التوثيق المزدوج:'
                          : 'Dual Verification Required to Post Reviews:'}
                      </p>
                      <p className="mt-0.5">
                        {isAr
                          ? 'لضمان مصداقية التقييمات، يشترط توثيق رقم الهاتف (OTP) والبريد الإلكتروني الفريد قبل نشر التقييم.'
                          : 'Both Phone OTP and a Unique Email must be verified before submitting a review.'}
                      </p>
                      {onRequireVerifyEmail && (
                        <button
                          onClick={onRequireVerifyEmail}
                          className="mt-1.5 rounded-lg bg-[#072549] px-2.5 py-1 text-[10px] font-bold text-white"
                        >
                          {isAr
                            ? 'توثيق البريد الإلكتروني الآن'
                            : 'Verify Unique Email Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Stars */}
              <div className="mt-2.5">
                <label className="text-[11px] font-bold text-slate-600">
                  {isAr ? 'التقييم العام:' : 'Overall Rating:'}
                </label>
                <div className="mt-1 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                        reviewRating >= star
                          ? 'bg-[#FF991F] text-[#072549]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Sub-Ratings Selectors */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                {[
                  {
                    labelEn: '1. Quality',
                    labelAr: '١. الجودة',
                    val: qualityRating,
                    setVal: setQualityRating,
                  },
                  {
                    labelEn: '2. Service',
                    labelAr: '٢. الخدمة',
                    val: serviceRating,
                    setVal: setServiceRating,
                  },
                  {
                    labelEn: '3. Atmosphere',
                    labelAr: '٣. الأجواء',
                    val: atmosphereRating,
                    setVal: setAtmosphereRating,
                  },
                  {
                    labelEn: '4. Facilities & Value',
                    labelAr: '٤. المرافق والقيمة',
                    val: facilitiesValueRating,
                    setVal: setFacilitiesValueRating,
                  },
                ].map((sub, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                  >
                    <div className="flex items-center justify-between font-bold text-[#072549]">
                      <span>{isAr ? sub.labelAr : sub.labelEn}</span>
                      <span className="text-[#0072DC]">{sub.val}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sub.val}
                      onChange={(e) => sub.setVal(Number(e.target.value))}
                      className="mt-1 w-full accent-[#0072DC]"
                    />
                  </div>
                ))}
              </div>

              {/* Optional Photo URL Input */}
              <div className="mt-2.5 flex items-center gap-2">
                <Camera className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={reviewPhotoUrl}
                  onChange={(e) => setReviewPhotoUrl(e.target.value)}
                  placeholder={
                    isAr
                      ? 'رابط صورة اختياري مع التقييم (https://...)'
                      : 'Optional photo URL to attach with review (https://...)'
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#0072DC] focus:outline-none"
                />
              </div>

              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب تجربتك التفصيلية (10 أحرف على الأقل)...'
                    : 'Share your detailed experience (min 10 chars)...'
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#0072DC] focus:outline-none"
              />

              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSubmitVerifiedReview}
                  disabled={
                    submittingReview || reviewComment.trim().length < 10
                  }
                  className="flex-1 rounded-xl bg-[#072549] py-2.5 text-xs font-extrabold text-white hover:bg-[#0072DC] disabled:opacity-50"
                >
                  {submittingReview
                    ? '...'
                    : existingUserReview
                      ? isAr
                        ? 'حفظ تعديل التقييم الموثق'
                        : 'Update Your Verified Review'
                      : isAr
                        ? 'نشر التقييم الموثق'
                        : 'Publish Verified Review'}
                </button>

                {existingUserReview && (
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRemoveOwnReview(existingUserReview.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    {isAr ? 'سحب تقييمي' : 'Withdraw Review'}
                  </button>
                )}
              </div>

              {reviewFeedback && (
                <div className="mt-2 rounded-xl bg-sky-50 p-2.5 text-[11px] text-[#072549]">
                  {reviewFeedback.error ? (
                    <span className="font-bold text-rose-600">
                      {reviewFeedback.error}
                    </span>
                  ) : reviewFeedback.withdrawnMessage ? (
                    <span className="font-bold text-emerald-800">
                      {reviewFeedback.withdrawnMessage}
                    </span>
                  ) : (
                    <>
                      <p className="font-extrabold text-emerald-800">
                        {reviewFeedback.verificationProof?.badge}
                      </p>
                      <p className="mt-0.5">
                        {reviewFeedback.isEdited
                          ? isAr
                            ? 'تم تحديث مراجعتك السابقة بنجاح.'
                            : 'Your existing review was updated.'
                          : isAr
                            ? 'تمت إضافة تقييمك بنجاح.'
                            : 'Your verified review is now live.'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Community Reviews List with Report Button */}
            <div className="space-y-2.5">
              {placeData.reviews?.map((rev: any) => {
                const isReported =
                  reportedReviewIds.includes(rev.id) ||
                  rev.moderationStatus === 'REPORTED';
                return (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-[#072549]">
                          {rev.userName}
                        </span>
                        {rev.isEdited && (
                          <span className="mx-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                            {isAr ? 'معدّل' : 'Edited'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-[#FF991F]">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="h-3 w-3 fill-[#FF991F] text-[#FF991F]"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      {isAr ? rev.tierBadgeAr : rev.tierBadgeEn}
                    </div>

                    {/* Sub-Ratings Pill Row */}
                    {rev.subRatings && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {isAr ? 'الجودة:' : 'Quality:'}{' '}
                          <strong>{rev.subRatings.quality}/5</strong>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {isAr ? 'الخدمة:' : 'Service:'}{' '}
                          <strong>{rev.subRatings.service}/5</strong>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {isAr ? 'الأجواء:' : 'Atmosphere:'}{' '}
                          <strong>{rev.subRatings.atmosphere}/5</strong>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {isAr ? 'المرافق:' : 'Facilities:'}{' '}
                          <strong>{rev.subRatings.facilitiesValue}/5</strong>
                        </span>
                      </div>
                    )}

                    <p className="mt-2 text-xs leading-relaxed text-slate-700">
                      {isAr ? rev.commentAr : rev.commentEn}
                    </p>

                    {/* Attached Review Photos */}
                    {rev.photos?.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {rev.photos.map((photoUrl: string, pIdx: number) => (
                          <img
                            key={pIdx}
                            src={photoUrl}
                            alt="Review attachment"
                            className="h-20 w-28 rounded-xl object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                      <span>{String(rev.createdAt).slice(0, 10)}</span>
                      <button
                        type="button"
                        disabled={isReported}
                        onClick={() => handleReportReview(rev.id)}
                        className={`inline-flex items-center gap-1 font-bold ${
                          isReported
                            ? 'text-amber-600'
                            : 'text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <Flag className="h-3 w-3" />
                        {isReported
                          ? isAr
                            ? 'تم الإبلاغ للمشرفين'
                            : 'Reported to Moderators'
                          : isAr
                            ? 'إبلاغ عن مراجعة'
                            : 'Report Review'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
