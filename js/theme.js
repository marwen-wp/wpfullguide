/**
 * theme.js — Theme Management System
 * ─────────────────────────────────────────────────────────────────────────
 * Handles switching between light and dark modes.
 * Persists user choice in localStorage.
 * Injects toggle UI next to the language switcher.
 * ─────────────────────────────────────────────────────────────────────────
 */

const ThemeManager = {
  init() {
    // Theme is applied early by inline script in head to prevent flashing.
    // This init handles the UI and event listeners.
    this.theme = localStorage.getItem('site_theme') || 'dark';
    this.injectToggle();
    this.listenSystemChange();
  },

  applyTheme() {
    // Prevent "grey flash" by disabling transitions during the swap
    const style = document.createElement('style');
    style.innerHTML = `* { transition: none !important; }`;
    document.head.appendChild(style);

    if (this.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('site_theme', this.theme);
    this.updateToggleIcon();

    // Cleanup stale inline styles from GSAP hovers to prevent "glitches"
    document.querySelectorAll('.service-card, .project-card, .testimonial-card, .cta-card, .process-body').forEach(el => {
      el.style.backgroundColor = '';
      el.style.borderColor = '';
      el.style.boxShadow = '';
    });

    // Re-enable transitions
    setTimeout(() => {
      style.remove();
    }, 20);
  },

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  },

  injectToggle() {
    this.injectHeaderToggle();
    this.injectMenuToggle();
  },

  injectHeaderToggle() {
    const interval = setInterval(() => {
      const actionsWrap = document.querySelector('.nav-actions');
      if (actionsWrap) {
        clearInterval(interval);
        if (document.getElementById('theme-toggle-header')) return;

        const btn = document.createElement('button');
        btn.id = 'theme-toggle-header';
        btn.className = 'theme-toggle theme-toggle-header';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.innerHTML = this.getIcon();
        btn.onclick = () => this.toggle();

        const switcher = actionsWrap.querySelector('.lang-dropdown');
        if (switcher) {
          actionsWrap.insertBefore(btn, switcher);
        } else {
          actionsWrap.appendChild(btn);
        }
      }
    }, 100);
  },

  injectMenuToggle() {
    const interval = setInterval(() => {
      const menu = document.getElementById('nav-menu');
      const cta = menu ? menu.querySelector('.nav-menu-cta') : null;
      if (menu && cta) {
        clearInterval(interval);
        if (document.getElementById('nav-menu-theme-wrapper')) return;

        const li = document.createElement('li');
        li.id = 'nav-menu-theme-wrapper';
        li.className = 'nav-menu-theme';
        li.innerHTML = `
          <div class="theme-switch-container">
            <span class="theme-label">Theme</span>
            <button id="theme-toggle-switch" class="theme-switch" aria-label="Toggle theme">
              <span class="theme-switch-slider"></span>
            </button>
          </div>
        `;
        
        // Insert after CTA
        cta.parentNode.insertBefore(li, cta.nextSibling);
        
        const btn = li.querySelector('button');
        btn.onclick = () => this.toggle();
      }
    }, 100);
  },

  getIcon() {
    // If current theme is dark, show sun icon to switch to light
    // If current theme is light, show moon icon to switch to dark
    if (this.theme === 'dark') {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  },

  updateToggleIcon() {
    const headerBtn = document.getElementById('theme-toggle-header');
    if (headerBtn) headerBtn.innerHTML = this.getIcon();
    
    // Switch state is handled via CSS [data-theme] on the container, 
    // but we can add an active class if needed.
  },

  listenSystemChange() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only change automatically if user hasn't set a preference
      if (!localStorage.getItem('site_theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }
};

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}

window.ThemeManager = ThemeManager;
