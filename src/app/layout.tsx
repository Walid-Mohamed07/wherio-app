import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#072549',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://app.wherio.com'),
  title: {
    default:
      'Wherio (ويريو) | Explore • Review • Go — Smart Places Discovery & AI Concierge in UAE & KSA',
    template: '%s | Wherio (ويريو)',
  },
  description:
    'Wherio (ويريو) is your intelligent places discovery and verified review platform launching in Abu Dhabi (UAE) and Riyadh (KSA). Find restaurants, cafes, cinemas, and family entertainment with tri-state facility data, zero-hallucination AI Concierge recommendations, and dual-verified community reviews.',
  applicationName: 'Wherio',
  keywords: [
    'Wherio',
    'ويريو',
    'Explore Review Go',
    'Abu Dhabi places guide',
    'Riyadh cafes and restaurants',
    'Kids friendly places Abu Dhabi',
    'AI places concierge',
    'Verified restaurant reviews UAE KSA',
    'دليل أماكن أبوظبي',
    'دليل أماكن الرياض',
  ],
  authors: [{ name: 'Wherio Platform Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_AE', 'ar_SA', 'ar_EG'],
    url: 'https://app.wherio.com',
    siteName: 'Wherio (ويريو)',
    title: 'Wherio (ويريو) — EXPLORE • REVIEW • GO',
    description:
      'Smart places discovery, tri-state verified amenities, zero-hallucination AI Concierge, and dual-verified reviews in Abu Dhabi & Riyadh.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wherio (ويريو) — EXPLORE • REVIEW • GO',
    description:
      'Smart places discovery & AI Concierge launching in Abu Dhabi (UAE) & Riyadh (KSA).',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Wherio (ويريو)',
    slogan: 'EXPLORE • REVIEW • GO',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    areaServed: ['AE', 'SA', 'EG'],
  };

  return (
    <html lang="en" className={`${plusJakarta.variable} ${cairo.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased selection:bg-[#0072DC] selection:text-white">
        {children}
      </body>
    </html>
  );
}
