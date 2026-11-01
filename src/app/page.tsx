'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Home,
  Sparkles,
  User,
  MapPin,
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
  ExternalLink,
  SlidersHorizontal,
  CheckCircle2,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  Accessibility,
  Sun,
  Ticket,
  Clock,
  Navigation,
  LogOut,
  RefreshCw,
  KeyRound,
  Compass,
} from 'lucide-react';
import {
  AwfarApi,
  CountryCode,
  LangCode,
  getStoredSessionToken,
  setStoredSessionToken,
} from '@/lib/api';
import AiConciergeTab from '@/components/AiConciergeTab';
import PlaceAndDealDrawer from '@/components/PlaceAndDealDrawer';
import OnboardingFlow, { OnboardingStep } from '@/components/OnboardingFlow';
import {
  WherioBrandLogo,
  RegionSelectDropdown,
  LanguageSelectDropdown,
} from '@/components/BrandLogoAndSelects';

const CITY_COORDS: Record<
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
    country: 'AE',
    nameEn: 'Abu Dhabi (Yas & Saadiyat)',
    nameAr: 'أبوظبي (جزيرة ياس والسعديات)',
    lat: 24.4539,
    lng: 54.3773,
  },
  riyadh: {
    country: 'SA',
    nameEn: 'Riyadh (Al Olaya & Hittin)',
    nameAr: 'الرياض (العليا وحطين)',
    lat: 24.7136,
    lng: 46.6753,
  },
  dubai: {
    country: 'AE',
    nameEn: 'Dubai (Downtown)',
    nameAr: 'دبي (وسط المدينة)',
    lat: 25.2048,
    lng: 55.2708,
  },
  jeddah: {
    country: 'SA',
    nameEn: 'Jeddah (Corniche)',
    nameAr: 'جدة (الكورنيش)',
    lat: 21.5433,
    lng: 39.1728,
  },
  cairo: {
    country: 'EG',
    nameEn: 'Cairo (New Cairo)',
    nameAr: 'القاهرة (التجمع الخامس)',
    lat: 30.0444,
    lng: 31.2357,
  },
};

export default function WherioCustomerWebApp() {
  const [country, setCountry] = useState<CountryCode>('AE');
  const [selectedCityId, setSelectedCityId] = useState<string>('abudhabi');
  const [lang, setLang] = useState<LangCode>('en');
  const [activeBottomTab, setActiveBottomTab] = useState<
    'explore' | 'search' | 'ai' | 'favorites' | 'account'
  >('explore');

  const isAr = lang === 'ar';

  // Directory & Geo Metadata States
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [placesList, setPlacesList] = useState<any[]>([]);
  const [noResultsSuggestions, setNoResultsSuggestions] = useState<any | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Browser GPS Override State (Request Location Permission / Fallback Location Mode)
  const [customGpsCoords, setCustomGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string | null>(null);

  // Compound Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [activeAttributeFilters, setActiveAttributeFilters] = useState<
    string[]
  >([]);
  const [sortBy, setSortBy] = useState<
    'relevance' | 'distance' | 'rating' | 'completeness'
  >('relevance');

  // Selected Place Drawer
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Onboarding & Session Check Flow (Splash -> Country -> Get Started Slides -> Login / Guest)
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>('splash');

  // Identity, Dual Verification & Registration Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<
    (() => void) | null
  >(null);

  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    role: 'GUEST',
    isPhoneVerified: false,
    isEmailVerified: false,
  });
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([
    'place-warner-bros-abudhabi',
    'place-rain-cafe-abudhabi',
    'place-elixir-bunn-riyadh',
  ]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    'cat-restaurants',
    'cat-cafes',
  ]);
  const [preferredAttributes, setPreferredAttributes] = useState<string[]>([
    'kids_friendly',
    'parking',
  ]);
  const [preferredPriceRange, setPreferredPriceRange] = useState<
    'BUDGET' | 'MODERATE' | 'UPSCALE'
  >('MODERATE');

  // OTP & Email Form States
  const [phoneInput, setPhoneInput] = useState('+971504445566');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);

  // Startup Splash Screen & Active Session Check
  useEffect(() => {
    let mounted = true;
    const verifyStartupSession = async () => {
      const savedCountry =
        typeof window !== 'undefined'
          ? (window.localStorage.getItem('wherio_country') as CountryCode | null)
          : null;
      const savedLang =
        typeof window !== 'undefined'
          ? (window.localStorage.getItem('wherio_lang') as LangCode | null)
          : null;
      if (savedCountry && ['AE', 'SA', 'EG'].includes(savedCountry)) {
        setCountry(savedCountry);
        setSelectedCityId(
          savedCountry === 'SA'
            ? 'riyadh'
            : savedCountry === 'EG'
              ? 'cairo'
              : 'abudhabi',
        );
      }
      if (savedLang && ['en', 'ar'].includes(savedLang)) {
        setLang(savedLang);
      }

      const existingToken = getStoredSessionToken();
      await new Promise((r) => setTimeout(r, 1100));
      if (!mounted) return;

      if (existingToken) {
        try {
          const sessionRes = await AwfarApi.checkSession(savedCountry || 'AE');
          if (sessionRes?.authenticated && sessionRes?.user) {
            setCurrentUser({
              id: sessionRes.user.id,
              name: sessionRes.user.name,
              phone: sessionRes.user.phone,
              email: sessionRes.user.email,
              role: sessionRes.user.role,
              isPhoneVerified: sessionRes.user.isPhoneVerified,
              isEmailVerified: sessionRes.user.isEmailVerified,
            });
            setNameInput(sessionRes.user.name || '');
            setPhoneInput(sessionRes.user.phone || '');
            setEmailInput(sessionRes.user.email || '');
            setIsAuthenticated(true);
            setOnboardingStep('done');
            return;
          }
        } catch {
          setStoredSessionToken(null);
        }
      }

      // No active authenticated token -> start onboarding at Country Selection (Page 2 of PDF)
      setOnboardingStep('country');
    };

    verifyStartupSession();
    return () => {
      mounted = false;
    };
  }, []);

  const currentCityMeta =
    CITY_COORDS[selectedCityId] || CITY_COORDS['abudhabi'];
  const effectiveLat = customGpsCoords?.lat ?? currentCityMeta.lat;
  const effectiveLng = customGpsCoords?.lng ?? currentCityMeta.lng;

  // Sync country switcher with launch city
  const handleCountryChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wherio_country', nextCountry);
    }
    if (nextCountry === 'AE') {
      setSelectedCityId('abudhabi');
    } else if (nextCountry === 'SA') {
      setSelectedCityId('riyadh');
    } else {
      setSelectedCityId('cairo');
    }
    setSelectedAreaId('');
    setCustomGpsCoords(null);
  };

  // Request Browser GPS Location Permission with Automatic City Fallback
  const handleRequestGpsLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsStatusText(
        isAr ? 'جاري تحديد موقعك الجغرافي...' : 'Detecting GPS location...',
      );
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setSortBy('distance');
          setGpsStatusText(
            isAr
              ? 'تم تفعيل الموقع الجغرافي المباشر (GPS)'
              : 'Live GPS location enabled',
          );
        },
        () => {
          setCustomGpsCoords(null);
          setGpsStatusText(
            isAr
              ? 'تعذر الوصول لـ GPS — تم الاعتماد تلقائياً على مركز المدينة المختارة'
              : 'GPS unavailable — automatically using selected city center',
          );
        },
        { timeout: 5000 },
      );
    } else {
      setGpsStatusText(
        isAr
          ? 'يتم استخدام إحداثيات المدينة المختارة'
          : 'Using selected city coordinates',
      );
    }
  };

  // Load Countries, Active Cities & Categories
  useEffect(() => {
    AwfarApi.getCountries(country, lang)
      .then((res) => setCountriesData(res || []))
      .catch(console.error);
    AwfarApi.getCategories(country, lang)
      .then((res) => setCategories(res || []))
      .catch(console.error);
  }, [country, lang]);

  // Load Filtered Places
  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await AwfarApi.getNearbyPlaces(
        {
          lat: effectiveLat,
          lng: effectiveLng,
          radiusKm: 60,
          cityId: selectedCityId,
          areaId: selectedAreaId || undefined,
          categoryId: selectedCategory || undefined,
          subCategoryId: selectedSubCategory || undefined,
          keyword: keyword.trim() || undefined,
          amenities: activeAttributeFilters.join(','),
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

  // Registration Gate Guard (Public directory preview is open; Place Details, AI Concierge & Favorites require login)
  const requireAuthThen = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingActionAfterAuth(() => action);
      setShowAuthGateModal(true);
    }
  };

  const handleOpenPlaceDetails = (placeId: string) => {
    requireAuthThen(() => {
      setSelectedPlaceId(placeId);
    });
  };

  const handleToggleFavorite = async (placeId: string) => {
    requireAuthThen(async () => {
      setFavoritePlaceIds((prev) =>
        prev.includes(placeId)
          ? prev.filter((id) => id !== placeId)
          : [...prev, placeId],
      );
      try {
        await AwfarApi.toggleFavorite(currentUser.id, placeId, country);
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

  const handleVerifyOtpAndEmail = async () => {
    try {
      const res = await AwfarApi.verifyOtp(
        phoneInput,
        otpInput,
        nameInput || 'Wherio Member',
        country,
        emailInput || undefined,
      );
      if (res?.accessToken) {
        setStoredSessionToken(res.accessToken);
      }
      if (res?.user) {
        setCurrentUser({
          id: res.user.id,
          name: res.user.name,
          phone: res.user.phone,
          email: res.user.email,
          role: res.user.role,
          isPhoneVerified: res.user.isPhoneVerified,
          isEmailVerified: res.user.isEmailVerified,
        });
        setIsAuthenticated(true);
        setShowAuthGateModal(false);
        setAuthStatusMsg(
          isAr
            ? 'تم تسجيل الدخول وتوثيق الهاتف (OTP) والبريد الإلكتروني بنجاح!'
            : 'Signed in with Verified Phone (OTP) + Verified Unique Email!',
        );
        if (pendingActionAfterAuth) {
          pendingActionAfterAuth();
          setPendingActionAfterAuth(null);
        }
      }
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleVerifyEmailOnly = async () => {
    try {
      const res = await AwfarApi.verifyEmail(
        currentUser.id,
        emailInput,
        country,
      );
      if (res?.user) {
        setCurrentUser((prev) => ({
          ...prev,
          email: res.user.email,
          isEmailVerified: true,
        }));
        setAuthStatusMsg(isAr ? res.messageAr : res.messageEn);
      }
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await AwfarApi.resendVerification(
        phoneInput || emailInput,
        country,
      );
      setAuthStatusMsg(isAr ? res.messageAr : res.messageEn);
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleRecoverAccount = async () => {
    try {
      const res = await AwfarApi.recoverAccount(
        phoneInput || emailInput,
        country,
      );
      if (res?.user) {
        setCurrentUser({
          id: res.user.id,
          name: res.user.name,
          phone: res.user.phone,
          email: res.user.email,
          role: res.user.role,
          isPhoneVerified: res.user.isPhoneVerified,
          isEmailVerified: res.user.isEmailVerified,
        });
        setIsAuthenticated(true);
        setAuthStatusMsg(isAr ? res.messageAr : res.messageEn);
      }
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleSaveProfileAndPreferences = async () => {
    try {
      const profRes = await AwfarApi.updateProfile(
        currentUser.id,
        { name: nameInput, phone: phoneInput, email: emailInput },
        country,
      );
      await AwfarApi.updatePreferences(
        currentUser.id,
        {
          preferredLanguage: lang,
          preferredCityId: selectedCityId,
          preferredCategories,
          preferredAttributes,
          preferredPriceRange,
        },
        country,
      );
      if (profRes?.user) {
        setCurrentUser({
          id: profRes.user.id,
          name: profRes.user.name,
          phone: profRes.user.phone,
          email: profRes.user.email,
          role: profRes.user.role,
          isPhoneVerified: profRes.user.isPhoneVerified,
          isEmailVerified: profRes.user.isEmailVerified,
        });
      }
      setAuthStatusMsg(
        isAr
          ? 'تم حفظ بيانات الملف الشخصي وتفضيلات اللغة والمدينة بنجاح.'
          : 'Profile details, preferred language, and preferred city saved.',
      );
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleLogoutSession = async () => {
    try {
      if (currentUser.id) {
        await AwfarApi.logout(currentUser.id, country);
      }
    } catch (e) {
      console.error(e);
    }
    setStoredSessionToken(null);
    setIsAuthenticated(false);
    setCurrentUser({
      id: '',
      name: '',
      phone: '',
      email: '',
      role: 'GUEST',
      isPhoneVerified: false,
      isEmailVerified: false,
    });
    setAuthStatusMsg(
      isAr
        ? 'تم تسجيل الخروج بنجاح. أنت الآن في وضع الزائر.'
        : 'Signed out cleanly. You are now browsing as a Guest.',
    );
  };

  // Extract active cities from countriesData
  const allCities = countriesData.flatMap((c) => c.cities || []);
  const activeCityObj = allCities.find((c) => c.id === selectedCityId);
  const currentCityAreas = activeCityObj?.areas || [];
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentSubCategories = selectedCategoryObj?.subCategories || [];

  const getCategoryIcon = (catId: string) => {
    if (catId === 'cat-restaurants') return <Utensils className="h-5 w-5" />;
    if (catId === 'cat-cafes') return <Coffee className="h-5 w-5" />;
    if (catId === 'cat-cinemas') return <Film className="h-5 w-5" />;
    if (catId === 'cat-parking') return <Car className="h-5 w-5" />;
    return <FerrisWheel className="h-5 w-5" />;
  };

  if (onboardingStep !== 'done') {
    return (
      <OnboardingFlow
        step={onboardingStep}
        setStep={setOnboardingStep}
        country={country}
        onSelectCountry={handleCountryChange}
        lang={lang}
        onSelectLang={(nextLang) => {
          setLang(nextLang);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('wherio_lang', nextLang);
          }
        }}
        countriesData={countriesData}
        onAuthenticated={(user) => {
          setCurrentUser({
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
          });
          setNameInput(user.name || '');
          setPhoneInput(user.phone || '');
          setEmailInput(user.email || '');
          setIsAuthenticated(true);
          setOnboardingStep('done');
        }}
        onContinueAsGuest={() => {
          setIsAuthenticated(false);
          setOnboardingStep('done');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      {/* Mobile-First Web App Frame */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50 shadow-2xl"
      >
        {/* TOP STICKY BAR: Wherio Logo, Country/Launch City & Language Switchers */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-3.5 pt-3 pb-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <WherioBrandLogo size="md" showSubtitle={true} isAr={isAr} />

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
            </div>
          </div>

          {/* Launch City Quick Selector Bar (Abu Dhabi & Riyadh + Active Cities + GPS Button) */}
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#072549]/5 px-2.5 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[#072549]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0072DC]" />
              <span>{isAr ? 'المدينة:' : 'City:'}</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                {
                  id: 'abudhabi',
                  country: 'AE' as CountryCode,
                  en: 'Abu Dhabi',
                  ar: 'أبوظبي',
                },
                {
                  id: 'riyadh',
                  country: 'SA' as CountryCode,
                  en: 'Riyadh',
                  ar: 'الرياض',
                },
                ...allCities
                  .filter(
                    (c) =>
                      c.isActive && c.id !== 'abudhabi' && c.id !== 'riyadh',
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
                      setSelectedAreaId('');
                      setCustomGpsCoords(null);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                      isSelected
                        ? 'bg-[#072549] text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
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
                title={isAr ? 'استخدام موقعي الحالي' : 'Use My GPS Location'}
              >
                <Navigation className="h-3 w-3" />
                <span>{isAr ? 'موقعي' : 'Near Me'}</span>
              </button>
            </div>
          </div>

          {gpsStatusText && (
            <p className="mt-1 text-[10px] font-semibold text-[#0072DC]">
              {gpsStatusText}
            </p>
          )}
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-3.5 pt-3 pb-24">
          {/* =========================================================
              TAB 1: EXPLORE (استكشف)
          ========================================================= */}
          {activeBottomTab === 'explore' && (
            <div className="space-y-4">
              {/* Wherio Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#072549] via-[#0A2E5C] to-[#0072DC] p-4 text-white shadow-md">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#FFC233]">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {isAr
                        ? 'المرحلة الأولى — أبوظبي والرياض'
                        : 'PHASE 1 LAUNCH — ABU DHABI & RIYADH'}
                    </span>
                  </div>
                  <h1 className="mt-1.5 text-base font-extrabold leading-snug">
                    {isAr
                      ? 'استكشف الأماكن بدقة • راجع التقييمات الموثقة • انطلق بثقة'
                      : 'Explore Verified Places • Read Trusted Reviews • Go Confidently'}
                  </h1>
                  <p className="mt-1 text-[11px] text-sky-100/90 leading-relaxed">
                    {isAr
                      ? 'دليل ذكي للمطاعم، المقاهي، السينما، والترفيه العائلي مع توضيح صريح للتجهيزات المتاحة أو غير المعروفة.'
                      : 'Structured directory for Restaurants, Cafes, Cinemas & Entertainment with verified facilities and grounded AI.'}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        requireAuthThen(() => setActiveBottomTab('ai'))
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B89C] px-3 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#008891]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isAr ? 'اسأل المساعد الذكي' : 'Ask AI Concierge'}
                    </button>
                    <button
                      onClick={() => setActiveBottomTab('search')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/25"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {isAr ? 'الفلاتر المركبة' : 'Compound Filters'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5 Main Categories Grid */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-extrabold text-[#072549]">
                    {isAr
                      ? 'الفئات الرئيسية للاستكشاف:'
                      : 'Explore by Main Category:'}
                  </h2>
                  {selectedCategory && (
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedSubCategory('');
                      }}
                      className="text-[11px] font-bold text-[#0072DC] underline"
                    >
                      {isAr ? 'عرض الكل' : 'Show All'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {(categories.length > 0
                    ? categories
                    : [
                        {
                          id: 'cat-restaurants',
                          nameEn: 'Restaurants',
                          nameAr: 'مطاعم',
                        },
                        { id: 'cat-cafes', nameEn: 'Cafes', nameAr: 'مقاهي' },
                        { id: 'cat-cinemas', nameEn: 'Cinemas', nameAr: 'سينما' },
                        {
                          id: 'cat-entertainment',
                          nameEn: 'Entertainment',
                          nameAr: 'ترفيه وأنشطة',
                        },
                        {
                          id: 'cat-parking',
                          nameEn: 'Parking Spots',
                          nameAr: 'مواقف السيارات',
                        },
                      ]
                  ).map((cat: any) => {
                    const active = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(active ? '' : cat.id);
                          setSelectedSubCategory('');
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition ${
                          active
                            ? 'border-[#0072DC] bg-[#072549] text-white shadow-sm'
                            : 'border-slate-200 bg-white text-[#072549] hover:border-[#0072DC]'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            active
                              ? 'bg-[#00B89C] text-white'
                              : 'bg-[#0072DC]/10 text-[#0072DC]'
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
                      onClick={() => setSelectedSubCategory('')}
                      className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                        selectedSubCategory === ''
                          ? 'bg-[#0072DC] text-white'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      {isAr ? 'كل التصنيفات الفرعية' : 'All Subcategories'}
                    </button>
                    {currentSubCategories.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() =>
                          setSelectedSubCategory(
                            selectedSubCategory === sub.id ? '' : sub.id,
                          )
                        }
                        className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                          selectedSubCategory === sub.id
                            ? 'bg-[#0072DC] text-white'
                            : 'bg-white border border-slate-200 text-slate-700'
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
                    key: 'open_now',
                    en: 'Open Now',
                    ar: 'مفتوح الآن',
                    icon: <Clock className="h-3 w-3" />,
                  },
                  {
                    key: 'kids_friendly',
                    en: 'Kids Friendly',
                    ar: 'مناسب للأطفال',
                    icon: <Users className="h-3 w-3" />,
                  },
                  {
                    key: 'parking',
                    en: 'Parking Available',
                    ar: 'مواقف سيارات',
                    icon: <Car className="h-3 w-3" />,
                  },
                  {
                    key: 'valet',
                    en: 'Valet Service',
                    ar: 'خدمة فاليه',
                    icon: <KeyRound className="h-3 w-3" />,
                  },
                  {
                    key: 'outdoor_seating',
                    en: 'Outdoor Seating',
                    ar: 'جلسات خارجية',
                    icon: <Sun className="h-3 w-3" />,
                  },
                  {
                    key: 'wheelchair_accessible',
                    en: 'Wheelchair Access',
                    ar: 'كراسي متحركة',
                    icon: <Accessibility className="h-3 w-3" />,
                  },
                  {
                    key: 'wifi',
                    en: 'Fast Wi-Fi',
                    ar: 'واي فاي',
                    icon: <Wifi className="h-3 w-3" />,
                  },
                  {
                    key: 'free_entry',
                    en: 'Free Entry',
                    ar: 'دخول مجاني',
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
                          ? 'border-[#00B89C] bg-[#00B89C] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#0072DC]'
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
                      {isAr ? 'الأكثر صلة' : 'Most Relevant'}
                    </option>
                    <option value="distance">
                      {isAr ? 'الأقرب مسافة' : 'Nearest'}
                    </option>
                    <option value="rating">
                      {isAr ? 'الأعلى تقييماً' : 'Top Rated'}
                    </option>
                    <option value="completeness">
                      {isAr ? 'اكتمال البيانات' : 'Data Completeness'}
                    </option>
                  </select>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs font-bold text-slate-500">
                    {isAr
                      ? 'جاري تحميل دليل الأماكن...'
                      : 'Loading verified places directory...'}
                  </div>
                ) : placesList.length === 0 ? (
                  /* Empty State / Handle No Results */
                  <div className="rounded-2xl border border-amber-200 bg-white p-5 text-center shadow-2xs">
                    <p className="text-xs font-extrabold text-[#072549]">
                      {noResultsSuggestions?.message ||
                        (isAr
                          ? 'لم يتم العثور على أماكن تطابق جميع الفلاتر المحددة.'
                          : 'No places matched all selected filters.')}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {isAr
                        ? 'جرب تخفيف بعض الفلاتر أو البحث في كافة أحياء المدينة:'
                        : 'Try relaxing one of your filters or exploring all areas in this city:'}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => {
                          setKeyword('');
                          setSelectedAreaId('');
                          setSelectedCategory('');
                          setSelectedSubCategory('');
                          setActiveAttributeFilters([]);
                        }}
                        className="rounded-xl bg-[#072549] px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        {isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}
                      </button>
                      <button
                        onClick={() =>
                          requireAuthThen(() => setActiveBottomTab('ai'))
                        }
                        className="rounded-xl bg-[#00B89C] px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        {isAr ? 'اطلب بدائل من المساعد الذكي' : 'Ask AI for Alternatives'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {placesList.map((place: any) => {
                      const isFav = favoritePlaceIds.includes(place.id);
                      const hasUnknownPrice =
                        place.priceRange === 'UNKNOWN' ||
                        place.entryFeeStatus === 'UNKNOWN';
                      const isUnrated =
                        place.rating?.isUnrated ||
                        (place.rating?.reviewCount ?? 0) === 0;
                      return (
                        <div
                          key={place.id}
                          onClick={() => handleOpenPlaceDetails(place.id)}
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:border-[#0072DC] hover:shadow-md"
                        >
                          <div className="relative h-40 w-full bg-slate-900">
                            <img
                              src={
                                place.images?.[0] ||
                                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
                              }
                              alt={place.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#072549]/85 via-transparent to-black/25" />

                            {/* Category Pill */}
                            <div
                              className={`absolute top-2.5 flex items-center gap-1.5 ${
                                isAr ? 'right-2.5' : 'left-2.5'
                              }`}
                            >
                              <span className="rounded-lg bg-[#072549]/90 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                                {place.categoryName}
                              </span>
                              {place.openNowStatus === 'OPEN' && (
                                <span className="rounded-lg bg-emerald-600/90 px-2 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                                  {isAr ? 'مفتوح الآن' : 'Open Now'}
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
                                isAr ? 'left-2.5' : 'right-2.5'
                              } ${
                                isFav
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-black/45 text-white hover:bg-black/70'
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`}
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
                                    {isAr ? 'غير مقيّم' : 'Unrated'}
                                  </span>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2 py-1 text-xs font-extrabold text-amber-700">
                                      <Star className="h-3.5 w-3.5 fill-[#FF991F] text-[#FF991F]" />
                                      {place.rating?.avgRating}
                                    </span>
                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                                      ({place.rating?.reviewCount}{' '}
                                      {isAr ? 'مراجعة' : 'reviews'})
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Tri-State Attribute Chips */}
                            <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
                              {place.attributes?.kidsFriendly ===
                                'AVAILABLE' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                  {isAr ? 'مناسب للأطفال' : 'Kids Friendly'}
                                </span>
                              )}
                              {place.attributes?.parking === 'AVAILABLE' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                  {isAr ? 'موقف سيارات' : 'Parking'}
                                </span>
                              )}
                              {place.attributes?.valetParking ===
                                'AVAILABLE' && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-800">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-teal-600" />
                                  {isAr ? 'فاليه (Valet)' : 'Valet'}
                                </span>
                              )}
                              {hasUnknownPrice ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                                  <HelpCircle className="h-2.5 w-2.5 text-amber-600" />
                                  {isAr
                                    ? 'السعر: غير متاح في البيانات'
                                    : 'Price: Unavailable'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-bold text-[#0072DC]">
                                  {place.priceRange} • {place.entryFeeStatus}
                                </span>
                              )}
                            </div>

                            {/* Distance & External Score Footer */}
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                              <div className="flex items-center gap-2 text-slate-600">
                                <span className="inline-flex items-center gap-1 font-bold text-[#072549]">
                                  <Car className="h-3.5 w-3.5 text-[#0072DC]" />
                                  {place.distance?.driveTimeMinutes}{' '}
                                  {isAr ? 'د بالسيارة' : 'm drive'}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Footprints className="h-3.5 w-3.5 text-[#00B89C]" />
                                  {place.distance?.distanceKm} km
                                </span>
                              </div>

                              {place.externalRating && (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {isAr ? 'تقييم خارجي:' : 'Ext:'}{' '}
                                  <strong className="text-slate-600">
                                    {place.externalRating.rating}/5
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: SEARCH & COMPOUND FILTERS (البحث والفلاتر)
          ========================================================= */}
          {activeBottomTab === 'search' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h2 className="text-sm font-extrabold text-[#072549]">
                  {isAr
                    ? 'البحث المتقدم والفلاتر المركبة'
                    : 'Advanced Search & Compound Filters'}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isAr
                    ? 'ابحث بالاسم، المنطقة، التصنيف الفرعي، والتجهيزات المتعددة في آن واحد'
                    : 'Filter by keyword, district/area, sub-category, and confirmed practical facilities'}
                </p>

                {/* Keyword Input */}
                <div className="relative mt-3">
                  <Search
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                      isAr ? 'right-3' : 'left-3'
                    }`}
                  />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={
                      isAr
                        ? 'ابحث باسم المكان أو الحي (مثال: وارنر براذرز، إكسير بن)...'
                        : 'Search venue name or district (e.g., Warner Bros, Elixir)...'
                    }
                    className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
                      isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>

                {/* Area / District Filter */}
                {currentCityAreas.length > 0 && (
                  <div className="mt-3">
                    <label className="text-[11px] font-extrabold text-[#072549]">
                      {isAr
                        ? 'المنطقة / الحي داخل المدينة:'
                        : 'Area / District inside City:'}
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedAreaId('')}
                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                          selectedAreaId === ''
                            ? 'bg-[#072549] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAr ? 'كل المناطق' : 'All Areas'}
                      </button>
                      {currentCityAreas.map((area: any) => (
                        <button
                          key={area.id}
                          onClick={() => setSelectedAreaId(area.id)}
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                            selectedAreaId === area.id
                              ? 'bg-[#0072DC] text-white'
                              : 'bg-slate-100 text-slate-600'
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
                      ? 'التجهيزات العملية المؤكدة وحالة العمل:'
                      : 'Confirmed Facilities & Availability:'}
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {[
                      {
                        key: 'open_now',
                        en: 'Open Now',
                        ar: 'مفتوح الآن',
                      },
                      {
                        key: 'kids_friendly',
                        en: 'Kids Friendly',
                        ar: 'مناسب للأطفال',
                      },
                      {
                        key: 'parking',
                        en: 'Parking Available',
                        ar: 'مواقف سيارات',
                      },
                      {
                        key: 'valet',
                        en: 'Valet Service',
                        ar: 'خدمة صف السيارات (فاليه)',
                      },
                      {
                        key: 'outdoor_seating',
                        en: 'Outdoor Seating',
                        ar: 'جلسات خارجية',
                      },
                      {
                        key: 'wheelchair_accessible',
                        en: 'Wheelchair Access',
                        ar: 'كراسي متحركة',
                      },
                      { key: 'wifi', en: 'Wi-Fi Available', ar: 'واي فاي متاح' },
                      {
                        key: 'free_entry',
                        en: 'Free Entry',
                        ar: 'دخول مجاني',
                      },
                      {
                        key: 'no_reservation',
                        en: 'No Reservation Needed',
                        ar: 'بدون حجز مسبق',
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
                              ? 'border-[#00B89C] bg-[#00B89C]/10 text-[#072549]'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
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
                        setKeyword('');
                        setSelectedAreaId('');
                        setSelectedCategory('');
                        setSelectedSubCategory('');
                        setActiveAttributeFilters([]);
                      }}
                      className="text-[11px] font-bold text-rose-600 underline"
                    >
                      {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                    </button>
                  )}
                </div>

                {placesList.map((place: any) => (
                  <div
                    key={place.id}
                    onClick={() => handleOpenPlaceDetails(place.id)}
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
          )}

          {/* =========================================================
              TAB 3: AI CONCIERGE (المساعد الذكي)
          ========================================================= */}
          {activeBottomTab === 'ai' && (
            <AiConciergeTab
              country={country}
              lang={lang}
              cityId={selectedCityId}
              userCoords={{
                lat: effectiveLat,
                lng: effectiveLng,
                label: isAr
                  ? currentCityMeta.nameAr
                  : currentCityMeta.nameEn,
              }}
              onSelectPlace={(id) => handleOpenPlaceDetails(id)}
            />
          )}

          {/* =========================================================
              TAB 4: FAVORITES (المفضلة)
          ========================================================= */}
          {activeBottomTab === 'favorites' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#072549] p-4 text-white">
                <h2 className="text-sm font-extrabold">
                  {isAr
                    ? 'قائمة الأماكن المفضلة المحفوظة'
                    : 'Your Saved Favorite Places'}
                </h2>
                <p className="mt-0.5 text-[11px] text-sky-100">
                  {isAr
                    ? 'الأماكن التي قمت بحفظها للرجوع إليها سريعاً في أبوظبي والرياض'
                    : 'Quick access to places you bookmarked across Abu Dhabi & Riyadh'}
                </p>
              </div>

              {placesList
                .filter((p) => favoritePlaceIds.includes(p.id))
                .map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleOpenPlaceDetails(place.id)}
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

              {placesList.filter((p) => favoritePlaceIds.includes(p.id))
                .length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                  {isAr
                    ? 'لا توجد أماكن مفضلة في هذه المدينة حالياً. اضغط على أيقونة القلب لحفظ أي مكان.'
                    : 'No saved favorites in this city yet. Tap the heart icon on any venue to bookmark it.'}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 5: ACCOUNT & DUAL VERIFICATION (حسابي)
          ========================================================= */}
          {activeBottomTab === 'account' && (
            <div className="space-y-4">
              {/* Current User Verification Status Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-lg bg-[#072549] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                      {isAuthenticated
                        ? isAr
                          ? 'حساب مسجل في ويريو'
                          : 'Authenticated Wherio Member'
                        : isAr
                          ? 'وضع الزائر العام (Public Preview)'
                          : 'Public Directory Preview Mode'}
                    </span>
                    <h2 className="mt-1.5 text-base font-extrabold text-[#072549]">
                      {isAuthenticated
                        ? currentUser.name
                        : isAr
                          ? 'زائر غير مسجل'
                          : 'Guest Visitor'}
                    </h2>
                    {isAuthenticated && (
                      <p className="text-xs text-slate-500">
                        {currentUser.phone} • {currentUser.email}
                      </p>
                    )}
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={handleLogoutSession}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{isAr ? 'خروج' : 'Logout'}</span>
                    </button>
                  )}
                </div>

                {/* Dual Verification Badges (Phone OTP + Unique Email) */}
                {isAuthenticated && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`rounded-xl border p-2.5 ${
                        currentUser.isPhoneVerified
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <Phone className="h-3.5 w-3.5" />
                        <span>
                          {isAr ? 'توثيق الهاتف (OTP)' : 'Phone OTP'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px]">
                        {currentUser.isPhoneVerified
                          ? isAr
                            ? 'موثق وفريد ✓'
                            : 'Verified & Unique ✓'
                          : isAr
                            ? 'غير موثق'
                            : 'Not Verified'}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border p-2.5 ${
                        currentUser.isEmailVerified
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <Mail className="h-3.5 w-3.5" />
                        <span>
                          {isAr ? 'البريد الإلكتروني' : 'Unique Email'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px]">
                        {currentUser.isEmailVerified
                          ? isAr
                            ? 'موثق وفريد ✓'
                            : 'Verified & Unique ✓'
                          : isAr
                            ? 'بانتظار التوثيق'
                            : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Clean Real Account Actions (No Test Demo Persona Switcher) */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-500">
                    {isAuthenticated
                      ? isAr
                        ? 'جلستك محمية وموثقة عبر رمز الجلسة النشط.'
                        : 'Your session is active and protected.'
                      : isAr
                        ? 'سجل دخولك أدناه لتفعيل المفضلة والمساعد الذكي والتقييمات.'
                        : 'Sign in below to unlock Favorites, AI Concierge & Reviews.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep('country')}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-[#072549] hover:border-[#0072DC]"
                  >
                    <Compass className="h-3.5 w-3.5 text-[#0072DC]" />
                    <span>
                      {isAr
                        ? 'شاشة البداية واختيار الدولة'
                        : 'Welcome & Country Setup'}
                    </span>
                  </button>
                </div>
              </div>

              {/* OTP + Unique Email Verification & Profile Management Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h3 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'إدارة الحساب وتوثيق الهاتف (OTP) والبريد الإلكتروني الفريد:'
                    : 'Account Profile, Phone OTP & Unique Email Verification:'}
                </h3>
                <div className="mt-2.5 space-y-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+971504445566"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="unique.email@wherio.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="OTP (1234)"
                      className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                    />
                    <button
                      onClick={handleVerifyOtpAndEmail}
                      className="flex-1 rounded-xl bg-[#072549] py-2 text-xs font-extrabold text-white hover:bg-[#0072DC]"
                    >
                      {isAr
                        ? 'تأكيد OTP + البريد الإلكتروني'
                        : 'Verify OTP & Unique Email'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveProfileAndPreferences}
                      className="rounded-xl border border-[#0072DC] bg-[#0072DC]/10 py-2 text-[11px] font-extrabold text-[#0072DC]"
                    >
                      {isAr ? 'حفظ الملف والتفضيلات' : 'Save Profile & Prefs'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>
                        {isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}
                      </span>
                    </button>
                  </div>

                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleRecoverAccount}
                      className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-[11px] font-bold text-amber-900"
                    >
                      {isAr
                        ? 'استعادة الحساب عبر الهاتف أو البريد المؤكد'
                        : 'Recover Existing Account via Verified Contact'}
                    </button>
                  )}

                  {!currentUser.isEmailVerified && isAuthenticated && (
                    <button
                      onClick={handleVerifyEmailOnly}
                      className="w-full rounded-xl bg-[#00B89C] py-2 text-xs font-extrabold text-white"
                    >
                      {isAr
                        ? 'توثيق البريد الإلكتروني لحسابك الحالي الآن'
                        : 'Verify Email for Current Account Now'}
                    </button>
                  )}
                  {authStatusMsg && (
                    <p className="rounded-xl bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800">
                      {authStatusMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Region, Language & Reusable Discovery Preferences */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#072549]">
                  {isAr
                    ? 'إعدادات الدولة واللغة وتفضيلات الاستكشاف المحفوظة:'
                    : 'Preferred Country, Language & Saved Discovery Preferences:'}
                </h3>
                <RegionSelectDropdown
                  value={country}
                  onChange={handleCountryChange}
                  lang={lang}
                  variant="full"
                />
                <LanguageSelectDropdown
                  value={lang}
                  onChange={setLang}
                  variant="full"
                />

                {/* Manage Discovery Preferences (Reusable Activity Types, Facilities & Budget) */}
                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <p className="text-[11px] font-extrabold text-[#072549]">
                    {isAr
                      ? 'تفضيلات الأنشطة والفئات المفضلة:'
                      : 'Preferred Activity Categories:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'cat-restaurants', en: 'Restaurants', ar: 'مطاعم' },
                      { id: 'cat-cafes', en: 'Cafes', ar: 'مقاهي' },
                      { id: 'cat-cinemas', en: 'Cinemas', ar: 'سينما' },
                      {
                        id: 'cat-entertainment',
                        en: 'Entertainment',
                        ar: 'ترفيه وأنشطة',
                      },
                      {
                        id: 'cat-parking',
                        en: 'Parking Spots',
                        ar: 'مواقف السيارات',
                      },
                    ].map((cat) => {
                      const active = preferredCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setPreferredCategories((prev) =>
                              prev.includes(cat.id)
                                ? prev.filter((x) => x !== cat.id)
                                : [...prev, cat.id],
                            )
                          }
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                            active
                              ? 'bg-[#072549] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAr ? cat.ar : cat.en}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-extrabold text-[#072549]">
                    {isAr
                      ? 'التجهيزات المفضلة عند البحث:'
                      : 'Preferred Practical Facilities:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        id: 'kids_friendly',
                        en: 'Kids Friendly',
                        ar: 'مناسب للأطفال',
                      },
                      { id: 'parking', en: 'Parking', ar: 'مواقف سيارات' },
                      {
                        id: 'valet',
                        en: 'Valet Service',
                        ar: 'خدمة فاليه',
                      },
                      { id: 'wifi', en: 'Fast Wi-Fi', ar: 'واي فاي' },
                      {
                        id: 'outdoor_seating',
                        en: 'Outdoor Seating',
                        ar: 'جلسات خارجية',
                      },
                    ].map((attr) => {
                      const active = preferredAttributes.includes(attr.id);
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() =>
                            setPreferredAttributes((prev) =>
                              prev.includes(attr.id)
                                ? prev.filter((x) => x !== attr.id)
                                : [...prev, attr.id],
                            )
                          }
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                            active
                              ? 'bg-[#00B89C] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAr ? attr.ar : attr.en}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await handleSaveProfileAndPreferences();
                      if (preferredCategories[0]) {
                        setSelectedCategory(preferredCategories[0]);
                      }
                      setActiveAttributeFilters(preferredAttributes);
                      setActiveBottomTab('explore');
                    }}
                    className="w-full rounded-xl bg-[#0072DC] py-2 text-xs font-extrabold text-white hover:bg-[#072549]"
                  >
                    {isAr
                      ? 'حفظ وتطبيق تفضيلات الاستكشاف الآن'
                      : 'Save & Apply My Discovery Preferences'}
                  </button>
                </div>
              </div>

              {/* Direct Link to Wherio Admin Governance Portal */}
              <a
                href="http://localhost:3006"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#072549] to-[#0072DC] p-4 text-white shadow-md"
              >
                <div>
                  <p className="text-xs font-extrabold">
                    {isAr
                      ? 'بوابة الإدارة والحوكمة (Wherio Admin Portal)'
                      : 'Wherio Admin & Governance Portal (Port 3006)'}
                  </p>
                  <p className="text-[10px] text-sky-100">
                    {isAr
                      ? 'إدارة الـ 100 مكان، جودة البيانات، الإشراف على التقييمات، وتفعيل المدن'
                      : 'Manage 100 launch places, completeness score, review moderation & cities'}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            </div>
          )}
        </main>

        {/* REGISTRATION / LOGIN GATE MODAL */}
        {showAuthGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div
              dir={isAr ? 'rtl' : 'ltr'}
              className="w-full max-w-[390px] rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#072549] text-white">
                  <Lock className="h-5 w-5 text-[#FFC233]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#072549]">
                    {isAr
                      ? 'تسجيل الدخول مطلوب للمتابعة'
                      : 'Sign In Required to Continue'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? 'يتطلب عرض التفاصيل الكاملة أو استخدام المساعد الذكي أو المفضلة حساباً مسجلاً في ويريو.'
                      : 'Viewing full Place Details, using the AI Concierge, or saving Favorites requires a registered Wherio account.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setShowAuthGateModal(false);
                    setOnboardingStep('auth');
                  }}
                  className="w-full rounded-xl bg-[#072549] py-2.5 text-xs font-extrabold text-white hover:bg-[#0072DC]"
                >
                  {isAr
                    ? 'تسجيل الدخول أو إنشاء حساب (هاتف OTP + بريد إلكتروني)'
                    : 'Sign In or Create Account (Phone OTP & Email)'}
                </button>
                <button
                  onClick={() => {
                    setShowAuthGateModal(false);
                    setActiveBottomTab('account');
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-[#072549]"
                >
                  {isAr
                    ? 'الانتقال إلى صفحة حسابي'
                    : 'Go to Account Settings'}
                </button>
                <button
                  onClick={() => setShowAuthGateModal(false)}
                  className="w-full py-1.5 text-[11px] font-semibold text-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PLACE DETAILS DRAWER */}
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
            isFavorite={favoritePlaceIds.includes(selectedPlaceId)}
            onToggleFavorite={handleToggleFavorite}
            onRequireVerifyEmail={() => {
              setSelectedPlaceId(null);
              setActiveBottomTab('account');
            }}
            onClose={() => setSelectedPlaceId(null)}
          />
        )}

        {/* BOTTOM NAVIGATION BAR (5 Pure Wherio Tabs — Zero E-Commerce/Cart) */}
        <nav className="fixed bottom-0 z-30 flex w-full max-w-[430px] items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur-md">
          {[
            {
              id: 'explore',
              labelEn: 'Explore',
              labelAr: 'استكشف',
              icon: <Home className="h-5 w-5" />,
            },
            {
              id: 'search',
              labelEn: 'Filters',
              labelAr: 'الفلاتر',
              icon: <SlidersHorizontal className="h-5 w-5" />,
            },
            {
              id: 'ai',
              labelEn: 'AI Concierge',
              labelAr: 'المساعد الذكي',
              icon: <Sparkles className="h-5 w-5" />,
            },
            {
              id: 'favorites',
              labelEn: 'Favorites',
              labelAr: 'المفضلة',
              icon: <Heart className="h-5 w-5" />,
            },
            {
              id: 'account',
              labelEn: 'Account',
              labelAr: 'حسابي',
              icon: <User className="h-5 w-5" />,
            },
          ].map((tab) => {
            const active = activeBottomTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'ai' || tab.id === 'favorites') {
                    requireAuthThen(() => setActiveBottomTab(tab.id as any));
                  } else {
                    setActiveBottomTab(tab.id as any);
                  }
                }}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-extrabold transition ${
                  active
                    ? 'text-[#0072DC]'
                    : 'text-slate-400 hover:text-[#072549]'
                }`}
              >
                <div
                  className={`rounded-xl p-1 transition ${
                    active ? 'bg-[#0072DC]/10 text-[#0072DC]' : ''
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
  );
}
