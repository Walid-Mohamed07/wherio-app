"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  SlidersHorizontal,
  Sparkles,
  Heart,
  User,
  MapPin,
  Navigation,
  Lock,
} from "lucide-react";
import {
  WherioApi,
  CountryCode,
  LangCode,
  getStoredSessionToken,
  setStoredSessionToken,
  getStoredUserProfile,
  setStoredUserProfile,
  isOnboardingCompleted,
  setOnboardingCompleted,
} from "@/lib/api";
import GlobalCartDrawer, {
  GlobalCartItem,
  HeaderCartButton,
} from "@/components/GlobalCartDrawer";
import PlaceAndDealDrawer from "@/components/PlaceAndDealDrawer";
import OnboardingFlow, { OnboardingStep } from "@/components/OnboardingFlow";
import {
  WherioBrandLogo,
  RegionSelectDropdown,
  LanguageSelectDropdown,
} from "@/components/BrandLogoAndSelects";

export const CITY_COORDS: Record<
  string,
  {
    country: CountryCode;
    nameEn: string;
    nameAr: string;
    lat: number;
    lng: number;
  }
> = {
  abudhabi: {
    country: "AE",
    nameEn: "Abu Dhabi (Yas & Saadiyat)",
    nameAr: "أبوظبي (جزيرة ياس والسعديات)",
    lat: 24.4539,
    lng: 54.3773,
  },
  riyadh: {
    country: "SA",
    nameEn: "Riyadh (Al Olaya & Hittin)",
    nameAr: "الرياض (العليا وحطين)",
    lat: 24.7136,
    lng: 46.6753,
  },
  dubai: {
    country: "AE",
    nameEn: "Dubai (Downtown)",
    nameAr: "دبي (وسط المدينة)",
    lat: 25.2048,
    lng: 55.2708,
  },
  jeddah: {
    country: "SA",
    nameEn: "Jeddah (Corniche)",
    nameAr: "جدة (الكورنيش)",
    lat: 21.5433,
    lng: 39.1728,
  },
  cairo: {
    country: "EG",
    nameEn: "Cairo (New Cairo)",
    nameAr: "القاهرة (التجمع الخامس)",
    lat: 30.0444,
    lng: 31.2357,
  },
};

export interface WherioUserSession {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
}

interface WherioAppContextType {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  handleCountryChange: (c: CountryCode) => void;
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  isAr: boolean;
  countriesData: any[];
  categories: any[];
  placesList: any[];
  noResultsSuggestions: any | null;
  loading: boolean;
  fetchPlaces: () => Promise<void>;
  customGpsCoords: { lat: number; lng: number } | null;
  gpsStatusText: string | null;
  handleRequestGpsLocation: () => void;
  effectiveLat: number;
  effectiveLng: number;
  currentCityMeta: {
    country: CountryCode;
    nameEn: string;
    nameAr: string;
    lat: number;
    lng: number;
  };
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (sub: string) => void;
  selectedAreaId: string;
  setSelectedAreaId: (area: string) => void;
  keyword: string;
  setKeyword: (kw: string) => void;
  activeAttributeFilters: string[];
  setActiveAttributeFilters: React.Dispatch<React.SetStateAction<string[]>>;
  toggleAttributeFilter: (key: string) => void;
  sortBy: "relevance" | "distance" | "rating" | "completeness";
  setSortBy: (s: "relevance" | "distance" | "rating" | "completeness") => void;
  cart: GlobalCartItem[];
  handleUpdateCartItem: (item: GlobalCartItem, delta: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  currentUser: WherioUserSession;
  setAuthenticatedUser: (user: any, token?: string) => void;
  handleLogoutSession: () => Promise<void>;
  requireAuthThen: (action: () => void) => void;
  openPlaceDetails: (
    placeId: string,
    tab?: "overview" | "parking" | "media" | "reviews",
  ) => void;
  favoritePlaceIds: string[];
  handleToggleFavorite: (placeId: string) => Promise<void>;
  preferredCategories: string[];
  setPreferredCategories: React.Dispatch<React.SetStateAction<string[]>>;
  preferredAttributes: string[];
  setPreferredAttributes: React.Dispatch<React.SetStateAction<string[]>>;
  preferredPriceRange: "BUDGET" | "MODERATE" | "UPSCALE";
  setPreferredPriceRange: (p: "BUDGET" | "MODERATE" | "UPSCALE") => void;
  openOnboardingModal: (step?: OnboardingStep) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
}

const WherioAppContext = createContext<WherioAppContextType | null>(null);

export function useWherioApp() {
  const ctx = useContext(WherioAppContext);
  if (!ctx) {
    throw new Error("useWherioApp must be used inside WherioAppProvider");
  }
  return ctx;
}

const CART_STORAGE_KEY = "wherio_cart_items";
const FAVS_STORAGE_KEY = "wherio_favorite_ids";
const CITY_STORAGE_KEY = "wherio_city_id";

export function WherioAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const [hydrated, setHydrated] = useState(false);
  const [country, setCountry] = useState<CountryCode>("AE");
  const [selectedCityId, setSelectedCityIdState] = useState<string>("abudhabi");
  const [lang, setLangState] = useState<LangCode>("en");

  const isAr = lang === "ar";

  // Directory & Geo Metadata States
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [placesList, setPlacesList] = useState<any[]>([]);
  const [noResultsSuggestions, setNoResultsSuggestions] = useState<any | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // GPS Override
  const [customGpsCoords, setCustomGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [activeAttributeFilters, setActiveAttributeFilters] = useState<
    string[]
  >([]);
  const [sortBy, setSortBy] = useState<
    "relevance" | "distance" | "rating" | "completeness"
  >("relevance");

  // Place Drawer fallback if opened as modal
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceInitialTab, setSelectedPlaceInitialTab] = useState<
    "overview" | "parking" | "media" | "reviews"
  >("overview");

  // Cart
  const [cart, setCart] = useState<GlobalCartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Onboarding & Session State
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("done");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<
    (() => void) | null
  >(null);

  const [currentUser, setCurrentUser] = useState<WherioUserSession>({
    id: "",
    name: "",
    phone: "",
    email: "",
    role: "GUEST",
    isPhoneVerified: false,
    isEmailVerified: false,
  });

  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([
    "place-warner-bros-abudhabi",
    "place-rain-cafe-abudhabi",
    "place-elixir-bunn-riyadh",
  ]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    "cat-restaurants",
    "cat-cafes",
  ]);
  const [preferredAttributes, setPreferredAttributes] = useState<string[]>([
    "kids_friendly",
    "parking",
  ]);
  const [preferredPriceRange, setPreferredPriceRange] = useState<
    "BUDGET" | "MODERATE" | "UPSCALE"
  >("MODERATE");

  const setLang = (nextLang: LangCode) => {
    setLangState(nextLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wherio_lang", nextLang);
    }
  };

  const setSelectedCityId = (nextCityId: string) => {
    setSelectedCityIdState(nextCityId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CITY_STORAGE_KEY, nextCityId);
    }
  };

  const setAuthenticatedUser = (user: any, token?: string) => {
    if (token) {
      setStoredSessionToken(token);
    }
    const normalizedUser: WherioUserSession = {
      id: user.id,
      name: user.name || "Wherio Member",
      phone: user.phone || "",
      email: user.email || "",
      role: user.role || "CUSTOMER",
      isPhoneVerified: Boolean(user.isPhoneVerified),
      isEmailVerified: Boolean(user.isEmailVerified),
    };
    setCurrentUser(normalizedUser);
    setStoredUserProfile(normalizedUser);
    setIsAuthenticated(true);
    setOnboardingCompleted(true);
    setOnboardingStep("done");
  };

  // Immediate Synchronous Hydration from LocalStorage so refresh NEVER resets to starter screen or logs user out
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCountry = window.localStorage.getItem(
      "wherio_country",
    ) as CountryCode | null;
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY);
    const savedLang = window.localStorage.getItem(
      "wherio_lang",
    ) as LangCode | null;

    if (savedCountry && ["AE", "SA", "EG"].includes(savedCountry)) {
      setCountry(savedCountry);
    }
    if (savedCity && CITY_COORDS[savedCity]) {
      setSelectedCityIdState(savedCity);
    } else if (savedCountry) {
      setSelectedCityIdState(
        savedCountry === "SA"
          ? "riyadh"
          : savedCountry === "EG"
            ? "cairo"
            : "abudhabi",
      );
    }
    if (savedLang && ["en", "ar"].includes(savedLang)) {
      setLangState(savedLang);
    }

    // Restore Cart
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      // ignore
    }

    // Restore Favorites
    try {
      const savedFavs = window.localStorage.getItem(FAVS_STORAGE_KEY);
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed)) setFavoritePlaceIds(parsed);
      }
    } catch {
      // ignore
    }

    // Restore Session Profile & Token immediately (Zero re-login on refresh)
    const existingToken = getStoredSessionToken();
    const cachedProfile = getStoredUserProfile();
    const onboardingDone = isOnboardingCompleted();

    if (cachedProfile && cachedProfile.id) {
      setCurrentUser({
        id: cachedProfile.id,
        name: cachedProfile.name || "Wherio Member",
        phone: cachedProfile.phone || "",
        email: cachedProfile.email || "",
        role: cachedProfile.role || "CUSTOMER",
        isPhoneVerified: Boolean(cachedProfile.isPhoneVerified),
        isEmailVerified: Boolean(cachedProfile.isEmailVerified),
      });
      setIsAuthenticated(true);
      setOnboardingStep("done");
    } else if (onboardingDone || pathname !== "/") {
      // User already completed onboarding (or opened a specific deep route) -> stay on current page!
      setOnboardingCompleted(true);
      setOnboardingStep("done");
    } else {
      // True first-time visitor on root `/`
      setOnboardingStep("country");
    }

    setHydrated(true);

    // Background token validation / refresh with backend
    if (existingToken) {
      WherioApi.checkSession(savedCountry || "AE")
        .then((sessionRes) => {
          const validUser = sessionRes?.user;
          if ((sessionRes?.authenticated || sessionRes?.valid) && validUser) {
            setAuthenticatedUser(validUser, existingToken);
          } else if (sessionRes?.valid === false && !cachedProfile) {
            setStoredSessionToken(null);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // Network/cold-start transient error: keep cached user session alive
        });
    }
  }, []);

  // Save cart changes to localStorage
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  // Save favorites to localStorage
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(
      FAVS_STORAGE_KEY,
      JSON.stringify(favoritePlaceIds),
    );
  }, [favoritePlaceIds, hydrated]);

  // Preserve & restore per-route scroll position across browser refreshes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollKey = `wherio_scroll_${pathname}`;
    const savedScroll = window.sessionStorage.getItem(scrollKey);
    if (savedScroll) {
      const y = parseInt(savedScroll, 10);
      if (!Number.isNaN(y) && y > 0) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollKey = `wherio_scroll_${pathname}`;
    const handleScroll = () => {
      window.sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const currentCityMeta =
    CITY_COORDS[selectedCityId] || CITY_COORDS["abudhabi"];
  const effectiveLat = customGpsCoords?.lat ?? currentCityMeta.lat;
  const effectiveLng = customGpsCoords?.lng ?? currentCityMeta.lng;

  const handleCountryChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wherio_country", nextCountry);
    }
    if (nextCountry === "AE") {
      setSelectedCityId("abudhabi");
    } else if (nextCountry === "SA") {
      setSelectedCityId("riyadh");
    } else {
      setSelectedCityId("cairo");
    }
    setSelectedAreaId("");
    setCustomGpsCoords(null);
  };

  const handleRequestGpsLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setGpsStatusText(
        isAr ? "جاري تحديد موقعك الجغرافي..." : "Detecting GPS location...",
      );
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setSortBy("distance");
          setGpsStatusText(
            isAr
              ? "تم تفعيل الموقع الجغرافي المباشر (GPS)"
              : "Live GPS location enabled",
          );
        },
        () => {
          setCustomGpsCoords(null);
          setGpsStatusText(
            isAr
              ? "تعذر الوصول لـ GPS — تم الاعتماد تلقائياً على مركز المدينة المختارة"
              : "GPS unavailable — automatically using selected city center",
          );
        },
        { timeout: 5000 },
      );
    } else {
      setGpsStatusText(
        isAr
          ? "يتم استخدام إحداثيات المدينة المختارة"
          : "Using selected city coordinates",
      );
    }
  };

  useEffect(() => {
    WherioApi.getCountries(country, lang)
      .then((res) => setCountriesData(res || []))
      .catch(console.error);
    WherioApi.getCategories(country, lang)
      .then((res) => setCategories(res || []))
      .catch(console.error);
  }, [country, lang]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await WherioApi.getNearbyPlaces(
        {
          lat: effectiveLat,
          lng: effectiveLng,
          radiusKm: 60,
          cityId: selectedCityId,
          areaId: selectedAreaId || undefined,
          categoryId: selectedCategory || undefined,
          subCategoryId: selectedSubCategory || undefined,
          keyword: keyword.trim() || undefined,
          amenities: activeAttributeFilters.join(","),
          sortBy,
        },
        country,
        lang,
      );
      setPlacesList(res?.places || []);
      setNoResultsSuggestions(res?.noResultsSuggestions || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [
    country,
    selectedCityId,
    selectedAreaId,
    selectedCategory,
    selectedSubCategory,
    keyword,
    activeAttributeFilters,
    sortBy,
    lang,
    effectiveLat,
    effectiveLng,
  ]);

  const handleUpdateCartItem = (item: GlobalCartItem, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (!existing && delta > 0) {
        return [...prev, { ...item, quantity: delta }];
      }
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter((c) => c.productId !== item.productId);
        }
        return prev.map((c) =>
          c.productId === item.productId ? { ...c, quantity: nextQty } : c,
        );
      }
      return prev;
    });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 450);
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const totalCartItemsCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const requireAuthThen = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingActionAfterAuth(() => action);
      setShowAuthGateModal(true);
    }
  };

  const openPlaceDetails = (
    placeId: string,
    tab: "overview" | "parking" | "media" | "reviews" = "overview",
  ) => {
    const query = tab && tab !== "overview" ? `?tab=${tab}` : "";
    router.push(`/places/${encodeURIComponent(placeId)}${query}`);
  };

  const handleToggleFavorite = async (placeId: string) => {
    requireAuthThen(async () => {
      setFavoritePlaceIds((prev) =>
        prev.includes(placeId)
          ? prev.filter((id) => id !== placeId)
          : [...prev, placeId],
      );
      try {
        await WherioApi.toggleFavorite(currentUser.id, placeId, country);
      } catch (e) {
        console.error(e);
      }
    });
  };

  const toggleAttributeFilter = (key: string) => {
    setActiveAttributeFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleLogoutSession = async () => {
    try {
      if (currentUser.id) {
        await WherioApi.logout(currentUser.id, country);
      }
    } catch (e) {
      console.error(e);
    }
    setStoredSessionToken(null);
    setStoredUserProfile(null);
    setIsAuthenticated(false);
    setCurrentUser({
      id: "",
      name: "",
      phone: "",
      email: "",
      role: "GUEST",
      isPhoneVerified: false,
      isEmailVerified: false,
    });
  };

  const openOnboardingModal = (step: OnboardingStep = "country") => {
    setOnboardingStep(step);
  };

  const allCities = countriesData.flatMap((c) => c.cities || []);

  if (hydrated && onboardingStep !== "done") {
    return (
      <OnboardingFlow
        step={onboardingStep}
        setStep={setOnboardingStep}
        country={country}
        onSelectCountry={handleCountryChange}
        lang={lang}
        onSelectLang={setLang}
        countriesData={countriesData}
        onAuthenticated={(user, token) => {
          setAuthenticatedUser(user, token);
          if (pendingActionAfterAuth) {
            pendingActionAfterAuth();
            setPendingActionAfterAuth(null);
          }
        }}
        onContinueAsGuest={() => {
          setOnboardingCompleted(true);
          setOnboardingStep("done");
        }}
      />
    );
  }

  const navItems = [
    {
      id: "explore",
      href: "/",
      labelEn: "Explore",
      labelAr: "استكشف",
      icon: <Home className="h-4 w-4" />,
      requiresAuth: false,
    },
    {
      id: "search",
      href: "/filters",
      labelEn: "Filters",
      labelAr: "الفلاتر",
      icon: <SlidersHorizontal className="h-4 w-4" />,
      requiresAuth: false,
    },
    {
      id: "ai",
      href: "/ai-concierge",
      labelEn: "AI Concierge",
      labelAr: "المساعد الذكي",
      icon: <Sparkles className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      id: "favorites",
      href: "/favorites",
      labelEn: "Favorites",
      labelAr: "المفضلة",
      icon: <Heart className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      id: "account",
      href: "/account",
      labelEn: "Account",
      labelAr: "حسابي",
      icon: <User className="h-4 w-4" />,
      requiresAuth: false,
    },
  ];

  return (
    <WherioAppContext.Provider
      value={{
        country,
        setCountry,
        handleCountryChange,
        selectedCityId,
        setSelectedCityId,
        lang,
        setLang,
        isAr,
        countriesData,
        categories,
        placesList,
        noResultsSuggestions,
        loading,
        fetchPlaces,
        customGpsCoords,
        gpsStatusText,
        handleRequestGpsLocation,
        effectiveLat,
        effectiveLng,
        currentCityMeta,
        selectedCategory,
        setSelectedCategory,
        selectedSubCategory,
        setSelectedSubCategory,
        selectedAreaId,
        setSelectedAreaId,
        keyword,
        setKeyword,
        activeAttributeFilters,
        setActiveAttributeFilters,
        toggleAttributeFilter,
        sortBy,
        setSortBy,
        cart,
        handleUpdateCartItem,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isAuthenticated,
        currentUser,
        setAuthenticatedUser,
        handleLogoutSession,
        requireAuthThen,
        openPlaceDetails,
        favoritePlaceIds,
        handleToggleFavorite,
        preferredCategories,
        setPreferredCategories,
        preferredAttributes,
        setPreferredAttributes,
        preferredPriceRange,
        setPreferredPriceRange,
        openOnboardingModal,
        selectedPlaceId,
        setSelectedPlaceId,
      }}
    >
      <div className="min-h-screen bg-slate-900 flex justify-center">
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50 shadow-2xl"
        >
          {/* TOP STICKY BAR: Wherio Logo, Compact Country/Language Switchers & Global Cart SVG Button */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-3.5 pt-3 pb-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-1.5">
              <div
                onClick={() => router.push("/")}
                className="cursor-pointer"
              >
                <WherioBrandLogo size="sm" showSubtitle={true} isAr={isAr} />
              </div>

              <div className="flex items-center gap-1.5">
                <RegionSelectDropdown
                  value={country}
                  onChange={handleCountryChange}
                  lang={lang}
                  variant="compact"
                />
                <LanguageSelectDropdown
                  value={lang}
                  onChange={setLang}
                  variant="compact"
                />
                <HeaderCartButton
                  totalItemsCount={totalCartItemsCount}
                  activeOrdersCount={activeOrdersCount}
                  pulse={cartPulse}
                  onClick={() => setIsCartDrawerOpen(true)}
                  isAr={isAr}
                />
              </div>
            </div>

            {/* Launch City Quick Selector Bar */}
            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#072549]/5 px-2.5 py-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-[#072549]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0072DC]" />
                <span>{isAr ? "المدينة:" : "City:"}</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  {
                    id: "abudhabi",
                    country: "AE" as CountryCode,
                    en: "Abu Dhabi",
                    ar: "أبوظبي",
                  },
                  {
                    id: "riyadh",
                    country: "SA" as CountryCode,
                    en: "Riyadh",
                    ar: "الرياض",
                  },
                  ...allCities
                    .filter(
                      (c) =>
                        c.isActive && c.id !== "abudhabi" && c.id !== "riyadh",
                    )
                    .map((c) => ({
                      id: c.id,
                      country: c.countryCode as CountryCode,
                      en: c.nameEn,
                      ar: c.nameAr,
                    })),
                ].map((cityPill) => {
                  const isSelected = selectedCityId === cityPill.id;
                  return (
                    <button
                      key={cityPill.id}
                      onClick={() => {
                        setSelectedCityId(cityPill.id);
                        setCountry(cityPill.country);
                        if (typeof window !== "undefined") {
                          window.localStorage.setItem(
                            "wherio_country",
                            cityPill.country,
                          );
                        }
                        setSelectedAreaId("");
                        setCustomGpsCoords(null);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                        isSelected
                          ? "bg-[#072549] text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isAr ? cityPill.ar : cityPill.en}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleRequestGpsLocation}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0072DC]/15 px-2 py-1 text-[10px] font-extrabold text-[#0072DC] hover:bg-[#0072DC] hover:text-white"
                  title={isAr ? "استخدام موقعي الحالي" : "Use My GPS Location"}
                >
                  <Navigation className="h-3 w-3" />
                  <span>{isAr ? "موقعي" : "Near Me"}</span>
                </button>
              </div>
            </div>

            {gpsStatusText && (
              <p className="mt-1 text-[10px] font-semibold text-[#0072DC]">
                {gpsStatusText}
              </p>
            )}
          </header>

          {/* MAIN APP ROUTER PAGE VIEW */}
          <main className="flex-1 px-3.5 pt-3 pb-24">{children}</main>

          {/* REGISTRATION / LOGIN GATE MODAL */}
          {showAuthGateModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
              <div
                dir={isAr ? "rtl" : "ltr"}
                className="w-full max-w-[390px] rounded-2xl bg-white p-5 shadow-2xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#072549] text-white">
                    <Lock className="h-5 w-5 text-[#FFC233]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#072549]">
                      {isAr
                        ? "تسجيل الدخول مطلوب للمتابعة"
                        : "Sign In Required to Continue"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? "يتطلب استخدام الموقع والتواصل المباشر أو المساعد الذكي أو حفظ المفضلة حساباً مسجلاً في ويريو."
                        : "Using Location & Direct Contact, the AI Concierge, or saving Favorites requires a registered Wherio account."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setShowAuthGateModal(false);
                      setOnboardingStep("auth");
                    }}
                    className="w-full rounded-xl bg-[#072549] py-2.5 text-xs font-extrabold text-white hover:bg-[#0072DC]"
                  >
                    {isAr
                      ? "تسجيل الدخول أو إنشاء حساب (هاتف OTP + بريد إلكتروني)"
                      : "Sign In or Create Account (Phone OTP & Email)"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthGateModal(false);
                      router.push("/account");
                    }}
                    className="w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-[#072549]"
                  >
                    {isAr
                      ? "الانتقال إلى صفحة حسابي"
                      : "Go to Account Settings"}
                  </button>
                  <button
                    onClick={() => setShowAuthGateModal(false)}
                    className="w-full py-1.5 text-[11px] font-semibold text-slate-400"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTIONAL PLACE DETAILS OVERLAY DRAWER */}
          {selectedPlaceId && (
            <PlaceAndDealDrawer
              placeId={selectedPlaceId}
              country={country}
              lang={lang}
              userCoords={{
                lat: effectiveLat,
                lng: effectiveLng,
              }}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              isFavorite={favoritePlaceIds.includes(selectedPlaceId)}
              onToggleFavorite={handleToggleFavorite}
              onRequireAuth={() => {
                setPendingActionAfterAuth(null);
                setShowAuthGateModal(true);
              }}
              onRequireVerifyEmail={() => {
                setSelectedPlaceId(null);
                router.push("/account");
              }}
              onClose={() => setSelectedPlaceId(null)}
              initialTab={selectedPlaceInitialTab}
              cart={cart}
              onUpdateCartItem={handleUpdateCartItem}
              onOpenCart={() => {
                setSelectedPlaceId(null);
                setIsCartDrawerOpen(true);
              }}
              onParkingUpdated={fetchPlaces}
            />
          )}

          {/* GLOBAL UNIFIED CART & ORDERS DRAWER */}
          <GlobalCartDrawer
            isOpen={isCartDrawerOpen}
            onClose={() => setIsCartDrawerOpen(false)}
            cart={cart}
            onUpdateQty={handleUpdateCartItem}
            onClearCart={clearCart}
            cityId={selectedCityId}
            lang={lang}
            user={{
              id: currentUser.id,
              displayName: currentUser.name,
              phone: currentUser.phone,
            }}
            onActiveOrdersCountChange={setActiveOrdersCount}
          />

          {/* BOTTOM NAVIGATION BAR (APP ROUTER ROUTES) */}
          <nav className="fixed bottom-0 z-30 flex w-full max-w-[430px] items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur-md">
            {navItems.map((tab) => {
              const active =
                tab.href === "/"
                  ? pathname === "/" || pathname.startsWith("/places/")
                  : pathname.startsWith(tab.href);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.requiresAuth) {
                      requireAuthThen(() => router.push(tab.href));
                    } else {
                      router.push(tab.href);
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-extrabold transition ${
                    active
                      ? "text-[#0072DC]"
                      : "text-slate-400 hover:text-[#072549]"
                  }`}
                >
                  <div
                    className={`rounded-xl p-1 transition ${
                      active ? "bg-[#0072DC]/10 text-[#0072DC]" : ""
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </WherioAppContext.Provider>
  );
}
