"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWherioApp } from "@/context/WherioAppContext";

export default function FavoritesPage() {
  const {
    isAr,
    placesList,
    favoritePlaceIds,
    handleToggleFavorite,
    openPlaceDetails,
  } = useWherioApp();

  const savedPlaces = placesList.filter((p) => favoritePlaceIds.includes(p.id));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#072549] p-4 text-white">
        <h2 className="text-sm font-extrabold">
          {isAr
            ? "قائمة الأماكن المفضلة المحفوظة"
            : "Your Saved Favorite Places"}
        </h2>
        <p className="mt-0.5 text-[11px] text-sky-100">
          {isAr
            ? "الأماكن التي قمت بحفظها للرجوع إليها سريعاً في أبوظبي والرياض"
            : "Quick access to places you bookmarked across Abu Dhabi & Riyadh"}
        </p>
      </div>

      {savedPlaces.map((place) => (
        <div
          key={place.id}
          onClick={() => openPlaceDetails(place.id)}
          className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs"
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
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(place.id);
            }}
            className="rounded-xl bg-rose-50 p-2 text-rose-600"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        </div>
      ))}

      {savedPlaces.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
          {isAr
            ? "لا توجد أماكن مفضلة في هذه المدينة حالياً. اضغط على أيقونة القلب لحفظ أي مكان."
            : "No saved favorites in this city yet. Tap the heart icon on any venue to bookmark it."}
        </div>
      )}
    </div>
  );
}
