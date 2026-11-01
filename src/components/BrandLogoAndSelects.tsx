'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { CountryCode, LangCode } from '@/lib/api';

export interface RegionConfig {
  code: CountryCode;
  nameEn: string;
  nameAr: string;
  shortEn: string;
  shortAr: string;
  currency: 'SAR' | 'AED' | 'EGP';
  dialCode: string;
  launchCityEn: string;
  launchCityAr: string;
}

export const SUPPORTED_REGIONS: RegionConfig[] = [
  {
    code: 'AE',
    nameEn: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    shortEn: 'UAE • Abu Dhabi',
    shortAr: 'الإمارات • أبوظبي',
    currency: 'AED',
    dialCode: '+971',
    launchCityEn: 'Abu Dhabi (Launch)',
    launchCityAr: 'أبوظبي (مدينة الإطلاق)',
  },
  {
    code: 'SA',
    nameEn: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    shortEn: 'KSA • Riyadh',
    shortAr: 'السعودية • الرياض',
    currency: 'SAR',
    dialCode: '+966',
    launchCityEn: 'Riyadh (Launch)',
    launchCityAr: 'الرياض (مدينة الإطلاق)',
  },
  {
    code: 'EG',
    nameEn: 'Egypt',
    nameAr: 'جمهورية مصر العربية',
    shortEn: 'Egypt • Cairo',
    shortAr: 'مصر • القاهرة',
    currency: 'EGP',
    dialCode: '+20',
    launchCityEn: 'Cairo (Expansion)',
    launchCityAr: 'القاهرة (توسع مستقبلي)',
  },
];

export const SUPPORTED_LANGUAGES: Array<{
  code: LangCode;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}> = [
  { code: 'en', label: 'English', nativeLabel: 'English (LTR)', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية (RTL)', dir: 'rtl' },
];

export function CountryFlagSvg({
  code,
  className = 'h-4 w-5 rounded-[3px] shadow-2xs shrink-0',
}: {
  code: CountryCode;
  className?: string;
}) {
  if (code === 'SA') {
    return (
      <svg viewBox="0 0 28 20" className={className} aria-label="Saudi Arabia">
        <rect width="28" height="20" rx="2" fill="#006C35" />
        <path
          d="M7 8.5H21M8.5 11.5H19.5"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <rect x="8" y="13.5" width="12" height="1.5" rx="0.75" fill="white" />
      </svg>
    );
  }
  if (code === 'AE') {
    return (
      <svg viewBox="0 0 28 20" className={className} aria-label="UAE">
        <rect width="28" height="6.66" fill="#00732F" />
        <rect y="6.66" width="28" height="6.66" fill="#FFFFFF" />
        <rect y="13.32" width="28" height="6.68" fill="#000000" />
        <rect width="8" height="20" fill="#FF0000" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 20" className={className} aria-label="Egypt">
      <rect width="28" height="6.66" fill="#CE1126" />
      <rect y="6.66" width="28" height="6.66" fill="#FFFFFF" />
      <rect y="13.32" width="28" height="6.68" fill="#000000" />
      <circle cx="14" cy="10" r="1.8" fill="#C09300" />
    </svg>
  );
}

/**
 * Custom Vector SVG Brand Logo for Wherio (ويريو)
 * Matches the official Wherio brand identity:
 * - Upper Royal Blue Location Pin Loop (#0072DC)
 * - Left Aqua-Teal 'W' Wing (#00C4A7 -> #008891)
 * - Right Warm Golden-Orange 'W' Wing (#FFC233 -> #FF6B2B)
 * - Deep Navy Pin Base & Wordmark (#072549) with Orange Dot inside 'o'
 * - Subtitle: EXPLORE • REVIEW • GO
 */
export function WherioBrandLogo({
  size = 'md',
  showSubtitle = true,
  isAr = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  isAr?: boolean;
}) {
  const iconDims =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 80 80"
        fill="none"
        className={`${iconDims} shrink-0 drop-shadow-xs`}
        aria-label="Wherio Logo"
      >
        <defs>
          <linearGradient
            id="wherioPinBlueGrad"
            x1="24"
            y1="6"
            x2="56"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0088FF" />
            <stop offset="100%" stopColor="#0055B3" />
          </linearGradient>
          <linearGradient
            id="wherioTealWingGrad"
            x1="6"
            y1="24"
            x2="40"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00D2B4" />
            <stop offset="100%" stopColor="#007E8A" />
          </linearGradient>
          <linearGradient
            id="wherioOrangeWingGrad"
            x1="40"
            y1="24"
            x2="74"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFC837" />
            <stop offset="100%" stopColor="#FF6B2B" />
          </linearGradient>
        </defs>

        {/* Upper Royal Blue Location Pin Loop */}
        <path
          d="M40 7C29.5 7 21 15.5 21 26C21 36.2 40 53 40 53C40 53 59 36.2 59 26C59 15.5 50.5 7 40 7ZM40 32.5C36.1 32.5 33 29.4 33 25.5C33 21.6 36.1 18.5 40 18.5C43.9 18.5 47 21.6 47 25.5C47 29.4 43.9 32.5 40 32.5Z"
          fill="url(#wherioPinBlueGrad)"
        />

        {/* Deep Navy Lower Pin Point */}
        <path d="M32 52L40 73L48 52H32Z" fill="#072549" />

        {/* Left Aqua-Teal 'W' Ribbon Wing */}
        <path
          d="M8 29C13 28 19 36 26 57L40 39L34 31L26 44C21 32 15 25 8 29Z"
          fill="url(#wherioTealWingGrad)"
        />

        {/* Right Golden-Orange 'W' Ribbon Wing */}
        <path
          d="M72 29C67 28 61 36 54 57L40 39L46 31L54 44C59 32 65 25 72 29Z"
          fill="url(#wherioOrangeWingGrad)"
        />
      </svg>

      <div className="leading-none">
        <div className="flex items-baseline tracking-tight">
          <span className={`${textSize} font-extrabold text-[#072549]`}>
            Wheri
          </span>
          <span
            className={`relative inline-flex items-center justify-center ${textSize} font-extrabold text-[#072549]`}
          >
            o
            <span className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-[#FF991F]" />
          </span>
          {isAr && (
            <span className="mr-1.5 text-xs font-extrabold text-[#0072DC]">
              • ويريو
            </span>
          )}
        </div>
        {showSubtitle && (
          <div className="mt-1 flex items-center gap-1 text-[9px] font-extrabold tracking-widest uppercase text-[#072549]/80">
            <span>{isAr ? 'استكشف' : 'EXPLORE'}</span>
            <span className="h-1 w-1 rounded-full bg-[#00B89C]" />
            <span>{isAr ? 'قيّم' : 'REVIEW'}</span>
            <span className="h-1 w-1 rounded-full bg-[#0072DC]" />
            <span>{isAr ? 'انطلق' : 'GO'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep backward-compatible alias so any existing import continues to work
export const AwfarBrandLogo = WherioBrandLogo;

export function RegionSelectDropdown({
  value,
  onChange,
  lang,
  variant = 'compact',
}: {
  value: CountryCode;
  onChange: (next: CountryCode) => void;
  lang: LangCode;
  variant?: 'compact' | 'full';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAr = lang === 'ar';

  const currentRegion =
    SUPPORTED_REGIONS.find((r) => r.code === value) || SUPPORTED_REGIONS[0];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 rounded-xl border transition ${
          variant === 'full'
            ? 'w-full border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-[#072549] hover:border-[#0072DC] hover:bg-white'
            : 'border-[#0072DC]/25 bg-[#0072DC]/8 px-2.5 py-1.5 text-[11px] font-bold text-[#072549] hover:bg-[#0072DC]/15'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <CountryFlagSvg code={currentRegion.code} />
          <span>
            {variant === 'full'
              ? `${isAr ? currentRegion.nameAr : currentRegion.nameEn} (${isAr ? currentRegion.launchCityAr : currentRegion.launchCityEn})`
              : isAr
                ? currentRegion.shortAr
                : currentRegion.shortEn}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#0072DC] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            isAr ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isAr
              ? 'اختر الدولة ومدينة الإطلاق'
              : 'Select Country & Launch City'}
          </div>
          {SUPPORTED_REGIONS.map((region) => {
            const active = region.code === value;
            return (
              <button
                key={region.code}
                type="button"
                onClick={() => {
                  onChange(region.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                  active
                    ? 'bg-[#0072DC]/10 font-extrabold text-[#072549]'
                    : 'font-medium text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CountryFlagSvg code={region.code} />
                  <div className="text-left">
                    <p className="leading-tight">
                      {isAr ? region.nameAr : region.nameEn}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isAr ? region.launchCityAr : region.launchCityEn} •{' '}
                      {region.dialCode}
                    </p>
                  </div>
                </div>
                {active && <Check className="h-4 w-4 text-[#0072DC]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LanguageSelectDropdown({
  value,
  onChange,
  variant = 'compact',
}: {
  value: LangCode;
  onChange: (next: LangCode) => void;
  variant?: 'compact' | 'full';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAr = value === 'ar';

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-1.5 rounded-xl border transition ${
          variant === 'full'
            ? 'w-full border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-[#072549] hover:border-[#0072DC] hover:bg-white'
            : 'border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#072549] hover:border-[#0072DC]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-[#00B89C]" />
          <span>
            {variant === 'full'
              ? currentLang.nativeLabel
              : currentLang.code === 'ar'
                ? 'العربية'
                : 'English'}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            isAr ? 'left-0' : 'right-0'
          }`}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isAr ? 'اختر اللغة' : 'Interface Language'}
          </div>
          {SUPPORTED_LANGUAGES.map((l) => {
            const active = l.code === value;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                  active
                    ? 'bg-[#0072DC]/10 font-extrabold text-[#072549]'
                    : 'font-medium text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{l.nativeLabel}</span>
                {active && <Check className="h-4 w-4 text-[#0072DC]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
