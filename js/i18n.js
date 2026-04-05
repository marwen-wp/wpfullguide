/**
 * i18n.js — Professional Multilingual Routing Engine
 * ─────────────────────────────────────────────────────────────────────────
 * 1. ZERO HARDCODING: Dynamically detects site root (e.g. / or /frontend/)
 * 2. VIRTUAL FOLDERS: Supports /fr/ and /ar/ prefixes.
 * 3. ENGLISH DEFAULT: Root is English by default.
 * 4. LINK PERSISTENCE: Automatically patches all internal <a> tags.
 * 5. RTL SUPPORT: Automates document direction for Arabic.
 * ─────────────────────────────────────────────────────────────────────────
 */

const LANGUAGES = ['en', 'fr', 'ar'];
const DEFAULT_LANG = 'en';

const i18n = {
  /**
   * I. DYNAMIC BASE & STATE
   */
  get currentLang() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const pathLang = parts.find(p => LANGUAGES.includes(p));
    // Check URL first, then localStorage, then default
    const lang = pathLang || localStorage.getItem('site_lang') || DEFAULT_LANG;
    return lang;
  },

  // The true directory where the site is installed (e.g. "/frontend" or "")
  get siteBase() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    // Find everything BEFORE any language code or .html filename
    const idx = parts.findIndex(p => LANGUAGES.includes(p) || p.includes('.html'));
    const baseParts = idx === -1 ? parts : parts.slice(0, idx);
    let base = baseParts.length > 0 ? '/' + baseParts.join('/') : '';
    return base.replace(/\/$/, ''); // No trailing slash
  },

  /**
   * II. URL GENERATOR
   * The "Brain" that decides exactly what the URL should look like.
   */
  url(targetPath = '') {
    const lang = this.currentLang;
    const base = this.siteBase; // e.g. "/frontend"
    
    // 1. Extract the clean filename (no index.html, no lang tags)
    let cleanFile = targetPath.split('/')
        .filter(p => p && !LANGUAGES.includes(p) && p !== 'index.html')
        .join('/');

    // 2. Build the final segment array: [base, optional-lang, optional-file]
    let segments = [base];
    if (lang !== DEFAULT_LANG) segments.push(lang);
    if (cleanFile) segments.push(cleanFile);

    // 3. Build the final string
    let finalPath = segments.join('/').replace(/\/+/g, '/');
    if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
    
    // To satisfy "English = /", ensure that /base/ points to just the base.
    if (cleanFile) return finalPath;
    return finalPath.endsWith('/') ? finalPath : finalPath + '/';
  },

  /**
   * III. ROUTING ACTIONS
   */
  setLanguage(lang) {
    if (!LANGUAGES.includes(lang)) return;
    localStorage.setItem('site_lang', lang);

    // Get current filename relative to siteBase
    const base = this.siteBase;
    const path = window.location.pathname;
    const relativePath = path.startsWith(base) ? path.slice(base.length) : path;
    const parts = relativePath.split('/').filter(Boolean);
    const cleanParts = parts.filter(p => !LANGUAGES.includes(p) && p !== 'index.html');
    let filename = cleanParts.join('/') || '';

    // Generate absolute path for NEW language
    // We override the detect logic temporarily
    let targetUrl = '';
    
    if (lang === DEFAULT_LANG) {
      targetUrl = base + '/' + filename;
    } else {
      targetUrl = base + '/' + lang + '/' + filename;
    }
    
    // Perform redirect relative to origin
    const final = (window.location.origin + '/' + targetUrl).replace(/([^:]\/)\/+/g, '$1') + window.location.search;
    window.location.href = final;
  },

  init() {
    const lang = this.currentLang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    // No more SW Router - we use physical junctions locally and _redirects in production
    this.registerRouter();
    this.injectSwitcher();
    this.handleLinks();
    
    // Observe DOM for dynamic links (e.g. projects loading later)
    const observer = new MutationObserver(() => this.handleLinks());
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log(`[i18n] Initialized. Lang: ${lang}, Base: ${this.siteBase}`);
  },

  async registerRouter() {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocal && 'serviceWorker' in navigator) {
      try {
        const swUrl = (this.siteBase === '' ? '' : this.siteBase) + '/js/sw.js';
        await navigator.serviceWorker.register(swUrl.replace('//', '/'), { scope: '/' });
      } catch (e) {
        console.warn("SW Registration ignored:", e);
      }
    }
  },

  /**
   * IV. LINK PERSISTENCE
   */
  handleLinks() {
    const lang = this.currentLang;
    const base = this.siteBase;

    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      
      // Internal links only
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http') && !href.startsWith(window.location.origin)) return;
      if (a.classList.contains('lang-btn') || a.getAttribute('onclick')) return;

      // 1. Get absolute path of target
      let targetPath = '';
      if (href.startsWith('http')) {
        targetPath = new URL(href).pathname;
      } else if (href.startsWith('/')) {
        targetPath = href;
      } else {
        const currentDir = window.location.pathname.replace(/\/[^\/]*$/, '');
        targetPath = currentDir + '/' + href;
      }

      // 2. Extract clean filename relative to siteBase
      const relativeTarget = targetPath.startsWith(base) ? targetPath.slice(base.length) : targetPath;
      const cleanParts = relativeTarget.split('/').filter(p => p && !LANGUAGES.includes(p) && p !== 'index.html');
      const filename = cleanParts.join('/') || '';
      
      // 3. Rebuild according to current lang
      let target = '';
      if (filename === '') {
         target = lang === DEFAULT_LANG ? `${base}/` : `${base}/${lang}/`;
      } else {
         target = lang === DEFAULT_LANG ? `${base}/${filename}` : `${base}/${lang}/${filename}`;
      }
      
      const final = target.replace(/\/+/g, '/');
      const search = href.includes('?') ? '?' + href.split('?')[1].split('#')[0] : '';
      const hash = href.includes('#') ? '#' + href.split('#')[1] : '';
      
      const fullFinal = final + search + hash;
      
      if (a.getAttribute('href') !== fullFinal) {
        a.setAttribute('href', fullFinal);
      }
    });
  },

  t(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[this.currentLang] || field[DEFAULT_LANG] || '';
  },

  injectSwitcher() {
    // Only inject if it doesn't exist
    if (document.querySelector('.lang-dropdown')) return;

    const switcher = document.createElement('div');
    switcher.className = 'lang-dropdown';
    switcher.id = 'dynamic-lang-switcher';
    switcher.innerHTML = `
      <button class="lang-dropdown-toggle" aria-haspopup="true" aria-expanded="false">
        <span>${this.currentLang.toUpperCase()}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <ul class="lang-dropdown-menu">
        ${LANGUAGES.map(l => `
          <li>
            <button class="lang-btn ${l === this.currentLang ? 'active' : ''}" onclick="i18n.setLanguage('${l}')">
              ${l.toUpperCase()}
            </button>
          </li>
        `).join('')}
      </ul>
    `;

    // Interaction
    const toggle = switcher.querySelector('.lang-dropdown-toggle');
    if (toggle) {
      toggle.onclick = (e) => {
        e.stopPropagation();
        switcher.classList.toggle('open');
      };
    }
    document.addEventListener('click', () => switcher.classList.remove('open'));

    // Professional Placement in the existing Nav Actions area
    const nav = document.querySelector('.nav.container');
    const cta = document.getElementById('nav-cta');
    
    if (nav) {
      let actionsWrap = nav.querySelector('.nav-actions');
      if (!actionsWrap) {
        actionsWrap = document.createElement('div');
        actionsWrap.className = 'nav-actions';
        if (cta) {
          nav.insertBefore(actionsWrap, cta);
          actionsWrap.appendChild(cta);
        } else {
          nav.appendChild(actionsWrap);
        }
      }
      actionsWrap.appendChild(switcher);
    }
  }
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}

window.i18n = i18n;
