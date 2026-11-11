"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Star,
  Heart,
  Film,
  Coffee,
  ShieldCheck,
  Utensils,
  FerrisWheel,
  Car,
  Footprints,
  Wifi,
  Users,
  SlidersHorizontal,
  CheckCircle2,
  HelpCircle,
  Accessibility,
  Sun,
  Ticket,
  Clock,
  KeyRound,
  ShoppingBag,
  Camera,
  Wrench,
} from "lucide-react";
import { useWherioApp } from "@/context/WherioAppContext";

export default function ExplorePage() {
  const router = useRouter();
  const {
    isAr,
    categories,
    placesList,
    noResultsSuggestions,
    loading,
    currentCityMeta,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    setSelectedAreaId,
    setKeyword,
    activeAttributeFilters,
    setActiveAttributeFilters,
    toggleAttributeFilter,
    sortBy,
    setSortBy,
    requireAuthThen,
    openPlaceDetails,
    favoritePlaceIds,
    handleToggleFavorite,
  } = useWherioApp();

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentSubCategories = selectedCategoryObj?.subCategories || [];

  const getCategoryIcon = (catId: string) => {
    if (catId === "cat-restaurants") return <Utensils className="h-5 w-5" />;
    if (catId === "cat-cafes") return <Coffee className="h-5 w-5" />;
    if (catId === "cat-cinemas") return <Film className="h-5 w-5" />;
    if (catId === "cat-parking") return <Car className="h-5 w-5" />;
    return <FerrisWheel className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Wherio Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#072549] via-[#0A2E5C] to-[#0072DC] p-4 text-white shadow-md">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#FFC233]">
            <Sparkles className="h-3 w-3" />
            <span>
              {isAr
                ? "المرحلة الأولى — أبوظبي والرياض"
                : "PHASE 1 LAUNCH — ABU DHABI & RIYADH"}
            </span>
          </div>
          <h1 className="mt-1.5 text-base font-extrabold leading-snug">
            {isAr
              ? "استكشف الأماكن بدقة • راجع التقييمات الموثقة • انطلق بثقة"
              : "Explore Verified Places • Read Trusted Reviews • Go Confidently"}
          </h1>
          <p className="mt-1 text-[11px] text-sky-100/90 leading-relaxed">
            {isAr
              ? "دليل ذكي للمطاعم، المقاهي، السينما، والترفيه العائلي مع توضيح صريح للتجهيزات المتاحة أو غير المعروفة."
              : "Structured directory for Restaurants, Cafes, Cinemas & Entertainment with verified facilities and grounded AI."}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                requireAuthThen(() => router.push("/ai-concierge"))
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B89C] px-3 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#008891]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "اسأل المساعد الذكي" : "Ask AI Concierge"}
            </button>
            <button
              onClick={() => router.push("/filters")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/25"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {isAr ? "الفلاتر المركبة" : "Compound Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main Categories Grid */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-[#072549]">
            {isAr
              ? "الفئات الرئيسية للاستكشاف:"
              : "Explore by Main Category:"}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedSubCategory("");
              }}
              className="text-[11px] font-bold text-[#0072DC] underline"
            >
              {isAr ? "عرض الكل" : "Show All"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {(categories.length > 0
            ? categories
            : [
                {
                  id: "cat-restaurants",
                  nameEn: "Restaurants",
                  nameAr: "مطاعم",
                },
                { id: "cat-cafes", nameEn: "Cafes", nameAr: "مقاهي" },
                {
                  id: "cat-cinemas",
                  nameEn: "Cinemas",
                  nameAr: "سينما",
                },
                {
                  id: "cat-entertainment",
                  nameEn: "Entertainment",
                  nameAr: "ترفيه وأنشطة",
                },
                {
                  id: "cat-parking",
                  nameEn: "Parking Spots",
                  nameAr: "مواقف السيارات",
                },
              ]
          ).map((cat: any) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(active ? "" : cat.id);
                  setSelectedSubCategory("");
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
                  active
                    ? "border-[#0072DC] bg-[#072549] text-white shadow-sm"
                    : "border-slate-200 bg-white text-[#072549] hover:border-[#0072DC]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active
                      ? "bg-[#00B89C] text-white"
                      : "bg-[#0072DC]/10 text-[#0072DC]"
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="mt-1.5 line-clamp-1 text-[11px] font-extrabold">
                  {isAr ? cat.nameAr : cat.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Filter Pills when a Main Category is selected */}
        {currentSubCategories.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedSubCategory("")}
              className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                selectedSubCategory === ""
                  ? "bg-[#0072DC] text-white"
                  : "bg-slate-200/70 text-slate-700"
              }`}
            >
              {isAr ? "كل التصنيفات الفرعية" : "All Subcategories"}
            </button>
            {currentSubCategories.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() =>
                  setSelectedSubCategory(
                    selectedSubCategory === sub.id ? "" : sub.id,
                  )
                }
                className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                  selectedSubCategory === sub.id
                    ? "bg-[#0072DC] text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                {isAr ? sub.nameAr : sub.nameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Compound Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          {
            key: "open_now",
            en: "Open Now",
            ar: "مفتوح الآن",
            icon: <Clock className="h-3 w-3" />,
          },
          {
            key: "kids_friendly",
            en: "Kids Friendly",
            ar: "مناسب للأطفال",
            icon: <Users className="h-3 w-3" />,
          },
          {
            key: "parking",
            en: "Parking Available",
            ar: "مواقف سيارات",
            icon: <Car className="h-3 w-3" />,
          },
          {
            key: "valet",
            en: "Valet Service",
            ar: "خدمة فاليه",
            icon: <KeyRound className="h-3 w-3" />,
          },
          {
            key: "outdoor_seating",
            en: "Outdoor Seating",
            ar: "جلسات خارجية",
            icon: <Sun className="h-3 w-3" />,
          },
          {
            key: "wheelchair_accessible",
            en: "Wheelchair Access",
            ar: "كراسي متحركة",
            icon: <Accessibility className="h-3 w-3" />,
          },
          {
            key: "wifi",
            en: "Fast Wi-Fi",
            ar: "واي فاي",
            icon: <Wifi className="h-3 w-3" />,
          },
          {
            key: "free_entry",
            en: "Free Entry",
            ar: "دخول مجاني",
            icon: <Ticket className="h-3 w-3" />,
          },
        ].map((f) => {
          const active = activeAttributeFilters.includes(f.key);
          return (
            <button
              key={f.key}
              onClick={() => toggleAttributeFilter(f.key)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                active
                  ? "border-[#00B89C] bg-[#00B89C] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#0072DC]"
              }`}
            >
              {f.icon}
              <span>{isAr ? f.ar : f.en}</span>
            </button>
          );
        })}
      </div>

      {/* Places Directory Feed */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#072549]">
              {isAr
                ? `الأماكن الموثقة في ${currentCityMeta.nameAr}`
                : `Verified Places in ${currentCityMeta.nameEn}`}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? `تم العثور على ${placesList.length} وجهة مطابقة`
                : `${placesList.length} structured venues matched`}
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#072549]"
          >
            <option value="relevance">
              {isAr ? "الأكثر صلة" : "Most Relevant"}
            </option>
            <option value="distance">
              {isAr ? "الأقرب مسافة" : "Nearest"}
            </option>
            <option value="rating">
              {isAr ? "الأعلى تقييماً" : "Top Rated"}
            </option>
            <option value="completeness">
              {isAr ? "اكتمال البيانات" : "Data Completeness"}
            </option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-bold text-slate-500">
            {isAr
              ? "جاري تحميل دليل الأماكن..."
              : "Loading verified places directory..."}
          </div>
        ) : placesList.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-5 text-center shadow-2xs">
            <p className="text-xs font-extrabold text-[#072549]">
              {noResultsSuggestions?.message ||
                (isAr
                  ? "لم يتم العثور على أماكن تطابق جميع الفلاتر المحددة."
                  : "No places matched all selected filters.")}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {isAr
                ? "جرب تخفيف بعض الفلاتر أو البحث في كافة أحياء المدينة:"
                : "Try relaxing one of your filters or exploring all areas in this city:"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  setKeyword("");
                  setSelectedAreaId("");
                  setSelectedCategory("");
                  setSelectedSubCategory("");
                  setActiveAttributeFilters([]);
                }}
                className="rounded-xl bg-[#072549] px-3 py-1.5 text-xs font-extrabold text-white"
              >
                {isAr ? "إعادة ضبط جميع الفلاتر" : "Reset All Filters"}
              </button>
              <button
                onClick={() =>
                  requireAuthThen(() => router.push("/ai-concierge"))
                }
                className="rounded-xl bg-[#00B89C] px-3 py-1.5 text-xs font-extrabold text-white"
              >
                {isAr
                  ? "اطلب بدائل من المساعد الذكي"
                  : "Ask AI for Alternatives"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {placesList.map((place: any) => {
              const isFav = favoritePlaceIds.includes(place.id);
              const hasUnknownPrice =
                place.priceRange === "UNKNOWN" ||
                place.entryFeeStatus === "UNKNOWN";
              const isUnrated =
                place.rating?.isUnrated ||
                (place.rating?.reviewCount ?? 0) === 0;
              return (
                <div
                  key={place.id}
                  onClick={() => openPlaceDetails(place.id)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:border-[#0072DC] hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-slate-900">
                    <img
                      src={
                        place.images?.[0] ||
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
                      }
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#072549]/85 via-transparent to-black/25" />

                    {/* Category Pill */}
                    <div
                      className={`absolute top-2.5 flex items-center gap-1.5 ${
                        isAr ? "right-2.5" : "left-2.5"
                      }`}
                    >
                      <span className="rounded-lg bg-[#072549]/90 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                        {place.categoryName}
                      </span>
                      {place.openNowStatus === "OPEN" && (
                        <span className="rounded-lg bg-emerald-600/90 px-2 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                          {isAr ? "مفتوح الآن" : "Open Now"}
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(place.id);
                      }}
                      className={`absolute top-2.5 flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur ${
                        isAr ? "left-2.5" : "right-2.5"
                      } ${
                        isFav
                          ? "bg-rose-600 text-white"
                          : "bg-black/45 text-white hover:bg-black/70"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? "fill-current" : ""}`}
                      />
                    </button>

                    {/* Bottom Image Overlay: Neighborhood & Completeness */}
                    <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between text-white">
                      <span className="text-xs font-extrabold drop-shadow">
                        {place.neighborhood}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-[#00D2B4] backdrop-blur">
                        <ShieldCheck className="h-3 w-3" />
                        {place.dataQuality?.completenessScore ?? 92}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#072549]">
                          {place.name}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                          {place.description}
                        </p>
                      </div>

                      {/* Internal Rating or Unrated State */}
                      <div className="shrink-0 text-right">
                        {isUnrated ? (
                          <span className="inline-flex items-center rounded-xl bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                            {isAr ? "غير مقيّم" : "Unrated"}
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2 py-1 text-xs font-extrabold text-amber-700">
                              <Star className="h-3.5 w-3.5 fill-[#FF991F] text-[#FF991F]" />
                              {place.rating?.avgRating}
                            </span>
                            <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                              ({place.rating?.reviewCount}{" "}
                              {isAr ? "مراجعة" : "reviews"})
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tri-State Attribute Chips */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
                      {place.attributes?.kidsFriendly === "AVAILABLE" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          {isAr ? "مناسب للأطفال" : "Kids Friendly"}
                        </span>
                      )}
                      {place.attributes?.parking === "AVAILABLE" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          {isAr ? "موقف سيارات" : "Parking"}
                        </span>
                      )}
                      {place.attributes?.valetParking === "AVAILABLE" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-800">
                          <CheckCircle2 className="h-2.5 w-2.5 text-teal-600" />
                          {isAr ? "فاليه (Valet)" : "Valet"}
                        </span>
                      )}
                      {hasUnknownPrice ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                          <HelpCircle className="h-2.5 w-2.5 text-amber-600" />
                          {isAr
                            ? "السعر: غير متاح في البيانات"
                            : "Price: Unavailable"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-bold text-[#0072DC]">
                          {place.priceRange} • {place.entryFeeStatus}
                        </span>
                      )}
                    </div>

                    {/* Injected Smart Parking Live Slot Status & Reserve CTA on Explore Cards */}
                    {place.parkingConfig && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPlaceDetails(place.id, "parking");
                        }}
                        className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/75 px-3 py-2 transition hover:border-emerald-400"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {place.parkingConfig.managementMode ===
                          "CAMERA_AI" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                              <Camera className="h-2.5 w-2.5" />
                              {isAr ? "كاميرا ذكية" : "Camera AI"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                              <Wrench className="h-2.5 w-2.5" />
                              {isAr ? "يدوي" : "Manual"}
                            </span>
                          )}
                          <span className="font-extrabold text-[#072549]">
                            {place.parkingConfig.availableSlotsCount} /{" "}
                            {place.parkingConfig.totalSlots}{" "}
                            {isAr ? "موقف متاح" : "Slots Free"}
                          </span>
                          {place.parkingConfig.reservedSlotsCount > 0 && (
                            <span className="text-[10px] font-bold text-amber-700">
                              • {place.parkingConfig.reservedSlotsCount}{" "}
                              {isAr ? "محجوز" : "Reserved"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPlaceDetails(place.id, "parking");
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#072549] px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-[#0c3566]"
                        >
                          <Car className="h-3 w-3 text-[#00D2B4]" />
                          {isAr ? "احجز موقف" : "Reserve Slot"}
                        </button>
                      </div>
                    )}

                    {/* Distance, Store/Menu Quick Button & External Score Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-bold text-[#072549]">
                          <Car className="h-3.5 w-3.5 text-[#0072DC]" />
                          {place.distance?.driveTimeMinutes}{" "}
                          {isAr ? "د بالسيارة" : "m drive"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Footprints className="h-3.5 w-3.5 text-[#00B89C]" />
                          {place.distance?.distanceKm} km
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {Array.isArray(place.catalogProducts) &&
                          place.catalogProducts.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPlaceDetails(place.id, "media");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0072DC]/10 px-2 py-1 text-[10px] font-extrabold text-[#0072DC] transition hover:bg-[#0072DC] hover:text-white"
                            >
                              <ShoppingBag className="h-3 w-3" />
                              <span>
                                {isAr ? "المنيو والطلب" : "Menu & Store"}
                              </span>
                            </button>
                          )}

                        {place.externalRating && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isAr ? "تقييم خارجي:" : "Ext:"}{" "}
                            <strong className="text-slate-600">
                              {place.externalRating.rating}/5
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
