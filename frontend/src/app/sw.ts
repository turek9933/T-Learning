import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
    CacheableResponsePlugin,
    CacheFirst,
    ExpirationPlugin,
    NetworkFirst,
    Serwist,
    StaleWhileRevalidate,
} from "serwist";
import { env } from "@/lib/env";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const API_ORIGIN = env.apiUrl;

// Per-locale offline fallback. The first matcher that returns true wins.
// `/en/offline` is used as the default fallback
const OFFLINE_FALLBACKS = [
    { url: "/pl/offline", prefix: "/pl/" },
    { url: "/it/offline", prefix: "/it/" },
    { url: "/en/offline", prefix: "/en/" },
] as const;
const DEFAULT_OFFLINE_FALLBACK = "/en/offline";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // Whether outdated caches should be removed.
    cleanupOutdatedCaches: true,
    concurrency: 10,
    // Ignore the Workbox revision query parameter so precached entries
    // like "/en/offline?__WB_REVISION__=1" match requests for "/en/offline".
    ignoreURLParametersMatching: [/^__WB_REVISION__$/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  disableDevLogs: true,
  runtimeCaching: [
    // 0. Manifest — StaleWhileRevalidate
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname === "/manifest.json",
      handler: new StaleWhileRevalidate({
        cacheName: "manifest",
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      }),
    },

    // 1. Static assets — JS/CSS/fonts/workers - CacheFirst
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && ["font", "script", "style", "worker"].includes(request.destination),
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),// 30 days
        ],
      }),
    },

    // 2. Images — same-origin and next/image proxy
    {
      matcher: ({ request, url }) =>
        request.destination === "image" || url.pathname.startsWith("/_next/image"),
      handler: new CacheFirst({
        cacheName: "images",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),// 30 days
        ],
      }),
    },

    // 3. Chat messages — only first page (last ~30 messages) 
    // Only:
    // - GET requests;
    // - from API_ORIGIN;
    // - to /api/conversations/:id/messages;
    // - without a cursor.
    {
      matcher: ({ url, request }) => {
        if (request.method !== "GET") return false;
        if (!API_ORIGIN || url.origin !== API_ORIGIN) return false;
        if (!/^\/api\/conversations\/[^/]+\/messages\/?$/.test(url.pathname)) return false;
        return !url.searchParams.has("cursor");
      },
      handler: new StaleWhileRevalidate({
        cacheName: "chat-latest",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 6 * 60 * 60 }),// 6 hours
        ],
      }),
    },

    // 4. Backend API GET requests — (workspaces, posts, materials, events, homeworks, comments)
    // /api/auth/* excluded - fresh tokens.
    // Only:
    // - GET requests;
    // - from API_ORIGIN;
    // - NOT to /api/auth/*;
    // - NOT to /api/conversations/:id/messages;
    // - to /api/*
    {
      matcher: ({ url, request }) => {
        if (request.method !== "GET") return false;
        if (!API_ORIGIN || url.origin !== API_ORIGIN) return false;
        if (url.pathname.startsWith("/api/auth")) return false;
        if (/^\/api\/conversations\/[^/]+\/messages\/?$/.test(url.pathname)) return false;
        return url.pathname.startsWith("/api/");
      },
      handler: new StaleWhileRevalidate({
        cacheName: "api-data",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 6* 60 * 60 }),// 6 hours
        ],
      }),
    },

    // 5. Navigation (HTML) — try network, fall back to cache
    {
      matcher: ({ request }) =>
        request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),// 24 hours
        ],
      }),
    },
  ],
  // fallbacks triggers when runtimeCaching misses
  fallbacks: {
    entries: [
      // Per-locale offline fallbacks
      // Runs before locale redirect resolves
      ...OFFLINE_FALLBACKS.map(({ url, prefix }) => ({
        url,
        matcher: ({ request }: { request: Request }) => {
          if (request.destination !== "document") return false;
          return new URL(request.url).pathname.startsWith(prefix);
        },
      })),

      // Catch-all fallback - runs before locale redirect resolves
      {
        url: DEFAULT_OFFLINE_FALLBACK,
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
