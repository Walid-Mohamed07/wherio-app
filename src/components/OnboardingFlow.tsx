"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Car,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  Globe,
  Compass,
  Mic,
  ArrowRight,
} from "lucide-react";
import {
  WherioApi,
  CountryCode,
  LangCode,
  setStoredSessionToken,
} from "@/lib/api";
import { WherioBrandLogo } from "./BrandLogoAndSelects";

export type OnboardingStep =
  | "splash"
  | "country"
  | "walkthrough"
  | "auth"
  | "done";

interface OnboardingFlowProps {
  step: Exclude<OnboardingStep, "done">;
  setStep: (next: OnboardingStep) => void;
  country: CountryCode;
  onSelectCountry: (c: CountryCode) => void;
  lang: LangCode;
  onSelectLang: (l: LangCode) => void;
  countriesData: any[];
  onAuthenticated: (user: any, token?: string) => void;
  onContinueAsGuest: () => void;
}

export default function OnboardingFlow({
  step,
  setStep,
  country,
  onSelectCountry,
  lang,
  onSelectLang,
  countriesData,
  onAuthenticated,
  onContinueAsGuest,
}: OnboardingFlowProps) {
  const isAr = lang === "ar";
  const [slideIndex, setSlideIndex] = useState(0);

  // Auth step states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState(
    country === "SA" ? "+966" : country === "EG" ? "+20" : "+971",
  );
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const configuredCountries: Array<{
    code: CountryCode;
    flag: string;
    nameEn: string;
    nameAr: string;
    citiesEn: string;
    citiesAr: string;
    dialPrefix: string;
  }> = [
    {
      code: "AE",
      flag: "🇦🇪",
      nameEn: "United Arab Emirates",
      nameAr: "الإمارات العربية المتحدة",
      citiesEn: "Abu Dhabi • Dubai",
      citiesAr: "أبوظبي • دبي",
      dialPrefix: "+971",
    },
    {
      code: "SA",
      flag: "🇸🇦",
      nameEn: "Saudi Arabia",
      nameAr: "المملكة العربية السعودية",
      citiesEn: "Riyadh • Jeddah",
      citiesAr: "الرياض • جدة",
      dialPrefix: "+966",
    },
    {
      code: "EG",
      flag: "🇪🇬",
      nameEn: "Egypt",
      nameAr: "جمهورية مصر العربية",
      citiesEn: "Cairo • New Cairo",
      citiesAr: "القاهرة • التجمع الخامس",
      dialPrefix: "+20",
    },
  ];

  const slides = [
    {
      badgeEn: "DISCOVER & PARK CONFIDENTLY",
      badgeAr: "استكشف واركن سيارتك بثقة",
      titleEn: "Verified Places, Parking Spots & Valet",
      titleAr: "أماكن موثقة، مواقف سيارات وخدمة فاليه",
      descEn:
        "Explore curated Restaurants, Specialty Cafes, Cinemas, Family Entertainment, and dedicated Parking Spots with confirmed Valet & facility badges.",
      descAr:
        "تصفح أفضل المطاعم، المقاهي المختصة، السينما، وجهات الترفيه، ومواقف السيارات مع توضيح دقيق لتوفر الفاليه والتجهيزات العائلية.",
      icon: <Compass className="h-10 w-10 text-[#00D2B4]" />,
      accentIcon: <Car className="h-5 w-5 text-[#FFC233]" />,
      highlightsEn: [
        "5 Main Categories including Parking Spots",
        "Confirmed Valet, Parking & Kids-Friendly filters",
        "Multi-shift working hours & Open Now status",
      ],
      highlightsAr: [
        "٥ فئات رئيسية تشمل مواقف السيارات والترفيه",
        "فلاتر مؤكدة لخدمة الفاليه ومواقف السيارات والأطفال",
        "مواعيد عمل متعددة الفترتين وحالة مفتوح الآن",
      ],
    },
    {
      badgeEn: "AUTHENTIC COMMUNITY TRUST",
      badgeAr: "تقييمات حقيقية وموثقة",
      titleEn: "Dual-Verified Reviews & Zero Guesswork",
      titleAr: "مراجعات موثقة وشفافية كاملة في البيانات",
      descEn:
        "Every Wherio review comes from a member verified by both Phone OTP and Unique Email. When a price or facility is unknown, we tell you honestly.",
      descAr:
        "جميع تقييمات ويريو صادرة من أعضاء موثقين عبر الهاتف والبريد الإلكتروني، مع التزام تام بعدم تخمين أي أسعار أو مرافق غير معروفة.",
      icon: <ShieldCheck className="h-10 w-10 text-[#00D2B4]" />,
      accentIcon: <CheckCircle2 className="h-5 w-5 text-[#FFC233]" />,
      highlightsEn: [
        "4-Aspect Ratings: Quality, Service, Atmosphere & Value",
        "Tri-State Facilities: Available, Not Available, or Unknown",
        "Separate Wherio Rating vs. External Public Rating",
      ],
      highlightsAr: [
        "تقييم رباعي: الجودة، الخدمة، الأجواء، والقيمة",
        "حالات التجهيزات: متاح، غير متاح، أو غير معروف",
        "فصل واضح بين تقييم ويريو والتقييمات الخارجية",
      ],
    },
    {
      badgeEn: "VOICE & TEXT AI CONCIERGE",
      badgeAr: "المساعد الذكي بالصوت والنص",
      titleEn: "Your Bilingual Smart Outings Assistant",
      titleAr: "مساعدك الذكي للطلعات بالصوت أو الكتابة",
      descEn:
        "Speak or type in Arabic or English—ask for a family restaurant with valet parking or a quiet cafe for remote work, and get grounded answers.",
      descAr:
        "تحدث بصوتك أو اكتب بالعربية أو الإنجليزية—اطلب مطعماً عائلياً مع خدمة فاليه أو مقهى هادئ للعمل، واحصل على ترشيحات مفسرة وموثقة.",
      icon: <Sparkles className="h-10 w-10 text-[#FFC233]" />,
      accentIcon: <Mic className="h-5 w-5 text-[#00D2B4]" />,
      highlightsEn: [
        "Natural Arabic & English voice recognition",
        "Explained recommendations with drive time & distance",
        "Strict zero-hallucination grounding in Wherio data",
      ],
      highlightsAr: [
        "التعرف الصوتي الذكي باللهجات العربية والإنجليزية",
        "توصيات مفسرة مع المسافة ووقت القيادة بالسيارة",
        "الاعتماد الحصري على بيانات ويريو الموثقة فقط",
      ],
    },
  ];

  const handleSendOtpCode = async () => {
    setErrorMsg(null);
    if (!phoneInput || phoneInput.trim().length < 7) {
      setErrorMsg(
        isAr
          ? "يرجى إدخال رقم هاتف صحيح."
          : "Please enter a valid mobile phone number.",
      );
      return;
    }
    setBusy(true);
    try {
      const res = await WherioApi.sendOtp(
        phoneInput.trim(),
        country,
        emailInput.trim() || undefined,
      );
      setOtpSent(true);
      if (res?.devOtpHint) {
        setDevOtpHint(String(res.devOtpHint));
        setOtpInput(String(res.devOtpHint));
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteSignIn = async () => {
    setErrorMsg(null);
    if (!phoneInput || phoneInput.trim().length < 7) {
      setErrorMsg(
        isAr ? "يرجى إدخال رقم الهاتف." : "Please enter your phone number.",
      );
      return;
    }
    if (!otpInput || otpInput.trim().length < 4) {
      setErrorMsg(
        isAr
          ? "يرجى إدخال رمز التحقق المكون من 4 أرقام."
          : "Please enter the 4-digit OTP code.",
      );
      return;
    }
    setBusy(true);
    try {
      const displayName =
        nameInput.trim() ||
        (emailInput.includes("@") ? emailInput.split("@")[0] : "Wherio Member");
      const res = await WherioApi.verifyOtp(
        phoneInput.trim(),
        otpInput.trim(),
        displayName,
        country,
        emailInput.trim() || undefined,
      );
      if (res?.accessToken) {
        setStoredSessionToken(res.accessToken);
      }
      if (res?.user) {
        onAuthenticated(res.user, res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="relative flex min-h-screen w-full max-w-[430px] flex-col justify-between overflow-hidden bg-gradient-to-b from-[#072549] via-[#0A2E5C] to-[#051B36] text-white shadow-2xl"
      >
        {/* ===============================================================
            STEP 1: SPLASH SCREEN (Session & Token Check)
        =============================================================== */}
        {step === "splash" && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 shadow-2xl ring-2 ring-[#00D2B4]/40 backdrop-blur-md">
              <div className="scale-125">
                <WherioBrandLogo size="lg" showSubtitle={false} isAr={isAr} />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">
              WHERIO <span className="text-[#00D2B4]">•</span> ويريو
            </h1>
            <p className="mt-1.5 text-xs font-extrabold tracking-widest text-[#FFC233] uppercase">
              EXPLORE • REVIEW • GO
            </p>
            <p className="mt-3 max-w-[270px] text-xs text-sky-100/85 leading-relaxed">
              {isAr
                ? "دليلك الموثق للمطاعم، المقاهي، السينما، الترفيه، ومواقف السيارات"
                : "Your verified companion for dining, cafes, cinemas, entertainment & parking spots"}
            </p>

            {/* Animated Loading Bar */}
            <div className="mt-8 w-48 overflow-hidden rounded-full bg-white/15 p-0.5">
              <div className="h-1.5 w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#00D2B4] to-[#FFC233]" />
            </div>
            <p className="mt-2.5 text-[11px] font-semibold text-sky-200/80">
              {isAr
                ? "جاري التحقق من الجلسة النشطة..."
                : "Checking active session..."}
            </p>
          </div>
        )}

        {/* ===============================================================
            STEP 2: SELECT COUNTRY & LANGUAGE (Page 2 in Waffarha App.pdf)
        =============================================================== */}
        {step === "country" && (
          <div className="flex flex-1 flex-col justify-between p-6">
            {/* Top Bar: Brand + Language Toggle */}
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm">
                <WherioBrandLogo size="sm" showSubtitle={false} isAr={isAr} />
              </div>

              <div className="inline-flex items-center rounded-xl bg-white/10 p-1 backdrop-blur">
                <button
                  type="button"
                  onClick={() => onSelectLang("en")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                    lang === "en"
                      ? "bg-[#00D2B4] text-[#072549]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLang("ar")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                    lang === "ar"
                      ? "bg-[#00D2B4] text-[#072549]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Center Country Picker */}
            <div className="my-auto py-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#00D2B4]/20 px-3 py-1 text-[11px] font-extrabold text-[#00D2B4]">
                <Globe className="h-3.5 w-3.5" />
                <span>
                  {isAr ? "اختر دولتك للمتابعة" : "SELECT YOUR COUNTRY"}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white">
                {isAr
                  ? "أين تود استكشاف الأماكن اليوم؟"
                  : "Where are you exploring today?"}
              </h2>
              <p className="mt-1 text-xs text-sky-100/80">
                {isAr
                  ? "سنقوم بتخصيص المدن، الأحياء، الفئات، ومواقف السيارات حسب دولتك المختارة."
                  : "We will tailor launch cities, districts, categories, and parking spots to your region."}
              </p>

              <div className="mt-5 space-y-3">
                {configuredCountries.map((c) => {
                  const selected = country === c.code;
                  const apiCountry = countriesData.find(
                    (item) => item.code === c.code,
                  );
                  const dynamicCities =
                    apiCountry?.cities?.length > 0
                      ? apiCountry.cities
                          .map((ct: any) => (isAr ? ct.nameAr : ct.nameEn))
                          .join(" • ")
                      : isAr
                        ? c.citiesAr
                        : c.citiesEn;

                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onSelectCountry(c.code);
                        setPhoneInput(c.dialPrefix);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#00D2B4] bg-white text-[#072549] shadow-lg"
                          : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-inner">
                          {c.flag}
                        </span>
                        <div className={isAr ? "text-right" : "text-left"}>
                          <p
                            className={`text-sm font-extrabold ${
                              selected ? "text-[#072549]" : "text-white"
                            }`}
                          >
                            {isAr ? c.nameAr : c.nameEn}
                          </p>
                          <p
                            className={`mt-0.5 text-[11px] font-medium ${
                              selected ? "text-slate-500" : "text-sky-200/80"
                            }`}
                          >
                            {dynamicCities}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-[#00B89C] bg-[#00B89C] text-white"
                            : "border-white/40"
                        }`}
                      >
                        {selected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action */}
            <div>
              <button
                type="button"
                onClick={() => setStep("walkthrough")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00B89C] py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#00a389]"
              >
                <span>{isAr ? "متابعة" : "Continue"}</span>
                <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {/* ===============================================================
            STEP 3: "GET STARTED" SLIDING WALKTHROUGH (Page 3 in Waffarha App.pdf)
        =============================================================== */}
        {step === "walkthrough" && (
          <div className="flex flex-1 flex-col justify-between p-6">
            {/* Top Bar: Back to Country + Skip */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  slideIndex > 0
                    ? setSlideIndex(slideIndex - 1)
                    : setStep("country")
                }
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <ChevronLeft
                  className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                />
                <span>{isAr ? "رجوع" : "Back"}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep("auth")}
                className="rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#FFC233] hover:underline"
              >
                {isAr ? "تخطي" : "Skip"}
              </button>
            </div>

            {/* Active Slide Card */}
            <div className="my-auto py-4">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#072549] shadow-md ring-1 ring-white/15">
                    {slides[slideIndex].icon}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    {slides[slideIndex].accentIcon}
                  </div>
                </div>

                <span className="mt-5 inline-block rounded-full bg-[#00D2B4]/20 px-3 py-0.5 text-[10px] font-extrabold tracking-wide text-[#00D2B4]">
                  {isAr
                    ? slides[slideIndex].badgeAr
                    : slides[slideIndex].badgeEn}
                </span>

                <h2 className="mt-2.5 text-xl font-black leading-snug text-white">
                  {isAr
                    ? slides[slideIndex].titleAr
                    : slides[slideIndex].titleEn}
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-sky-100/90">
                  {isAr ? slides[slideIndex].descAr : slides[slideIndex].descEn}
                </p>

                <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                  {(isAr
                    ? slides[slideIndex].highlightsAr
                    : slides[slideIndex].highlightsEn
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-bold text-sky-100"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00D2B4]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sliding Progress Indicators */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      slideIndex === idx
                        ? "w-8 bg-[#00D2B4]"
                        : "w-2 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Next / Get Started Button */}
            <div>
              {slideIndex < slides.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setSlideIndex(slideIndex + 1)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0072DC] py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#0062bd]"
                >
                  <span>{isAr ? "التالي" : "Next"}</span>
                  <ChevronRight
                    className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep("auth")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00B89C] py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#00a389]"
                >
                  <span>
                    {isAr ? "ابدأ الآن (Get Started)" : "Get Started"}
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===============================================================
            STEP 4: LOGIN OR CONTINUE AS GUEST (Page 4 in Waffarha App.pdf)
        =============================================================== */}
        {step === "auth" && (
          <div className="flex flex-1 flex-col justify-between p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("walkthrough")}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <ChevronLeft
                  className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                />
                <span>{isAr ? "رجوع" : "Back"}</span>
              </button>

              <div className="rounded-xl bg-white/95 px-2.5 py-1 shadow-sm">
                <WherioBrandLogo size="sm" showSubtitle={false} isAr={isAr} />
              </div>
            </div>

            {/* Auth Card */}
            <div className="my-auto py-4">
              <div className="rounded-3xl bg-white p-5 text-[#072549] shadow-2xl">
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 rounded-lg py-2 transition ${
                      authMode === "login"
                        ? "bg-[#072549] text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 rounded-lg py-2 transition ${
                      authMode === "register"
                        ? "bg-[#072549] text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    {isAr ? "إنشاء حساب جديد" : "Create Account"}
                  </button>
                </div>

                <h2 className="mt-4 text-base font-extrabold text-[#072549]">
                  {authMode === "login"
                    ? isAr
                      ? "مرحباً بعودتك إلى ويريو"
                      : "Welcome back to Wherio"
                    : isAr
                      ? "انضم إلى مجتمع ويريو الموثق"
                      : "Join the Verified Wherio Community"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isAr
                    ? "سجل دخولك برقم الهاتف ورمز التحقق (OTP) لحفظ المفضلة واستخدام المساعد الذكي وإضافة التقييمات."
                    : "Sign in with your mobile number & OTP to unlock Place Details, AI Concierge, Favorites & Verified Reviews."}
                </p>

                <div className="mt-4 space-y-2.5">
                  {authMode === "register" && (
                    <div className="relative">
                      <User
                        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                          isAr ? "right-3" : "left-3"
                        }`}
                      />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={isAr ? "الاسم الكامل" : "Full Name"}
                        className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
                          isAr ? "pr-9 pl-3" : "pl-9 pr-3"
                        }`}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Phone
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                        isAr ? "right-3" : "left-3"
                      }`}
                    />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+971504445566"
                      className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
                        isAr ? "pr-9 pl-3" : "pl-9 pr-3"
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Mail
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                        isAr ? "right-3" : "left-3"
                      }`}
                    />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={
                        isAr
                          ? "البريد الإلكتروني (لتوثيق التقييمات)"
                          : "Email Address (for verified reviews)"
                      }
                      className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
                        isAr ? "pr-9 pl-3" : "pl-9 pr-3"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound
                        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                          isAr ? "right-3" : "left-3"
                        }`}
                      />
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder={isAr ? "رمز التحقق OTP" : "OTP Code"}
                        className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-extrabold text-[#072549] focus:border-[#0072DC] focus:bg-white focus:outline-none ${
                          isAr ? "pr-9 pl-3" : "pl-9 pr-3"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleSendOtpCode}
                      className="shrink-0 rounded-xl border border-[#0072DC] bg-[#0072DC]/10 px-3 py-2.5 text-xs font-extrabold text-[#0072DC] hover:bg-[#0072DC] hover:text-white disabled:opacity-50"
                    >
                      {otpSent
                        ? isAr
                          ? "إعادة الإرسال"
                          : "Resend OTP"
                        : isAr
                          ? "إرسال رمز OTP"
                          : "Send OTP"}
                    </button>
                  </div>

                  {devOtpHint && (
                    <p className="rounded-xl bg-sky-50 px-3 py-1.5 text-[11px] font-bold text-[#0072DC]">
                      {isAr
                        ? `رمز التحقق المرسل: ${devOtpHint}`
                        : `Verification code sent: ${devOtpHint}`}
                    </p>
                  )}

                  {errorMsg && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleCompleteSignIn}
                    className="w-full rounded-xl bg-[#072549] py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-[#0072DC] disabled:opacity-50"
                  >
                    {busy
                      ? isAr
                        ? "جاري التحقق..."
                        : "Verifying..."
                      : authMode === "login"
                        ? isAr
                          ? "تأكيد الرمز وتسجيل الدخول"
                          : "Verify OTP & Sign In"
                        : isAr
                          ? "إنشاء الحساب وتوثيق البيانات"
                          : "Create Verified Account"}
                  </button>
                </div>
              </div>
            </div>

            {/* Continue as Guest Button */}
            <div className="space-y-2 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full rounded-2xl border border-white/25 bg-white/10 py-3.5 text-xs font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                {isAr
                  ? "المتابعة كزائر (Continue as Guest)"
                  : "Continue as Guest"}
              </button>
              <p className="text-[10px] text-sky-200/75">
                {isAr
                  ? "يمكنك تصفح دليل الأماكن ومواقف السيارات كزائر، وتسجيل الدخول في أي وقت لاحق."
                  : "Browse the directory and parking spots freely as a guest, and sign in anytime."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
