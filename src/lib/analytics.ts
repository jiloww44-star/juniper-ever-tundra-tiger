/**
 * Lightweight, env-driven tracking.
 *
 * Set any of these in your project environment to activate a provider:
 *   VITE_GA_MEASUREMENT_ID  -> Google Analytics 4 (G-XXXXXXXXXX)
 *   VITE_GTM_ID             -> Google Tag Manager (GTM-XXXXXXX)
 *   VITE_META_PIXEL_ID      -> Meta Pixel
 *   VITE_PLAUSIBLE_DOMAIN   -> Plausible (cookieless)
 *
 * When none are set nothing is loaded, so the site stays cookie-free by default.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    plausible?: (event: string, options?: Record<string, unknown>) => void;
  }
}

const env = import.meta.env as Record<string, string | undefined>;

function readPublicId(key: string): string | undefined {
  const value = env[key]?.trim();
  if (!value) return undefined;
  if (!/^[A-Za-z0-9._-]{3,64}$/.test(value)) return undefined;
  return value;
}

export const GA_ID = readPublicId("VITE_GA_MEASUREMENT_ID");
export const GTM_ID = readPublicId("VITE_GTM_ID");
export const META_PIXEL_ID = readPublicId("VITE_META_PIXEL_ID");
export const PLAUSIBLE_DOMAIN = env["VITE_PLAUSIBLE_DOMAIN"]?.trim();

export const hasTracking = Boolean(GA_ID || GTM_ID || META_PIXEL_ID || PLAUSIBLE_DOMAIN);

let loaded = false;

function addScript(src: string, attrs: Record<string, string> = {}) {
  const el = document.createElement("script");
  el.async = true;
  el.src = src;
  el.crossOrigin = "anonymous";
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

export function initAnalytics() {
  if (loaded || typeof window === "undefined" || !hasTracking) return;
  loaded = true;

  if (GA_ID || GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
  }

  if (GA_ID) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
    window.gtag!("config", GA_ID, { send_page_view: false });
  }

  if (GTM_ID) {
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`);
  }

  if (META_PIXEL_ID) {
    const fbq: NonNullable<Window["fbq"]> = Object.assign(
      (...args: unknown[]) => {
        fbq.queue!.push(args);
      },
      { queue: [] as unknown[], loaded: true },
    );
    window.fbq = fbq;
    addScript("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
  }

  if (PLAUSIBLE_DOMAIN && /^[a-z0-9.-]+$/i.test(PLAUSIBLE_DOMAIN)) {
    addScript("https://plausible.io/js/script.js", { "data-domain": PLAUSIBLE_DOMAIN });
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !hasTracking) return;
  if (GA_ID) window.gtag?.("event", "page_view", { page_path: path });
  if (GTM_ID) window.dataLayer?.push({ event: "page_view", page_path: path });
  if (META_PIXEL_ID) window.fbq?.("track", "PageView");
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasTracking) return;
  window.gtag?.("event", name, params);
  window.dataLayer?.push({ event: name, ...params });
  window.plausible?.(name, { props: params });
}
