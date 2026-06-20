export interface PageSeoConfig {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
}

const SITE_URL = "https://servdco-one.vercel.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const SEO_ROUTES: Record<string, PageSeoConfig> = {
  "/": {
    title: "Servd Co — Private Home Dining Marketplace",
    description:
      "Book verified local cooks for in-home breakfast, dinner, and meal prep. Flat-rate sessions, family-controlled groceries, trusted chefs in your kitchen.",
    path: "/",
  },
  "/browse-chefs": {
    title: "Browse Cooks Near You | Servd Co",
    description:
      "Discover verified home cooks in your area. Compare cuisines, ratings, and availability for private in-home dining.",
    path: "/browse-chefs",
  },
  "/pricing": {
    title: "Flat-Rate Pricing | Servd Co",
    description:
      "Transparent session pricing for breakfast, dinner, and meal prep. See guest fees and family platform fee before you book.",
    path: "/pricing",
  },
  "/faq": {
    title: "FAQ — Families & Cooks | Servd Co",
    description:
      "Answers about booking, groceries, cook verification, safety, and earnings on Servd Co.",
    path: "/faq",
  },
  "/how-it-works": {
    title: "How It Works | Servd Co",
    description:
      "How families book verified cooks, how cooks get paid, and how Servd Co keeps private home dining safe.",
    path: "/how-it-works",
  },
  "/for-chefs": {
    title: "Cook With Servd Co — Earn In Home Kitchens",
    description:
      "Join Servd Co as an independent cook. Set your schedule, earn per session, and serve local families.",
    path: "/for-chefs",
  },
  "/contact": {
    title: "Contact Servd Co",
    description:
      "Questions about bookings, verification, or partnerships? Contact the Servd Co team.",
    path: "/contact",
  },
  "/blog": {
    title: "Servd Co Blog",
    description:
      "Stories, tips, and updates from the Servd Co private dining community.",
    path: "/blog",
  },
  "/privacy": {
    title: "Privacy Policy | Servd Co",
    description: "How Servd Co collects, uses, and protects your personal information.",
    path: "/privacy",
  },
  "/terms": {
    title: "Terms of Service | Servd Co",
    description:
      "Terms governing use of the Servd Co marketplace platform by families and independent cooks.",
    path: "/terms",
  },
  "/cookies": {
    title: "Cookie Policy | Servd Co",
    description: "How Servd Co uses cookies and analytics on our website.",
    path: "/cookies",
  },
  "/legal": {
    title: "Legal Hub | Servd Co",
    description:
      "Privacy, terms, cookies, and independent contractor agreements for Servd Co.",
    path: "/legal",
  },
  "/register/chef": {
    title: "Join as a Cook | Servd Co",
    description: "Create your cook account and complete verification to receive bookings.",
    path: "/register/chef",
  },
  "/register/family": {
    title: "Join as a Family | Servd Co",
    description: "Sign up to browse verified cooks and book in-home dining sessions.",
    path: "/register/family",
  },
};

export function getSeoForPath(pathname: string): PageSeoConfig {
  const base = pathname.split("?")[0];
  if (SEO_ROUTES[base]) return SEO_ROUTES[base];
  if (base.startsWith("/chef/")) {
    return {
      title: "Cook Profile | Servd Co",
      description: "View cook specialties, reviews, and book a private in-home session.",
      path: base,
    };
  }
  return {
    title: "Servd Co",
    description: "Private home dining marketplace connecting families and verified cooks.",
    path: base,
  };
}

export function applyPageMeta(config: PageSeoConfig): void {
  const canonical = `${SITE_URL}${config.path === "/" ? "" : config.path}`;

  document.title = config.title;

  setMeta("name", "description", config.description);
  setMeta("property", "og:title", config.title);
  setMeta("property", "og:description", config.description);
  setMeta("property", "og:type", config.ogType ?? "website");
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:image", DEFAULT_OG_IMAGE);
  setMeta("property", "og:site_name", "Servd Co");
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", config.title);
  setMeta("name", "twitter:description", config.description);
  setMeta("name", "twitter:image", DEFAULT_OG_IMAGE);

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;
}

function setMeta(
  attr: "name" | "property",
  key: string,
  content: string,
): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}
