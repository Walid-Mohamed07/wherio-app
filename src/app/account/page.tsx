"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  LogOut,
  Compass,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { WherioApi } from "@/lib/api";
import { useWherioApp } from "@/context/WherioAppContext";
import {
  RegionSelectDropdown,
  LanguageSelectDropdown,
} from "@/components/BrandLogoAndSelects";

export default function AccountPage() {
  const router = useRouter();
  const {
    country,
    handleCountryChange,
    selectedCityId,
    lang,
    setLang,
    isAr,
    isAuthenticated,
    currentUser,
    setAuthenticatedUser,
    handleLogoutSession,
    preferredCategories,
    setPreferredCategories,
    preferredAttributes,
    setPreferredAttributes,
    preferredPriceRange,
    setSelectedCategory,
    setActiveAttributeFilters,
    openOnboardingModal,
  } = useWherioApp();

  const [phoneInput, setPhoneInput] = useState(
    currentUser.phone || "+971504445566",
  );
  const [emailInput, setEmailInput] = useState(currentUser.email || "");
  const [nameInput, setNameInput] = useState(currentUser.name || "");
  const [otpInput, setOtpInput] = useState("");
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.id) {
      setNameInput(currentUser.name || "");
      setPhoneInput(currentUser.phone || "");
      setEmailInput(currentUser.email || "");
    }
  }, [currentUser.id, currentUser.name, currentUser.phone, currentUser.email]);

  const handleVerifyOtpAndEmail = async () => {
    try {
      const res = await WherioApi.verifyOtp(
        phoneInput,
        otpInput,
        nameInput || "Wherio Member",
        country,
        emailInput || undefined,
      );
      if (res?.user) {
        setAuthenticatedUser(res.user, res.accessToken);
        setAuthStatusMsg(
          isAr
            ? "تم تسجيل الدخول وتوثيق الهاتف (OTP) والبريد الإلكتروني بنجاح!"
            : "Signed in with Verified Phone (OTP) + Verified Unique Email!",
        );
      }
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleVerifyEmailOnly = async () => {
    try {
      const res = await WherioApi.verifyEmail(
        currentUser.id,
        emailInput,
        country,
      );
      if (res?.user) {
        setAuthenticatedUser({
          ...currentUser,
          email: res.user.email,
          isEmailVerified: true,
        });
        setAuthStatusMsg(isAr ? res.messageAr : res.messageEn);
      }
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await WherioApi.resendVerification(
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
      const res = await WherioApi.recoverAccount(
        phoneInput || emailInput,
        country,
      );
      if (res?.user) {
        setAuthenticatedUser(res.user, res.accessToken);
      }
      setAuthStatusMsg(isAr ? res.messageAr : res.messageEn);
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const handleSaveProfileAndPreferences = async () => {
    try {
      const profRes = await WherioApi.updateProfile(
        currentUser.id,
        { name: nameInput, phone: phoneInput, email: emailInput },
        country,
      );
      await WherioApi.updatePreferences(
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
        setAuthenticatedUser(profRes.user);
      }
      setAuthStatusMsg(
        isAr
          ? "تم حفظ بيانات الملف الشخصي وتفضيلات اللغة والمدينة بنجاح."
          : "Profile details, preferred language, and preferred city saved.",
      );
    } catch (err: any) {
      setAuthStatusMsg(err.message);
    }
  };

  const onLogoutClick = async () => {
    await handleLogoutSession();
    setAuthStatusMsg(
      isAr
        ? "تم تسجيل الخروج بنجاح. أنت الآن في وضع الزائر."
        : "Signed out cleanly. You are now browsing as a Guest.",
    );
  };

  return (
    <div className="space-y-4">
      {/* Current User Verification Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-lg bg-[#072549] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
              {isAuthenticated
                ? isAr
                  ? "حساب مسجل في ويريو (جلسة نشطة لمدة 30 يوماً)"
                  : "Authenticated Wherio Member (30-Day Active Session)"
                : isAr
                  ? "وضع الزائر العام (Public Preview)"
                  : "Public Directory Preview Mode"}
            </span>
            <h2 className="mt-1.5 text-base font-extrabold text-[#072549]">
              {isAuthenticated
                ? currentUser.name
                : isAr
                  ? "زائر غير مسجل"
                  : "Guest Visitor"}
            </h2>
            {isAuthenticated && (
              <p className="text-xs text-slate-500">
                {currentUser.phone} • {currentUser.email}
              </p>
            )}
          </div>

          {isAuthenticated && (
            <button
              onClick={onLogoutClick}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isAr ? "خروج" : "Logout"}</span>
            </button>
          )}
        </div>

        {/* Dual Verification Badges (Phone OTP + Unique Email) */}
        {isAuthenticated && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div
              className={`rounded-xl border p-2.5 ${
                currentUser.isPhoneVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-1.5 font-extrabold">
                <Phone className="h-3.5 w-3.5" />
                <span>{isAr ? "توثيق الهاتف (OTP)" : "Phone OTP"}</span>
              </div>
              <p className="mt-0.5 text-[10px]">
                {currentUser.isPhoneVerified
                  ? isAr
                    ? "موثق وفريد ✓"
                    : "Verified & Unique ✓"
                  : isAr
                    ? "غير موثق"
                    : "Not Verified"}
              </p>
            </div>

            <div
              className={`rounded-xl border p-2.5 ${
                currentUser.isEmailVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-1.5 font-extrabold">
                <Mail className="h-3.5 w-3.5" />
                <span>{isAr ? "البريد الإلكتروني" : "Unique Email"}</span>
              </div>
              <p className="mt-0.5 text-[10px]">
                {currentUser.isEmailVerified
                  ? isAr
                    ? "موثق وفريد ✓"
                    : "Verified & Unique ✓"
                  : isAr
                    ? "بانتظار التوثيق"
                    : "Pending Verification"}
              </p>
            </div>
          </div>
        )}

        {/* Clean Real Account Actions */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] text-slate-500">
            {isAuthenticated
              ? isAr
                ? "جلستك محفوظة ومحمية تلقائياً عند تحديث الصفحة."
                : "Your session persists across page reloads automatically."
              : isAr
                ? "سجل دخولك أدناه لتفعيل المفضلة والمساعد الذكي والتقييمات."
                : "Sign in below to unlock Favorites, AI Concierge & Reviews."}
          </p>
          <button
            type="button"
            onClick={() => openOnboardingModal("country")}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-[#072549] hover:border-[#0072DC]"
          >
            <Compass className="h-3.5 w-3.5 text-[#0072DC]" />
            <span>
              {isAr ? "شاشة البداية واختيار الدولة" : "Welcome & Country Setup"}
            </span>
          </button>
        </div>
      </div>

      {/* OTP + Unique Email Verification & Profile Management Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h3 className="text-xs font-extrabold text-[#072549]">
          {isAr
            ? "إدارة الحساب وتوثيق الهاتف (OTP) والبريد الإلكتروني الفريد:"
            : "Account Profile, Phone OTP & Unique Email Verification:"}
        </h3>
        <div className="mt-2.5 space-y-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={isAr ? "الاسم الكامل" : "Full Name"}
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
                ? "تأكيد OTP + البريد الإلكتروني"
                : "Verify OTP & Unique Email"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveProfileAndPreferences}
              className="rounded-xl border border-[#0072DC] bg-[#0072DC]/10 py-2 text-[11px] font-extrabold text-[#0072DC]"
            >
              {isAr ? "حفظ الملف والتفضيلات" : "Save Profile & Prefs"}
            </button>
            <button
              type="button"
              onClick={handleResendVerification}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-700"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{isAr ? "إعادة إرسال الرمز" : "Resend Code"}</span>
            </button>
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={handleRecoverAccount}
              className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-[11px] font-bold text-amber-900"
            >
              {isAr
                ? "استعادة الحساب عبر الهاتف أو البريد المؤكد"
                : "Recover Existing Account via Verified Contact"}
            </button>
          )}

          {!currentUser.isEmailVerified && isAuthenticated && (
            <button
              onClick={handleVerifyEmailOnly}
              className="w-full rounded-xl bg-[#00B89C] py-2 text-xs font-extrabold text-white"
            >
              {isAr
                ? "توثيق البريد الإلكتروني لحسابك الحالي الآن"
                : "Verify Email for Current Account Now"}
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
            ? "إعدادات الدولة واللغة وتفضيلات الاستكشاف المحفوظة:"
            : "Preferred Country, Language & Saved Discovery Preferences:"}
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

        <div className="border-t border-slate-100 pt-3 space-y-2.5">
          <p className="text-[11px] font-extrabold text-[#072549]">
            {isAr
              ? "تفضيلات الأنشطة والفئات المفضلة:"
              : "Preferred Activity Categories:"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "cat-restaurants", en: "Restaurants", ar: "مطاعم" },
              { id: "cat-cafes", en: "Cafes", ar: "مقاهي" },
              { id: "cat-cinemas", en: "Cinemas", ar: "سينما" },
              {
                id: "cat-entertainment",
                en: "Entertainment",
                ar: "ترفيه وأنشطة",
              },
              {
                id: "cat-parking",
                en: "Parking Spots",
                ar: "مواقف السيارات",
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
                      ? "bg-[#072549] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isAr ? cat.ar : cat.en}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-extrabold text-[#072549]">
            {isAr
              ? "التجهيزات المفضلة عند البحث:"
              : "Preferred Practical Facilities:"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                id: "kids_friendly",
                en: "Kids Friendly",
                ar: "مناسب للأطفال",
              },
              { id: "parking", en: "Parking", ar: "مواقف سيارات" },
              {
                id: "valet",
                en: "Valet Service",
                ar: "خدمة فاليه",
              },
              { id: "wifi", en: "Fast Wi-Fi", ar: "واي فاي" },
              {
                id: "outdoor_seating",
                en: "Outdoor Seating",
                ar: "جلسات خارجية",
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
                      ? "bg-[#00B89C] text-white"
                      : "bg-slate-100 text-slate-600"
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
              router.push("/");
            }}
            className="w-full rounded-xl bg-[#0072DC] py-2 text-xs font-extrabold text-white hover:bg-[#072549]"
          >
            {isAr
              ? "حفظ وتطبيق تفضيلات الاستكشاف الآن"
              : "Save & Apply My Discovery Preferences"}
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
              ? "بوابة الإدارة والحوكمة (Wherio Admin Portal)"
              : "Wherio Admin & Governance Portal (Port 3006)"}
          </p>
          <p className="text-[10px] text-sky-100">
            {isAr
              ? "إدارة الـ 100 مكان، جودة البيانات، الإشراف على التقييمات، وتفعيل المدن"
              : "Manage 100 launch places, completeness score, review moderation & cities"}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0" />
      </a>
    </div>
  );
}
