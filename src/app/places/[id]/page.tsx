"use client";

import React, { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PlaceAndDealDrawer from "@/components/PlaceAndDealDrawer";
import { useWherioApp } from "@/context/WherioAppContext";

function PlaceDetailsRouteContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    country,
    lang,
    effectiveLat,
    effectiveLng,
    currentUser,
    isAuthenticated,
    favoritePlaceIds,
    handleToggleFavorite,
    requireAuthThen,
    cart,
    handleUpdateCartItem,
    setIsCartDrawerOpen,
    fetchPlaces,
  } = useWherioApp();

  const rawId = params?.id;
  const placeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const tabParam = searchParams.get("tab");
  const initialTab: "overview" | "parking" | "media" | "reviews" =
    tabParam === "parking" || tabParam === "media" || tabParam === "reviews"
      ? tabParam
      : "overview";

  if (!placeId) return null;

  const decodedId = decodeURIComponent(placeId);

  const handleTabChange = (
    nextTab: "overview" | "parking" | "media" | "reviews",
  ) => {
    const query = nextTab === "overview" ? "" : `?tab=${nextTab}`;
    router.replace(`/places/${encodeURIComponent(decodedId)}${query}`, {
      scroll: false,
    });
  };

  return (
    <PlaceAndDealDrawer
      placeId={decodedId}
      country={country}
      lang={lang}
      userCoords={{
        lat: effectiveLat,
        lng: effectiveLng,
      }}
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      isFavorite={favoritePlaceIds.includes(decodedId)}
      onToggleFavorite={handleToggleFavorite}
      onRequireAuth={() => {
        requireAuthThen(() => {});
      }}
      onRequireVerifyEmail={() => {
        router.push("/account");
      }}
      onClose={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      initialTab={initialTab}
      onTabChange={handleTabChange}
      asPage={true}
      cart={cart}
      onUpdateCartItem={handleUpdateCartItem}
      onOpenCart={() => setIsCartDrawerOpen(true)}
      onParkingUpdated={fetchPlaces}
    />
  );
}

export default function PlaceDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-bold text-[#072549]">
          Loading place profile...
        </div>
      }
    >
      <PlaceDetailsRouteContent />
    </Suspense>
  );
}
