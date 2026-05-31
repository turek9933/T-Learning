import type { Metadata } from "next";
import { Outfit, Livvic, Atkinson_Hyperlegible } from "next/font/google";
import { Providers } from "@/components/Providers";
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

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"],// Support for Polish
  variable: "--font-accessible",
  display: "swap",
  weight: ["400", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "T-Learning",
    template: "%s | T-Learning",
  },
  description:
    "Modular platform for online learning. An intuitive, lightweight, and efficient alternative to complex educational platforms.",
  keywords: [
    "T-Learning",
    "learning platform",
    "platforma edukacyjna",
    "learning management system",
    "online education",
    "edukacja online",
    "nauczanie online",
    "e-learning",
    "LMS",
    "progressive web app",
    "nauka zdalna",
    "remote learning",
  ],
  authors: [{ name: "Tomasz Turek" }],
  creator: "Tomasz Turek",
  
  manifest: "/manifest.json",
  
  
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["pl_PL", "it_IT"],
    title: "T-Learning",
    description:
      "Modular platform for online learning. An intuitive, lightweight, and efficient alternative to complex educational platforms.",
    siteName: "T-Learning",
  },
  
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
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
        <meta name="theme-color" content="#128C20" />
        <link rel="apple-touch-icon" href="/icons/180-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/32-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/16-16.png" />
      </head>
      <body className="antialiased font-body">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}