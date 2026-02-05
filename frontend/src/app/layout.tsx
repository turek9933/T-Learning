import type { Metadata } from "next";
import { Outfit, Livvic, Atkinson_Hyperlegible } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import NotFound from "./not-found";
import '@/app/globals.css';

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],// Support for Polish
  variable: "--font-heading",
  display: "swap",
  weight: ["100", "400", "500", "700"],
});

const livvic = Livvic({
  subsets: ["latin", "latin-ext"],// Support for Polish
  variable: "--font-body",
  display: "swap",
  weight: ["100", "400", "500", "700"],
});

const atkinsonHyperlegible = Atkinson_Hyperlegible({// Support for Polish
  subsets: ["latin", "latin-ext"],
  variable: "--font-accessible",
  display: "swap",
  weight: ["400", "400", "700", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "T-Learning - Modułowa platforma do nauczania online",
    template: "%s | T-Learning",
  },
  description:
    "Lekka, intuicyjna aplikacja PWA do zarządzania nauczaniem online",
  keywords: [
    "platforma edukacyjna",
    "nauczanie online",
    "e-learning",
    "LMS",
    "progressive web app",
    "nauka zdalna",
  ],
  authors: [{ name: "Tomasz Turek" }],
  creator: "Tomasz Turek",
  
  manifest: "/manifest.json",
  
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  openGraph: {
    type: "website",
    locale: "pl_PL",
    title: "T-Learning - Modułowa platforma do nauczania online",
    description:
      "Lekka, intuicyjna aplikacja PWA do zarządzania nauczaniem online.",
    siteName: "T-Learning",
  },
  
  robots: {
    index: true,
    follow: true,
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    NotFound();
  }

  const messages = await getMessages();

  return (
    <html 
      lang={locale} 
      suppressHydrationWarning
      className={`${outfit.variable} ${livvic.variable} ${atkinsonHyperlegible.variable}`}
    >
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="T-Learning" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="T-Learning" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased font-body">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}