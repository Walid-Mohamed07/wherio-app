export type CountryCode = "SA" | "AE" | "EG";
export type LangCode = "en" | "ar";

function resolveApiBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:4000/api/v1"
  )
    .trim()
    .replace(/\/+$/, "");
  if (raw.endsWith("/api/v1")) {
    return raw;
  }
  return `${raw}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const TOKEN_STORAGE_KEY = "wherio_access_token";

export function getStoredSessionToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function setStoredSessionToken(token?: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  country: CountryCode = "AE",
  lang: LangCode = "en",
): Promise<T> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-country": country,
    "x-lang": lang,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.messageEn || data?.message || `API Error: ${response.status}`,
    );
  }
  return data as T;
}

export const AwfarApi = {
  getCountries: (country: CountryCode, lang: LangCode) =>
    apiRequest<any[]>("/places/countries", {}, country, lang),

  getCategories: (country: CountryCode, lang: LangCode) =>
    apiRequest<any[]>("/places/categories", {}, country, lang),

  getNearbyPlaces: (
    params: {
      lat?: number;
      lng?: number;
      radiusKm?: number;
      cityId?: string;
      areaId?: string;
      categoryId?: string;
      subCategoryId?: string;
      keyword?: string;
      amenities?: string;
      priceRange?: string;
      sortBy?:
        | "relevance"
        | "distance"
        | "rating"
        | "completeness"
        | "discount";
    },
    country: CountryCode,
    lang: LangCode,
  ) => {
    const qs = new URLSearchParams();
    if (params.lat !== undefined) qs.set("lat", String(params.lat));
    if (params.lng !== undefined) qs.set("lng", String(params.lng));
    if (params.radiusKm) qs.set("radiusKm", String(params.radiusKm));
    if (params.cityId) qs.set("cityId", params.cityId);
    if (params.areaId) qs.set("areaId", params.areaId);
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    if (params.subCategoryId) qs.set("subCategoryId", params.subCategoryId);
    if (params.keyword) qs.set("keyword", params.keyword);
    if (params.amenities) qs.set("amenities", params.amenities);
    if (params.priceRange) qs.set("priceRange", params.priceRange);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    return apiRequest<any>(
      `/places/nearby?${qs.toString()}`,
      {},
      country,
      lang,
    );
  },

  getPlaceById: (
    placeId: string,
    country: CountryCode,
    lang: LangCode,
    lat?: number,
    lng?: number,
  ) => {
    const qs =
      lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";
    return apiRequest<any>(`/places/${placeId}${qs}`, {}, country, lang);
  },

  askVoiceConcierge: (
    payload: {
      voiceTranscript: string;
      conversationId?: string;
      userId?: string;
      isVoiceInput?: boolean;
      cityId?: string;
      lat: number;
      lng: number;
      radiusKm?: number;
    },
    country: CountryCode,
    lang: LangCode,
  ) =>
    apiRequest<any>(
      "/ai/concierge",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      country,
      lang,
    ),

  transcribeVoice: (
    rawTranscript: string,
    speechLocale: string,
    country: CountryCode = "AE",
    lang: LangCode = "en",
  ) =>
    apiRequest<any>(
      "/ai/voice-transcribe",
      {
        method: "POST",
        body: JSON.stringify({ rawTranscript, speechLocale }),
      },
      country,
      lang,
    ),

  submitAiFeedback: (
    payload: {
      conversationId: string;
      rating: "HELPFUL" | "NOT_HELPFUL";
      comment?: string;
      userId?: string;
    },
    country: CountryCode = "AE",
    lang: LangCode = "en",
  ) =>
    apiRequest<any>(
      "/ai/feedback",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      country,
      lang,
    ),

  removeOwnReview: (
    reviewId: string,
    userId: string,
    country: CountryCode = "AE",
    lang: LangCode = "en",
  ) =>
    apiRequest<any>(
      `/reviews/${reviewId}/own?userId=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      },
      country,
      lang,
    ),

  submitVerifiedReview: (
    payload: {
      placeId: string;
      userId: string;
      rating: number;
      qualityRating?: number;
      serviceRating?: number;
      atmosphereRating?: number;
      facilitiesValueRating?: number;
      comment: string;
      photos?: string[];
      reviewerLat?: number;
      reviewerLng?: number;
      tags?: string[];
    },
    country: CountryCode,
    lang: LangCode,
  ) =>
    apiRequest<any>(
      "/reviews",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      country,
      lang,
    ),

  reportReview: (
    reviewId: string,
    payload: {
      reporterUserId: string;
      reason: string;
    },
    country: CountryCode,
    lang: LangCode,
  ) =>
    apiRequest<any>(
      `/reviews/${reviewId}/report`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      country,
      lang,
    ),

  registerAccount: (
    payload: {
      name: string;
      phone: string;
      email: string;
      countryCode?: CountryCode;
    },
    country: CountryCode = "AE",
  ) =>
    apiRequest<any>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      country,
      "en",
    ),

  sendOtp: (phone: string, country: CountryCode, email?: string) =>
    apiRequest<any>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ phone, email, countryCode: country }),
      },
      country,
      "en",
    ),

  resendVerification: (contact: string, country: CountryCode = "AE") =>
    apiRequest<any>(
      "/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ contact }),
      },
      country,
      "en",
    ),

  verifyOtp: (
    phone: string,
    otpCode: string,
    name: string,
    country: CountryCode,
    email?: string,
  ) =>
    apiRequest<any>(
      "/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ phone, otpCode, name, email }),
      },
      country,
      "en",
    ),

  verifyEmail: (userId: string, email: string, country: CountryCode = "AE") =>
    apiRequest<any>(
      "/auth/verify-email",
      {
        method: "POST",
        body: JSON.stringify({ userId, email, emailCode: "1234" }),
      },
      country,
      "en",
    ),

  recoverAccount: (contact: string, country: CountryCode = "AE") =>
    apiRequest<any>(
      "/auth/recover",
      {
        method: "POST",
        body: JSON.stringify({ contact }),
      },
      country,
      "en",
    ),

  logout: (userId: string, country: CountryCode = "AE") =>
    apiRequest<any>(
      "/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
      country,
      "en",
    ),

  updateProfile: (
    userId: string,
    payload: { name?: string; phone?: string; email?: string },
    country: CountryCode = "AE",
  ) =>
    apiRequest<any>(
      `/auth/profile/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      country,
      "en",
    ),

  updatePreferences: (
    userId: string,
    payload: {
      preferredLanguage?: LangCode;
      preferredCityId?: string;
      preferredCategories?: string[];
      preferredAttributes?: string[];
      preferredPriceRange?: "BUDGET" | "MODERATE" | "UPSCALE";
    },
    country: CountryCode = "AE",
  ) =>
    apiRequest<any>(
      `/auth/preferences/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      country,
      "en",
    ),

  toggleFavorite: (
    userId: string,
    placeId: string,
    country: CountryCode = "AE",
  ) =>
    apiRequest<any>(
      "/auth/favorites/toggle",
      {
        method: "POST",
        body: JSON.stringify({ userId, placeId }),
      },
      country,
      "en",
    ),

  getUserProfile: (userId: string, country: CountryCode = "AE") =>
    apiRequest<any>(`/auth/profile/${userId}`, {}, country, "en"),

  checkSession: (country: CountryCode = "AE") =>
    apiRequest<any>("/auth/session", {}, country, "en"),

  createGuestSession: (country: CountryCode = "AE") =>
    apiRequest<any>(
      "/auth/guest",
      {
        method: "POST",
        body: JSON.stringify({ countryCode: country }),
      },
      country,
      "en",
    ),
};

export const WherioApi = AwfarApi;
