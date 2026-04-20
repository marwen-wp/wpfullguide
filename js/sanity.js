/**
 * sanity.js — CMS Integration Layer
 * ─────────────────────────────────────────────────────────────────────────
 * Fetches data from Sanity. 
 * Supports:
 * 1. Public CDN (No token - requires Public dataset)
 * 2. Proxy API (Requires Cloudflare Pages Functions - hides token)
 * ─────────────────────────────────────────────────────────────────────────
 */

/* ── 1. CONFIG ───────────────────────────────────────────────────────────── */
const SANITY_CONFIG = {
  projectId: "v8ndzhsn",
  dataset:   "production",
  apiVersion: "2024-03-31",
  // 🔐 ZERO-LEAK GUARANTEE: Never store tokens in this file.
  // Tokens are only read from window.SANITY_DEV_TOKEN (local-only) or Backend Proxy.
  token: typeof window !== "undefined" ? (window.SANITY_DEV_TOKEN || null) : null
};

/* ── 2. FETCH HELPER ─────────────────────────────────────────────────────── */
async function sanityFetch(query) {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  // 🚀 PATH A: Working locally with a Token (for private datasets)
  if (isLocal && SANITY_CONFIG.token) {
    const url = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "Authorization": `Bearer ${SANITY_CONFIG.token}` } });
    const json = await res.json();
    return json.result;
  }

  // 🚀 PATH B: Production (using Cloudflare Proxy)
  if (!isLocal) {
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const json = await res.json();
      return json.result;
    } catch (err) {
      console.warn("Proxy failed, trying CDN fallback...");
    }
  }

  // 🚀 PATH C: Public CDN (No token - requires the dataset to be "Public" in Sanity settings)
  const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
     if (res.status === 401 || res.status === 404) {
        throw new Error(`Sanity Access Denied (Status ${res.status}). Ensure your dataset is "Public" or set window.SANITY_DEV_TOKEN.`);
     }
     throw new Error(`Sanity Error: ${res.statusText}`);
  }
  const json = await res.json();
  return json.result;
}

/* ── 3. IMAGE URL BUILDER ───────────────────────────────────────────────── */
function sanityImageUrl(ref, { width = 800, quality = 80 } = {}) {
  if (!ref) return "";
  const parts = ref.split("-");
  if (parts.length < 4) return "";
  const id = parts[1];
  const dimensions = parts[2];
  const format = parts[3];
  const { projectId, dataset } = SANITY_CONFIG;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}?w=${width}&q=${quality}&auto=format`;
}

/* ── 4. MASTER AGGREGATOR ───────────────────────────────────────────────── */
async function fetchAllData() {
  const lang = i18n.currentLang;
  
  // 🚀 SINGLE-QUERY HEARTBEAT: Fetch all 11 sections in ONE round-trip.
  const query = `{
    "siteConfig": *[_type == "siteConfig" && _id == "siteConfig-${lang}"][0]{
      siteName, tagline, navCta{label, href}, footerCopy
    },
    "socials": *[_type == "socials" && _id == "socials-global"][0]{
      linkedin, github
    },
    "brand": *[_type == "brand" && _id == "brand-global"][0]{
      "siteLogoUrl": siteLogo.asset->url, "siteFaviconUrl": siteFavicon.asset->url, primaryColor, accentColor
    },
    "hero": *[_type == "hero" && _id == "hero-${lang}"][0]{
      eyebrow, headline, sub, cta, ctaSecondary, marqueeItems
    },
    "about": *[_type == "about" && _id == "about-${lang}"][0]{
      label, headline, body, stats[]{value, label}, imageUrl
    },
    "services": *[_type == "services" && _id == "services-${lang}"][0]{
      label, headline, "items": items[]{ id, icon, title, description, tags }
    },
    "selectedWork": *[_type == "selectedWork" && _id == "selectedWork-${lang}"][0]{
      label, headline, cta
    },
    "projects": {
      "config": *[_type == "projects" && _id == "projects-${lang}"][0]{ label, headline, cta },
      "items": *[_type == "project" && language == "${lang}"] | order(year desc){
        "id": slug.current, isFeatured, title, category, year, company, detailsTitle, detailsSubtitle, accentColor, bgColor, liveUrl, 
        "coverImageUrl": coverImage.asset->url, "gallery": gallery[]{ "url": asset->url }
      }
    },
    "process": *[_type == "process" && _id == "process-${lang}"][0]{
      label, headline, steps[]{ number, title, body, ctas[]{label, href, primary} }
    },
    "testimonials": *[_type == "testimonials" && _id == "testimonials-${lang}"][0]{
      label, headline, items[]{ quote, author, role, company }
    },
    "contact": *[_type == "contact" && _id == "contact-${lang}"][0]{
      label, headline, sub, links[]{label, href, type}, socials[]{label, href, icon}
    },
    "ctaBanner": *[_type == "ctaBanner" && _id == "ctaBanner-${lang}"][0]{
      label, headline, subtext, button
    },
    "booking": *[_type == "bookingPage" && _id == "bookingPage-${lang}"][0]{ statusLabel, headline }
  }`;

  try {
    const raw = await sanityFetch(query);
    if (!raw) throw new Error("No data returned from Sanity.");

    // Hardcoded Main Menu items for clean, static navigation
    const menuTranslations = {
      en: [
        { title: "Work", href: "work.html" },
        { title: "Services", href: "services.html" }
      ],
      fr: [
        { title: "Réalisations", href: "work.html" },
        { title: "Services", href: "services.html" }
      ],
      ar: [
        { title: "أعمالنا", href: "work.html" },
        { title: "خدماتنا", href: "services.html" }
      ]
    };

    // Construct social items array from global fields
    const socials = [];
    if (raw.socials?.linkedin) socials.push({ label: 'LinkedIn', href: raw.socials.linkedin, icon: 'linkedin' });
    if (raw.socials?.github) socials.push({ label: 'GitHub', href: raw.socials.github, icon: 'github' });

    // Clean up and merge objects for the frontend
    const config = { 
      ...raw.siteConfig, 
      ...raw.brand, 
      mainMenu: menuTranslations[lang] || menuTranslations.en,
      socials
    };

    // Determine which project config to use (Homepage "Selected Work" vs Work Page "Header")
    const path = window.location.pathname;
    const isHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/portfolio/') || (!path.includes('.html') && !path.includes('work') && !path.includes('booking') && !path.includes('service'));
    
    const projectsConfig = (isHomePage && raw.selectedWork) ? raw.selectedWork : (raw.projects?.config || {});
    const projects = { ...projectsConfig, items: raw.projects?.items || [] };

    return { 
      config, 
      hero: raw.hero, 
      about: raw.about, 
      services: raw.services, 
      projects, 
      process: raw.process, 
      testimonials: raw.testimonials, 
      contact: raw.contact, 
      ctaBanner: raw.ctaBanner, 
      booking: raw.booking 
    };
  } catch (err) {
    console.error("❌ Sanity Unified Fetch Error:", err);
    throw err;
  }
}

