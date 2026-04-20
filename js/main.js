/**
 * main.js — Application Entry Point
 * ─────────────────────────────────────────────────────────────────────────
 * Orchestrates data loading and DOM injection.
 * Data is fetched from Sanity CMS via the public CDN (no token required).
 * ─────────────────────────────────────────────────────────────────────────
 */

// Resolve current page path once — used by renderConfig & renderProjects
const currentPath = window.location.pathname.split('/').pop() || 'index';

/* ── Bootstrap ──────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadData();
    if (!data) return;
    
    renderAll(data);
    
    // Instant initialization for Bolt-Fast performance
    initAnimations();
    initGlowCursor();
    initLightbox();
  } catch (err) {
    console.error("Failed to load site data:", err);
  }
});

/* ── Data loader ────────────────────────────────────────────────────────── */
async function loadData() {
  try {
    const data = await fetchAllData();
    console.log("✅ Data loaded from Sanity CMS:", data);
    return data;
  } catch (err) {
    console.error("❌ CRITICAL: Sanity fetch failed. This site requires a connection to the CMS.", err);
    // Return null or throw to prevent rendering broken local fallback
    return null; 
  }
}

/* ═══════════════════════════════════════════════════════════════
   RENDER FUNCTIONS — each section is isolated
══════════════════════════════════════════════════════════════ */
function renderAll(data) {
  if (!data) {
    console.warn("No data received from loader.");
    return;
  }
  
  if (data.config) renderConfig(data.config);
  
  // Detect Current Page (Fix for Cloudflare clean URLs)
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");

  // Matches either /project or /project.html
  if ((path.includes("project.html") || path.endsWith("/project")) && projectId) {
    if (data.projects) renderProjectDetail(data.projects, projectId);
  } else if (path.includes("booking.html") || path.endsWith("/booking")) {
    // Booking Page Hero
    if (data.booking) renderBooking(data.booking);
  } else {
    // Normal Sections - each guarded for safety
    // Hero only on Homepage to prevent overwriting other page heroes
    const isHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/portfolio/') || (!path.includes('.html') && !path.includes('work') && !path.includes('booking') && !path.includes('service') && !projectId);
    
    if (isHomePage && data.hero) renderHero(data.hero);
    if (data.process) renderProcess(data.process);
    if (data.about) renderAbout(data.about);
    if (data.testimonials) renderTestimonials(data.testimonials);
    if (data.services) renderServices(data.services);
    if (data.projects) renderProjects(data.projects);
    if (data.contact) renderContact(data.contact);
  }
  
  if (data.config && data.contact) renderFooter(data.config, data.contact);
  if (data.ctaBanner) renderCtaBanner(data.ctaBanner);
}

/* ── Config / Meta ──────────────────────────────────────────── */
function renderConfig(config) {
  document.title = `${config.siteName} — ${i18n.t(config.tagline)}`;
  
  // Inject Dynamic Brand Colors
  if (config.primaryColor) {
    document.documentElement.style.setProperty('--color-accent', config.primaryColor);
    // Convert hex to RGB for overlays
    const rgb = hexToRgb(config.primaryColor);
    if (rgb) document.documentElement.style.setProperty('--color-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
  if (config.accentColor) {
    document.documentElement.style.setProperty('--color-accent-2', config.accentColor);
  }

  // Update Logo
  const logos = document.querySelectorAll('.nav-logo, .footer-logo');
  if (config.siteLogoUrl) {
    logos.forEach(logo => {
      logo.innerHTML = `<img src="${config.siteLogoUrl}" alt="${config.siteName}" style="height: 32px; width: auto;">`;
    });
  } else {
    logos.forEach(logo => {
      logo.textContent = config.siteName;
    });
  }

  // Update Favicon
  if (config.siteFaviconUrl) {
    // Remove existing favicons completely to force the browser to recognize the dynamic change
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(el => el.remove());
    
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = config.siteFaviconUrl;
    document.head.appendChild(newFavicon);
  }

  // Update Nav Menu
  const navMenu = document.getElementById('nav-menu');
  if (navMenu && config.mainMenu) {
    navMenu.innerHTML = config.mainMenu.map(item => {
      // Robust path matching: compare basename without extension for clean URL support
      const itemPath = item.href.split('/').pop().replace('.html', '') || 'index';
      const cleanPath = currentPath.replace('.html', '') || 'index';
      const isActive = itemPath === cleanPath ? 'active' : '';
      return `<li><a href="${item.href}" class="nav-link ${isActive}">${item.title}</a></li>`;
    }).join('');

    // Update or Inject Mobile-Only CTA
    const existingCta = navMenu.querySelector(".nav-menu-cta");
    if (config.navCta) {
      const ctaAnchorHtml = `
          <a href="${config.navCta.href}" class="btn btn-primary">
            ${config.navCta.label}
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
      `;

      if (existingCta) {
        existingCta.innerHTML = ctaAnchorHtml;
      } else {
        // Fallback for pages without the placeholder
        navMenu.insertAdjacentHTML('beforeend', `<li class="nav-menu-cta">${ctaAnchorHtml}</li>`);
      }
    }

    // Update or Inject Mobile Close Button at the bottom
    const existingClose = navMenu.querySelector(".mobile-only-close");
    const closeBtnHtml = `
        <button class="nav-close-btn" id="nav-close-mobile" aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
    `;

    if (existingClose) {
      existingClose.innerHTML = closeBtnHtml;
    } else {
      navMenu.insertAdjacentHTML('beforeend', `<li class="mobile-only-close">${closeBtnHtml}</li>`);
    }
  }

  // Update Nav CTA
  const navCta = document.getElementById('nav-cta');
  if (navCta && config.navCta) {
    navCta.href = config.navCta.href;
    navCta.innerHTML = `
      ${config.navCta.label}
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
}

// Helper: Convert HEX to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/* ── Hero ───────────────────────────────────────────────────── */
function renderHero(hero) {
  // Headline: 3 lines — line 3 gets italic green via CSS
  const headlineEl = document.getElementById("hero-headline");
  if (headlineEl && hero.headline) {
    const headline = i18n.t(hero.headline);
    const lines = Array.isArray(headline) ? headline : headline.split('\n');
    headlineEl.innerHTML = lines
      .map((line, i) => {
        // Wrap inner span so CSS nth-child selector can target it
        return `<span class="headline-line"><span>${line}</span></span>`;
      })
      .join("");
  }

  setText("hero-sub", i18n.t(hero.sub));

  const actionsEl = document.getElementById("hero-actions");
  if (actionsEl && hero.cta && hero.ctaSecondary) {
    actionsEl.innerHTML = `
      <a href="${hero.cta.href}" class="btn btn-primary">
        ${i18n.t(hero.cta.label)}
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <a href="${hero.ctaSecondary.href}" class="btn btn-ghost">
        ${i18n.t(hero.ctaSecondary.label)}
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    `;
  }

  // Marquee
  const track = document.getElementById("marquee-track");
  if (track && hero.marqueeItems) {
    const itemsSpan = hero.marqueeItems
      .map((item) => `<span class="marquee-item">${i18n.t(item)}</span>`)
      .join('<span class="marquee-sep" aria-hidden="true">✦</span>');
      
    // Must end with a separator so the join logic seamlessly loops!
    const itemsBase = itemsSpan + '<span class="marquee-sep" aria-hidden="true">✦</span>';
    
    // Repeat enough times to span an ultra-wide screen, put into exactly 2 identical parts
    const partContent = itemsBase.repeat(4);
    
    track.innerHTML = `
      <div class="marquee-part" style="display: flex; flex-shrink: 0;">${partContent}</div>
      <div class="marquee-part" style="display: flex; flex-shrink: 0;">${partContent}</div>
    `;
  }
}

/* ── Booking Page ───────────────────────────────────────────── */
function renderBooking(booking) {
  if (!booking) return;

  const statusLabel = document.getElementById("booking-status");
  if (statusLabel) {
    statusLabel.innerHTML = `
      <span style="width: 8px; height: 8px; background: var(--color-accent); border-radius: 50%; display: inline-block;"></span>
      ${booking.statusLabel || 'Available for new projects'}
    `;
  }

  const headline = document.getElementById("booking-headline");
  if (headline && booking.headline) {
    headline.innerHTML = booking.headline.replace(/\n/g, '<br/>');
  }
}

/* ── Testimonials ───────────────────────────────────────────── */
function renderTestimonials(testimonials) {
  setText("testimonials-label", i18n.t(testimonials.label) || "");
  if (testimonials.headline) setHtml("testimonials-headline", i18n.t(testimonials.headline).replace(/\n/g, "<br>"));

  const container = document.getElementById("testimonials-carousel");
  if (container && testimonials.items) {
    const cardsHtml = testimonials.items
      .map(
        (item) => `
        <div class="testimonial-card">
          <p class="testimonial-quote">${i18n.t(item.quote)}</p>
          <div class="testimonial-author">
            <div class="testimonial-name">${item.author}</div>
            <div class="testimonial-role">${i18n.t(item.role)}</div>
            ${item.company ? `<div class="testimonial-company">${item.company}</div>` : ''}
          </div>
        </div>`
      )
      .join("");
    // Double for marquee
    container.innerHTML = cardsHtml + cardsHtml;
  }
}

/* ── Process ─────────────────────────────────────────────── */
function renderProcess(process) {
  setText("process-label", i18n.t(process.label) || "");
  if (process.headline) setHtml("process-headline", i18n.t(process.headline).replace(/\n/g, "<br>"));

  const grid = document.getElementById("process-grid");
  if (!grid || !process.steps) return;

  grid.innerHTML = process.steps.map((step) => {
    const ctas = step.ctas || [];
    const ctaHtml = ctas.length
      ? `<div class="process-ctas">${ctas.map((c, idx) =>
          `<a href="${c.href}" class="btn ${c.primary ? 'btn-primary' : 'btn-ghost process-btn-ghost'} btn-step-${idx + 1}">
            ${i18n.t(c.label)}
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>`
        ).join('')}</div>`
      : '';

    return `
    <article class="process-card" role="listitem">
      <div class="process-number">${step.number}</div>
      <div class="process-body">
        <h3 class="process-title">${i18n.t(step.title)}</h3>
        <p class="process-desc">${i18n.t(step.body)}</p>
        ${ctaHtml}
      </div>
    </article>`;
  }).join('');
}

/* ── About ──────────────────────────────────────────────────── */
function renderAbout(about) {
  setText("about-label", i18n.t(about.label) || "");
  if (about.headline) setHtml("about-headline", i18n.t(about.headline).replace(/\n/g, "<br>"));
  setText("about-body", i18n.t(about.body) || "");

  // Update Profile Image
  const img = document.querySelector(".about-profile img");
  if (img && about.imageUrl) {
    img.src = about.imageUrl;
  }

  const statsEl = document.getElementById("about-stats");
  if (statsEl && about.stats) {
    statsEl.innerHTML = about.stats
      .map(
        (s) => `
        <div class="stat-item">
          <span class="stat-value">${s.value}</span>
          <span class="stat-label">${i18n.t(s.label)}</span>
        </div>`
      )
      .join("");
  }
}

/* ── Services ───────────────────────────────────────────────── */
function renderServices(services) {
  setText("services-label", i18n.t(services.label) || "");
  if (services.headline) setHtml("services-headline", i18n.t(services.headline).replace(/\n/g, "<br>"));

  const grid = document.getElementById("services-grid");
  if (grid && services.items) {
    grid.innerHTML = services.items
      .map((svc) => {
        // Security: Sanitize icons to prevent XSS injection
        const safeIcon = (svc.icon || '').replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
        
        return `
        <article class="service-card" role="listitem" id="${svc.id}">
          <div class="service-icon" aria-hidden="true">${safeIcon}</div>
          <h3 class="service-title">${i18n.t(svc.title)}</h3>
          <p class="service-desc">${i18n.t(svc.description)}</p>
          <ul class="service-tags" aria-label="Tags">
            ${svc.tags.map((t) => `<li class="tag">${i18n.t(t)}</li>`).join("")}
          </ul>
        </article>`;
      })
      .join("");
  }
}

/* ── Projects ───────────────────────────────────────────────── */
function renderProjects(projects) {
  setText("projects-label", i18n.t(projects.label) || "");
  if (projects.headline) setHtml("projects-headline", i18n.t(projects.headline).replace(/\n/g, "<br>"));
  
  const ctaBtn = document.getElementById("projects-cta");
  if (ctaBtn) {
    ctaBtn.textContent = i18n.t(projects.cta) || "";
    // Always use the dynamic/localized work.html path for consistency
    ctaBtn.href = i18n.url("work.html");
  }

  const grid = document.getElementById("projects-grid");
  if (grid && projects.items) {
    let itemsToRender = projects.items;

    // Filter for Featured Projects on the Homepage
    const path = window.location.pathname;
    const isHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/portfolio/') || (!path.includes('.html') && !path.includes('work'));
    
    if (isHomePage) {
      const featured = itemsToRender.filter(p => p.isFeatured === true);
      itemsToRender = featured.length > 0 ? featured : itemsToRender.slice(0, 2); // Fallback to latest 2 if none featured
    }

    grid.innerHTML = itemsToRender
      .map(
        (proj) => `
        <a href="project.html?id=${proj.id}" class="project-card" role="listitem" id="${proj.id}"
          style="--accent: ${proj.accentColor}; --bg: ${proj.bgColor}; text-decoration: none;"
          aria-label="View case study for ${i18n.t(proj.title)}"
        >
          <div class="project-visual" aria-hidden="true">
            <div class="project-visual-inner" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
              ${proj.coverImageUrl ? `<img src="${proj.coverImageUrl}" alt="${i18n.t(proj.title)}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;">` : ''}
            </div>
          </div>
          <div class="project-info">
            <div class="project-meta">
              <div class="categories-wrap" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${(() => {
                  const rawCats = proj.category || '';
                  const catsArray = Array.isArray(rawCats) ? rawCats : rawCats.split(',').map(c => c.trim()).filter(Boolean);
                  return catsArray.map(cat => `<span class="project-category tag">${i18n.t(cat)}</span>`).join('');
                })()}
              </div>
              <span class="project-year">${proj.year}</span>
            </div>
            <h3 class="project-title">${i18n.t(proj.title)}</h3>
            <p class="project-desc">${i18n.t(proj.detailsSubtitle)}</p>
            <span class="project-link" aria-hidden="true" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              View project
              <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </a>`
      )
      .join("");
  }
}

/* ── Contact ────────────────────────────────────────────────── */
function renderContact(contact) {
  setText("contact-label", i18n.t(contact.label) || "");
  if (contact.headline) setHtml("contact-headline", i18n.t(contact.headline).replace(/\n/g, "<br>"));
  setText("contact-sub", i18n.t(contact.sub) || "");

  const linksEl = document.getElementById("contact-links");
  if (linksEl && contact.links) {
    linksEl.innerHTML = contact.links
      .map(
        (l) => `
        <a href="${l.href}" class="contact-link contact-link--${l.type}" aria-label="${l.type}: ${i18n.t(l.label)}">
          <span class="contact-link-icon">${getContactIcon(l.type)}</span>
          <span>${i18n.t(l.label)}</span>
        </a>`
      )
      .join("");
  }
}

/* ── CTA Banner ─────────────────────────────────────────────── */
function renderCtaBanner(cta) {
  if (!cta) return;
  
  // Find all CTA card containers on the current page to translate them globally
  document.querySelectorAll('.cta-card').forEach(card => {
    const label = card.querySelector('.section-label');
    const headline = card.querySelector('.cta-card-headline');
    const sub = card.querySelector('.cta-card-sub');
    const btnLabel = card.querySelector('.cta-card-btn-label') || card.querySelector('.btn') || card.querySelector('a');

    if (label) label.textContent = cta.label || label.textContent;
    
    // Replace newline markers from Sanity string with generic HTML `<br/>`
    if (headline && cta.headline) {
      if (cta.headline.includes('\n')) {
        headline.innerHTML = cta.headline.split('\n').join('<br/>');
      } else {
        headline.textContent = cta.headline;
      }
    }
    
    if (sub) sub.textContent = cta.subtext || sub.textContent;
    
    if (cta.button && btnLabel) {
      // If we found a specific label container, set text. If it's just the anchor, set text + append icon
      if(btnLabel.classList.contains('cta-card-btn-label')) {
         btnLabel.textContent = cta.button.label;
      } else {
         btnLabel.innerHTML = `
           ${cta.button.label}
           <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
         `;
      }
      
      const btnParent = btnLabel.closest('a') || btnLabel;
      if (btnParent && btnParent.tagName === 'A') {
        btnParent.href = cta.button.href || '#';
      }
    }
  });
}


function renderFooter(config, contact) {
  setText("footer-copy", i18n.t(config.footerCopy));

  const socials = config.socials || (contact && contact.socials);
  const socialsEl = document.getElementById("footer-socials");
  if (socialsEl && socials) {
    socialsEl.innerHTML = socials
      .map(
        (s) => `
        <a href="${s.href}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${i18n.t(s.label)}">
          ${getSocialIcon(s.icon)}
        </a>`
      )
      .join("");
  }
}

function getSocialIcon(type) {
  const icons = {
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`
  };
  return icons[type] || '';
}

/* ── Form handling ──────────────────────────────────────────── */
(function initContactForm() {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("form-submit");

      // Basic validation
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        shakeForm(form);
        return;
      }

      // Visual loading state
      btn.disabled = true;
      btn.querySelector("span").textContent = "Sending…";

      // Simulate async submit (replace with real endpoint / Netlify forms)
      await new Promise((r) => setTimeout(r, 1500));

      btn.querySelector("span").textContent = "Message sent ✓";
      btn.classList.add("success");

      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        btn.querySelector("span").textContent = "Send Message";
        btn.classList.remove("success");
      }, 3000);
    });
  });

  function shakeForm(form) {
    if (typeof gsap === "undefined") return;
    gsap.fromTo(form, { x: -8 }, { x: 8, duration: 0.07, repeat: 5, yoyo: true, ease: "power2.inOut" });
  }
})();

/* ── Project Gallery Lightbox ───────────────────────────────── */
function initLightbox() {
  let currentGallery = [];
  let currentIndex = 0;

  // Delegation on the gallery-item container for max reliability
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    const img = item.querySelector('img');
    if (!img) return;

    e.preventDefault();

    // Get all images in the CURRENT gallery section
    const section = item.closest('.project-gallery-grid');
    if (section) {
      currentGallery = Array.from(section.querySelectorAll('img')).map(i => i.src);
      currentIndex = currentGallery.indexOf(img.src);
    } else {
      currentGallery = [img.src];
      currentIndex = 0;
    }
    
    showLightbox(currentGallery[currentIndex]);
  });

  function showLightbox(src) {
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Close lightbox">&plus;</button>
        <button class="lightbox-nav lightbox-prev" aria-label="Previous image">←</button>
        <button class="lightbox-nav lightbox-next" aria-label="Next image">→</button>
        <div class="lightbox-content">
          <img src="" alt="Lightbox image">
        </div>
      `;
      document.body.appendChild(overlay);
      
      const closeHandler = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; 
      };

      overlay.querySelector('.lightbox-close').onclick = closeHandler;
      overlay.querySelector('.lightbox-prev').onclick = (e) => { e.stopPropagation(); navigate(-1); };
      overlay.querySelector('.lightbox-next').onclick = (e) => { e.stopPropagation(); navigate(1); };
      overlay.onclick = (event) => { if (event.target === overlay) closeHandler(); };
    }

    const lightboxImg = overlay.querySelector('.lightbox-content img');
    lightboxImg.src = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
  }

  function navigate(direction) {
    if (!currentGallery.length) return;
    currentIndex = (currentIndex + direction + currentGallery.length) % currentGallery.length;
    const lightboxImg = document.querySelector('.lightbox-content img');
    if (lightboxImg) {
      lightboxImg.style.opacity = '0';
      setTimeout(() => {
        lightboxImg.src = currentGallery[currentIndex];
        lightboxImg.style.opacity = '1';
      }, 150);
    }
  }

  document.addEventListener('keydown', (e) => {
    const overlay = document.querySelector('.lightbox-overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

    if (e.key === 'Escape') {
       overlay.classList.remove('active');
       document.body.style.overflow = '';
    }
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
}


/* ── Project Detail Rendering ───────────────────────────────── */
function renderProjectDetail(projects, id) {
  const proj = projects.items.find(p => p.id === id);
  if (!proj) {
    window.location.href = i18n.url("work.html");
    return;
  }

  // Set Title & Meta
  document.title = `${i18n.t(proj.title)} — Case Study | wpfullguide`;
  
  // Update Hero
  setText("project-title", i18n.t(proj.title));
  
  // Handle Category Array or String as separate tags
  const categoriesContainer = document.getElementById("project-categories");
  if (categoriesContainer) {
    const rawCats = proj.category || '';
    const catsArray = Array.isArray(rawCats) ? rawCats : rawCats.split(',').map(c => c.trim()).filter(Boolean);
    
    if (catsArray.length > 0) {
      categoriesContainer.innerHTML = catsArray
        .map(cat => `<div class="section-label" style="margin-bottom: 0;">${i18n.t(cat)}</div>`)
        .join('');
    } else {
      categoriesContainer.innerHTML = `<div class="section-label" style="margin-bottom: 0;">Project</div>`;
    }
  }
  
  const companyPart = proj.company ? ` at ${proj.company}` : '';
  setText("project-subtitle", `${proj.year || ''} Case Study${companyPart}`.trim());
  
  // Update Background & Orb
  const bg = document.getElementById("project-bg");
  const orb = document.getElementById("project-orb");
  if (bg) bg.style.setProperty("--accent", proj.accentColor);
  if (orb) orb.style.background = proj.accentColor;
  
  // Update Content
  const detailsTitle = i18n.t(proj.detailsTitle);
  const detailsSubtitle = i18n.t(proj.detailsSubtitle);
  const desc = i18n.t(proj.description) || "";

  if (detailsTitle && detailsSubtitle) {
    setHtml("project-challenge-headline", detailsTitle);
    setHtml("project-body", `<p class="about-body">${detailsSubtitle}</p>`);
  } else {
    // Fallback: Smart split of the main description
    const sentences = desc.split('.');
    const firstSentence = sentences[0] ? sentences[0] + "." : "Project Details";
    const remainingText = sentences.slice(1).join('.').trim();
    
    setHtml("project-challenge-headline", firstSentence);
    setHtml("project-body", `<p class="about-body">${remainingText || desc}</p>`);
  }
  
  // Handle Main Image (using coverImage field, fallback to first gallery item)
  const imageContainer = document.getElementById("project-main-image-container");
  if (imageContainer) {
    const mainImgUrl = proj.coverImageUrl || (proj.gallery && proj.gallery.length ? proj.gallery[0].url : null);
    if (mainImgUrl) {
      imageContainer.innerHTML = `<img src="${mainImgUrl}" alt="${i18n.t(proj.title)}" style="width:100%; height:100%; object-fit:cover;">`;
    }
  }

  // Handle External Link
  const linkEl = document.getElementById("project-external-link");
  if (linkEl) {
    let rawUrl = proj.liveUrl || '';
    // Format URL (ensure https://)
    if (rawUrl && !rawUrl.startsWith('http')) {
        rawUrl = "https://" + rawUrl;
    }
    
    linkEl.innerHTML = `
      <a href="${rawUrl || '#'}" class="btn btn-primary" style="width: 100%; text-align: center;" target="_blank" rel="noopener noreferrer">
        View Live Demo
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    `;
  }

  // Dynamic Gallery
  const galleryGrid = document.getElementById("project-gallery-grid");
  const gallerySection = document.getElementById("gallery-section");
  if (galleryGrid && proj.gallery && proj.gallery.length > 0) {
    gallerySection.style.display = "block";
    galleryGrid.innerHTML = proj.gallery.map(g => `
      <div class="gallery-item">
        <img src="${g.url}" alt="${proj.title} Showcase">
      </div>
    `).join("");
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function getContactIcon(type) {
  const icons = {
    email: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M2 6l7 5 7-5" stroke="currentColor" stroke-width="1.4"/></svg>`,
    phone: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 2h3l1.5 4-2 1.2c.8 1.6 2.3 3.1 3.8 3.8L11.5 9 15.5 10.5v3C15.5 14.9 14.4 16 13 16 7 16 2 11 2 5c0-1.4 1.1-2.5 2.5-2.5L4 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    location: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2a5 5 0 0 1 5 5c0 3.5-5 9-5 9S4 10.5 4 7a5 5 0 0 1 5-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="7" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
  };
  return icons[type] || "";
}
