"use client";

import React from "react";
import { Search, CheckCircle2, Star } from "lucide-react";
import { useWherioApp } from "@/context/WherioAppContext";

export default function FiltersPage() {
  const {
    isAr,
    countriesData,
    selectedCityId,
    placesList,
    keyword,
    setKeyword,
    selectedAreaId,
    setSelectedAreaId,
    selectedCategory,
    setSelectedCategory,
    setSelectedSubCategory,
    activeAttributeFilters,
    setActiveAttributeFilters,
    toggleAttributeFilter,
    openPlaceDetails,
  } = useWherioApp();

  const allCities = countriesData.flatMap((c) => c.cities || []);
  const activeCityObj = allCities.find((c) => c.id === selectedCityId);
  const currentCityAreas = activeCityObj?.areas || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="text-sm font-extrabold text-[#072549]">
          {isAr
            ? "البحث المتقدم والفلاتر المركبة"
            : "Advanced Search & Compound Filters"}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {isAr
            ? "ابحث بالاسم، المنطقة، التصنيف الفرعي، والتجهيزات المتعددة في آن واحد"
            : "Filter by keyword, district/area, sub-category, and confirmed practical facilities"}
        </p>

        {/* Keyword Input */}
        <div className="relative mt-3">
          <Search
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
              isAr ? "right-3" : "left-3"
            }`}
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={
              isAr
                ? "ابحث باسم المكان أو الحي (مثال: وارنر براذرز، إكسير بن)..."
                : "Search venue name or district (e.g., Warner Bros, Elixir)..."
            }
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
              isAr ? "pr-9 pl-3" : "pl-9 pr-3"
            }`}
          />
        </div>

        {/* Area / District Filter */}
        {currentCityAreas.length > 0 && (
          <div className="mt-3">
            <label className="text-[11px] font-extrabold text-[#072549]">
              {isAr
                ? "المنطقة / الحي داخل المدينة:"
                : "Area / District inside City:"}
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedAreaId("")}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                  selectedAreaId === ""
                    ? "bg-[#072549] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isAr ? "كل المناطق" : "All Areas"}
              </button>
              {currentCityAreas.map((area: any) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                    selectedAreaId === area.id
                      ? "bg-[#0072DC] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isAr ? area.nameAr : area.nameEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compound Attribute Checkboxes */}
        <div className="mt-3">
          <label className="text-[11px] font-extrabold text-[#072549]">
            {isAr
              ? "التجهيزات العملية المؤكدة وحالة العمل:"
              : "Confirmed Facilities & Availability:"}
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[
              {
                key: "open_now",
                en: "Open Now",
                ar: "مفتوح الآن",
              },
              {
                key: "kids_friendly",
                en: "Kids Friendly",
                ar: "مناسب للأطفال",
              },
              {
                key: "parking",
                en: "Parking Available",
                ar: "مواقف سيارات",
              },
              {
                key: "valet",
                en: "Valet Service",
                ar: "خدمة صف السيارات (فاليه)",
              },
              {
                key: "outdoor_seating",
                en: "Outdoor Seating",
                ar: "جلسات خارجية",
              },
              {
                key: "wheelchair_accessible",
                en: "Wheelchair Access",
                ar: "كراسي متحركة",
              },
              {
                key: "wifi",
                en: "Wi-Fi Available",
                ar: "واي فاي متاح",
              },
              {
                key: "free_entry",
                en: "Free Entry",
                ar: "دخول مجاني",
              },
              {
                key: "no_reservation",
                en: "No Reservation Needed",
                ar: "بدون حجز مسبق",
              },
            ].map((attr) => {
              const active = activeAttributeFilters.includes(attr.key);
              return (
                <button
                  key={attr.key}
                  type="button"
                  onClick={() => toggleAttributeFilter(attr.key)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "border-[#00B89C] bg-[#00B89C]/10 text-[#072549]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span>{isAr ? attr.ar : attr.en}</span>
                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-[#00B89C]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtered Results */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#072549]">
            {isAr
              ? `النتائج المطابقة (${placesList.length}):`
              : `Matched Venues (${placesList.length}):`}
          </span>
          {(keyword ||
            selectedAreaId ||
            selectedCategory ||
            activeAttributeFilters.length > 0) && (
            <button
              onClick={() => {
                setKeyword("");
                setSelectedAreaId("");
                setSelectedCategory("");
                setSelectedSubCategory("");
                setActiveAttributeFilters([]);
              }}
              className="text-[11px] font-bold text-rose-600 underline"
            >
              {isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}
            </button>
          )}
        </div>

        {placesList.map((place: any) => (
          <div
            key={place.id}
            onClick={() => openPlaceDetails(place.id)}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs transition hover:border-[#0072DC]"
          >
            <div className="flex items-center gap-3">
              <img
                src={place.images?.[0]}
                alt={place.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div>
                <h4 className="text-xs font-extrabold text-[#072549]">
                  {place.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {place.neighborhood} • {place.categoryName}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-[#0072DC]">
                  {place.distance?.etaSummary}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                <Star className="h-3 w-3 fill-[#FF991F] text-[#FF991F]" />
                {place.rating?.avgRating}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
