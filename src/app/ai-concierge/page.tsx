"use client";

import React from "react";
import AiConciergeTab from "@/components/AiConciergeTab";
import { useWherioApp } from "@/context/WherioAppContext";

export default function AiConciergePage() {
  const {
    country,
    lang,
    isAr,
    selectedCityId,
    effectiveLat,
    effectiveLng,
    currentCityMeta,
    openPlaceDetails,
  } = useWherioApp();

  return (
    <AiConciergeTab
      country={country}
      lang={lang}
      cityId={selectedCityId}
      userCoords={{
        lat: effectiveLat,
        lng: effectiveLng,
        label: isAr ? currentCityMeta.nameAr : currentCityMeta.nameEn,
      }}
      onSelectPlace={(id) => openPlaceDetails(id)}
    />
  );
}
