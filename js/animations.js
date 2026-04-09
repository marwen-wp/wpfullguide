/**
 * animations.js — GSAP Animation System
 * ─────────────────────────────────────────────────────────────────────────
 * All GSAP logic lives here. main.js calls initAnimations() after content
 * has been injected into the DOM.
 * Requires: GSAP 3.x + ScrollTrigger plugin (loaded via CDN in index.html)
 * ─────────────────────────────────────────────────────────────────────────
 */

function initAnimations() {
  // Guard — GSAP might not be loaded yet in very old browsers
  if (typeof gsap === "undefined") {
    console.warn("GSAP not loaded — animations skipped.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);


  /* ── Nav ────────────────────────────────────────────────────── */
  initNav();

  /* ── Hero ───────────────────────────────────────────────────── */
  initHeroAnimation();

  /* ── Scroll-triggered sections ──────────────────────────────── */
  initScrollReveal();

  /* ── Staggered grids ────────────────────────────────────────── */
  initStaggeredGrids();

  /* ── Parallax orbs ──────────────────────────────────────────── */
  initParallax();

  /* ── Marquee ────────────────────────────────────────────────── */
  initMarquee();

  /* ── Testimonials Slider ─────────────────────────────────────── */
  initTestimonialsSlider();

  /* ── Smooth anchor scrolling ────────────────────────────────── */
  initSmoothScroll();

  /* ── Card hover interactions ────────────────────────────────── */
  initCardHovers();
}

/* ═══════════════════════════════════════════════════════════════
   NAV SCROLL BEHAVIOR
══════════════════════════════════════════════════════════════ */
function initNav() {
  const header = document.getElementById("nav-header");
  if (!header) return;

  ScrollTrigger.create({
    start: "top -80",
    onEnter: () => header.classList.add("scrolled"),
    onLeaveBack: () => header.classList.remove("scrolled"),
  });

  // Active link highlight
  const sections = document.querySelectorAll("section[id]");
  const links = document.querySelectorAll(".nav-link");

  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onEnter: () => setActiveLink(section.id),
      onEnterBack: () => setActiveLink(section.id),
    });
  });

  function setActiveLink(id) {
    links.forEach((l) => l.classList.remove("active"));
    const active = document.querySelector(`.nav-link[href="#${id}"]`);
    if (active) active.classList.add("active");
  }

  // Mobile toggle
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });

    // Close on link click
    menu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });

    // Handle the new bottom close button (X)
    document.addEventListener("click", (e) => {
      if (e.target.closest("#nav-close-mobile")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   HERO INTRO ANIMATION
══════════════════════════════════════════════════════════════ */
function initHeroAnimation() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  const lines   = document.querySelectorAll(".hero-headline .headline-line");
  const sub     = document.getElementById("hero-sub");
  const actions = document.getElementById("hero-actions");
  const stars   = document.querySelectorAll(".hero-star");

  // Initial states - defensive against missing elements
  const itemsToSet = [sub, actions].filter(Boolean);
  if (itemsToSet.length) gsap.set(itemsToSet, { autoAlpha: 0, y: 24 });
  if (lines.length)     gsap.set(lines, { y: "110%", autoAlpha: 0 });
  if (stars.length)     gsap.set(stars, { autoAlpha: 0, scale: 0, rotation: -30 });

  if (stars.length) tl.to(stars, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, stagger: 0.15, ease: "back.out(2)" }, 0);
  if (lines.length) tl.to(lines, { y: "0%", autoAlpha: 1, duration: 0.85, stagger: 0.12 }, 0.2);
  if (sub)          tl.to(sub,   { autoAlpha: 1, y: 0, duration: 0.7 }, 0.7);
  if (actions)      tl.to(actions, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.9);

  // Stars breathe loop
  stars.forEach((star, i) => {
    gsap.to(star, {
      rotation: `+=${(i % 2 === 0 ? 25 : -20)}`,
      scale: 1.15,
      duration: 3 + i,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.4,
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL-TRIGGERED REVEALS
══════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Generic fade-up for section labels, headlines, bodies
  const revealEls = document.querySelectorAll(
    ".section-label, .section-headline, .about-body, .contact-headline, .contact-sub"
  );

  revealEls.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Stats counter animation
  const stats = document.querySelectorAll(".stat-value");
  stats.forEach((stat) => {
    gsap.fromTo(
      stat,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: stat,
          start: "top 85%",
        },
      }
    );
  });

  // About image circle
  const circle = document.querySelector(".about-circle");
  if (circle) {
    gsap.fromTo(
      circle,
      { scale: 0.8, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: circle,
          start: "top 85%",
        },
      }
    );
  }

  // Contact links stagger
  const contactLinks = document.querySelectorAll(".contact-link");
  if (contactLinks.length) {
    gsap.fromTo(
      contactLinks,
      { autoAlpha: 0, x: -20 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".contact-links",
          start: "top 85%",
        },
      }
    );
  }

  // Contact form fields
  const formGroups = document.querySelectorAll(".form-group, .form-submit");
  gsap.fromTo(
    formGroups,
    { autoAlpha: 0, y: 25 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".contact-form",
        start: "top 82%",
      },
    }
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGGERED GRIDS (services + projects)
══════════════════════════════════════════════════════════════ */
function initStaggeredGrids() {
  // Services cards
  const serviceCards = document.querySelectorAll(".service-card");
  if (serviceCards.length) {
    gsap.fromTo(
      serviceCards,
      { autoAlpha: 0, y: 60, scale: 0.96 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".services-grid",
          start: "top 80%",
        },
      }
    );
  }

  // Project cards
  const projectCards = document.querySelectorAll(".project-card");
  if (projectCards.length) {
    gsap.fromTo(
      projectCards,
      { autoAlpha: 0, y: 70 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".projects-grid",
          start: "top 82%",
        },
      }
    );
  }

  // Projects footer CTA
  const projCta = document.querySelector(".projects-footer");
  if (projCta) {
    gsap.fromTo(
      projCta,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: projCta,
          start: "top 88%",
        },
      }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════
   PARALLAX ORBS
══════════════════════════════════════════════════════════════ */
function initParallax() {
  // Gentle parallax on the hero container as you scroll past
  const heroContainer = document.querySelector(".hero-container");
  if (heroContainer) {
    gsap.to(heroContainer, {
      yPercent: -12,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Stars drift slightly faster (depth effect)
  document.querySelectorAll(".hero-star").forEach((star, i) => {
    gsap.to(star, {
      yPercent: -25 * (i % 2 === 0 ? 1 : 1.5),
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   MARQUEE (infinite scroll)
══════════════════════════════════════════════════════════════ */
function initMarquee() {
  const track = document.getElementById("marquee-track");
  if (!track) return;

  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

  setTimeout(() => {
    const part = track.querySelector('.marquee-part');
    if (!part) return;
    
    const distanceToMove = part.offsetWidth;
    const speed = 60; // Pixels per second
    const duration = distanceToMove / speed;

    gsap.to(track, {
      x: isRTL ? distanceToMove : -distanceToMove,
      duration: duration,
      ease: "none",
      repeat: -1,
      // GSAP automatically resets `x` to 0 seamlessly on repeat loops
    });
  }, 100);
}

/* ═══════════════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLLING
══════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 80 },
        duration: 1.1,
        ease: "power3.inOut",
      });
    });
  });

  // Fallback if ScrollTo plugin not loaded (pure CSS scroll)
  if (!gsap.plugins || !gsap.plugins.ScrollToPlugin) {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const id = anchor.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   CARD HOVER MICRO-INTERACTIONS
══════════════════════════════════════════════════════════════ */
function initCardHovers() {
  const cardSelectors = [
    ".service-card",
    ".project-card",
    ".testimonial-card",
    ".process-body"
  ];

  document.querySelectorAll(cardSelectors.join(", ")).forEach((card) => {
    const isService = card.classList.contains("service-card");
    const icon = isService ? card.querySelector(".service-icon") : null;

    // Hover Enter/Lift
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        y: -10,
        backgroundColor: "var(--color-surface-2)",
        borderColor: "rgba(var(--color-accent-rgb), 0.2)",
        boxShadow: "var(--shadow-card)",
        duration: 0.4,
        ease: "power2.out"
      });
      if (icon) gsap.to(icon, { scale: 1.15, rotation: 10, duration: 0.35, ease: "back.out(2)" });
    });

    // Interactive 3D Tilt
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      gsap.to(card, {
        rotationY: x * 8,
        rotationX: -y * 6,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 800
      });
    });

    // Hover Leave/Reset
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        y: 0,
        rotationY: 0,
        rotationX: 0,
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
        duration: 0.6,
        ease: "power2.out"
      });
      if (icon) gsap.to(icon, { scale: 1, rotation: 0, duration: 0.4, ease: "power2.out" });
    });
  });

  // Nav CTA ripple
  const navCta = document.getElementById("nav-cta");
  if (navCta) {
    navCta.addEventListener("mouseenter", () => {
      gsap.to(navCta, { scale: 1.05, duration: 0.25, ease: "power2.out" });
    });
    navCta.addEventListener("mouseleave", () => {
      gsap.to(navCta, { scale: 1, duration: 0.3, ease: "power2.out" });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS SLIDER
══════════════════════════════════════════════════════════════ */
function initTestimonialsSlider() {
  const track = document.getElementById("testimonials-carousel");
  if (!track) return;

  const cards = track.querySelectorAll(".testimonial-card");
  if (cards.length < 2) return; // Need items to slide

  // Wait for layout to settle before calculating pixel-perfect width
  setTimeout(() => {
    // Exact infinite smooth marquee loop math
    const speed = 60; // Pixels per second (slightly slower for readability)
    const cardWidth = cards[0].offsetWidth;
    const gapStr = window.getComputedStyle(track).gap || "0px";
    const gap = parseFloat(gapStr) || 0;
    
    // Exactly half the cards (the original set) times their width + gap
    const originalCount = cards.length / 2;
    const totalWidth = originalCount * (cardWidth + gap); 
    const duration = totalWidth / speed;

    // Check document direction to determine physical scroll vector
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const xMovement = isRTL ? totalWidth : -totalWidth;

    const anim = gsap.to(track, {
      x: xMovement,
      duration: duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => {
        gsap.set(track, { x: 0 });
      }
    });

    // Pause on hover
    track.addEventListener("mouseenter", () => anim.pause());
    track.addEventListener("mouseleave", () => anim.resume());
  }, 100); // 100ms safety buffer for font/image loading
}

/* ═══════════════════════════════════════════════════════════════
   GLOW CURSOR
══════════════════════════════════════════════════════════════ */
function initGlowCursor() {
  const glow = document.getElementById("glow-cursor");
  if (!glow) return;

  // On touch devices, hide it
  if (window.matchMedia("(pointer: coarse)").matches) {
    glow.style.display = "none";
    return;
  }

  // Ensure center alignment
  gsap.set(glow, { xPercent: -50, yPercent: -50 });

  // Fast but smooth tracking
  const xTo = gsap.quickTo(glow, "x", { duration: 0.2, ease: "power3" });
  const yTo = gsap.quickTo(glow, "y", { duration: 0.2, ease: "power3" });

  window.addEventListener("mousemove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
}
