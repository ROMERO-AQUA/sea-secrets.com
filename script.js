/**
 * Sea Secrets Hurghada — Main Script & Interactions
 * Features: i18n Zero-Reload Language Switching, 3D Intro Animation, 3D Card Tilt,
 * Interactive FAQ Accordion, Lightbox, AI Concierge Assistant, WhatsApp Booking Integration
 * Version: 2.0 — Production Rebuild 2026
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     1. STATE & CONFIGURATION
  ═══════════════════════════════════════════════════════════════ */
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'de', 'ru', 'ar', 'it', 'pl', 'cs', 'uk'];
  let currentLang = DEFAULT_LANG;

  /* ═══════════════════════════════════════════════════════════════
     2. i18n ZERO-RELOAD CONTROLLER
  ═══════════════════════════════════════════════════════════════ */
  function detectLanguage() {
    const saved = localStorage.getItem('ss_lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    const navLangs = navigator.languages || [navigator.language || navigator.userLanguage];
    for (let lang of navLangs) {
      if (!lang) continue;
      const code = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGS.includes(code)) return code;
    }
    return DEFAULT_LANG;
  }

  function getNestedTranslation(obj, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  }

  function applyLanguage(code) {
    if (!SUPPORTED_LANGS.includes(code)) code = DEFAULT_LANG;
    currentLang = code;
    localStorage.setItem('ss_lang', code);

    const langData = TRANSLATIONS[code] || TRANSLATIONS[DEFAULT_LANG];
    const isRtl = langData.dir === 'rtl';

    // Update document metadata
    document.documentElement.lang = code;
    document.documentElement.dir = langData.dir;

    if (langData.meta) {
      if (langData.meta.title) document.title = langData.meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && langData.meta.desc) metaDesc.setAttribute('content', langData.meta.desc);
    }

    // Translate elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNestedTranslation(langData, key);
      if (val !== null) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) el.placeholder = val;
          else el.value = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // Translate placeholder specific data-i18n-ph
    const phElements = document.querySelectorAll('[data-i18n-ph]');
    phElements.forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = getNestedTranslation(langData, key);
      if (val !== null) el.placeholder = val;
    });

    // Update Language UI Labels
    const currentFlagEl = document.getElementById('current-lang-flag');
    const currentNameEl = document.getElementById('current-lang-name');
    if (currentFlagEl) currentFlagEl.textContent = langData.lang_flag;
    if (currentNameEl) currentNameEl.textContent = langData.lang_name;

    // Active state in dropdowns
    document.querySelectorAll('.lang-option, .mobile-lang-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === code) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Re-render Concierge greeting if concierge is present
    updateConciergeLanguage();

    // Notify premium layer that language changed (re-split hero title, etc.)
    window.dispatchEvent(new CustomEvent('ss:langchange'));
  }

  window.setLanguage = function (code) {
    applyLanguage(code);
    closeLangDropdown();
    closeMobileMenu();
  };

  /* ═══════════════════════════════════════════════════════════════
     3. 3D INTRO ANIMATION
  ═══════════════════════════════════════════════════════════════ */
  function initIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    // Check if user previously visited or reduced motion
    const visited = localStorage.getItem('ss_visited');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);

    if (visited || prefersReducedMotion || isBot) {
      overlay.style.display = 'none';
      return;
    }

    // Generate random bubbles
    const bubbleContainer = overlay.querySelector('.intro-bubbles');
    if (bubbleContainer) {
      for (let i = 0; i < 16; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 40 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.style = `animation-duration: ${Math.random() * 2 + 2}s; animation-delay: ${Math.random() * 1.5}s;`;
        bubbleContainer.appendChild(bubble);
      }
    }

    const dismissIntro = () => {
      overlay.classList.add('intro-exit');
      setTimeout(() => {
        overlay.style.display = 'none';
        localStorage.setItem('ss_visited', 'true');
      }, 700);
    };

    // Auto-dismiss after 2.5s
    const timer = setTimeout(dismissIntro, 2500);

    // Skip button
    const skipBtn = document.getElementById('intro-skip-btn');
    if (skipBtn) {
      setTimeout(() => { skipBtn.style.opacity = '1'; }, 800);
      skipBtn.addEventListener('click', () => {
        clearTimeout(timer);
        dismissIntro();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     4. NAVBAR & MOBILE MENU
  ═══════════════════════════════════════════════════════════════ */
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });

    // Language Dropdown Toggle
    const langSwitcher = document.querySelector('.lang-switcher');
    const langBtn = document.getElementById('lang-toggle-btn');

    if (langBtn && langSwitcher) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langSwitcher.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        langSwitcher.classList.remove('open');
      });
    }
  }

  function closeLangDropdown() {
    const langSwitcher = document.querySelector('.lang-switcher');
    if (langSwitcher) langSwitcher.classList.remove('open');
  }

  function initMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isOpen);
      mobileMenu.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
  }

  function closeMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     5. HERO LAZY VIDEO & PARALLAX
  ═══════════════════════════════════════════════════════════════ */
  function initHeroMedia() {
    const heroBg = document.querySelector('.hero-bg');
    const heroVideo = document.getElementById('hero-video');

    // Subtle parallax on scroll
    if (heroBg) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
          heroBg.style.transform = `translate3d(0, ${scrolled * 0.35}px, 0)`;
        }
      }, { passive: true });
    }

    // Lazy load video only if not reduced motion and in viewport
    if (heroVideo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const source = heroVideo.querySelector('source');
            if (source && source.dataset.src) {
              source.src = source.dataset.src;
              heroVideo.load();
              heroVideo.play().then(() => {
                heroVideo.classList.add('loaded');
              }).catch(() => {});
            }
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(heroVideo);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     6. 3D CARD TILT & SLIDESHOWS
  ═══════════════════════════════════════════════════════════════ */
  function initTripCards() {
    const cards = document.querySelectorAll('.trip-card');

    cards.forEach(card => {
      // Glare element that follows the cursor (premium layer)
      let glare = card.querySelector('.card-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'card-glare';
        card.appendChild(glare);
      }

      // 3D Tilt + Glare
      card.addEventListener('mouseenter', () => {
        card.classList.add('tilting');
      });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 16;
        const rotateY = (x - centerX) / 16;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        glare.style.setProperty('--gx', `${x}px`);
        glare.style.setProperty('--gy', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('tilting');
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });

      // Media Slideshow on card
      const media = card.querySelector('.trip-media');
      if (media) {
        const imgs = media.querySelectorAll('img');
        if (imgs.length > 1) {
          let idx = 0;
          let interval = null;

          card.addEventListener('mouseenter', () => {
            interval = setInterval(() => {
              imgs[idx].classList.remove('active');
              idx = (idx + 1) % imgs.length;
              imgs[idx].classList.add('active');
            }, 1800);
          });

          card.addEventListener('mouseleave', () => {
            if (interval) clearInterval(interval);
            imgs[idx].classList.remove('active');
            idx = 0;
            imgs[0].classList.add('active');
          });
        }
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     7. SCROLL REVEAL (IntersectionObserver)
  ═══════════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════
     8. FAQ ACCORDION
  ═══════════════════════════════════════════════════════════════ */
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const q = item.querySelector('.faq-question');
      if (!q) return;

      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(other => other.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     9. GALLERY LIGHTBOX
  ═══════════════════════════════════════════════════════════════ */
  function initGallery() {
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');

    if (!lightbox || !lightboxImg) return;

    let currentIndex = 0;
    const images = Array.from(items).map(item => item.querySelector('img').src);

    function showImage(index) {
      if (index < 0) index = images.length - 1;
      if (index >= images.length) index = 0;
      currentIndex = index;
      lightboxImg.src = images[currentIndex];
    }

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        showImage(index);
        lightbox.classList.add('open');
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', () => lightbox.classList.remove('open'));
    if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') lightbox.classList.remove('open');
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     10. MULTI-STEP BOOKING FORM -> WHATSAPP
  ═══════════════════════════════════════════════════════════════ */
  function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    let currentStep = 1;

    const btnNext1 = document.getElementById('btn-step1-next');
    const btnBack2 = document.getElementById('btn-step2-back');
    const btnNext2 = document.getElementById('btn-step2-next');
    const btnBack3 = document.getElementById('btn-step3-back');

    function goToStep(step) {
      currentStep = step;
      document.querySelectorAll('.step-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i + 1 === step);
      });
      document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i + 1 === step);
        dot.classList.toggle('done', i + 1 < step);
      });
      document.querySelectorAll('.step-line').forEach((line, i) => {
        line.classList.toggle('done', i + 1 < step);
      });
    }

    if (btnNext1) btnNext1.addEventListener('click', () => goToStep(2));
    if (btnBack2) btnBack2.addEventListener('click', () => goToStep(1));
    if (btnNext2) {
      btnNext2.addEventListener('click', () => {
        const name = document.getElementById('form-name').value;
        const phone = document.getElementById('form-phone').value;
        if (!name || !phone) {
          alert('Please enter your name and phone/WhatsApp number.');
          return;
        }
        goToStep(3);
      });
    }
    if (btnBack3) btnBack3.addEventListener('click', () => goToStep(2));

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const tripSelect = document.getElementById('form-trip');
      const trip = tripSelect ? tripSelect.value : 'General Inquiry';
      const date = document.getElementById('form-date').value || 'TBD';
      const guests = document.getElementById('form-guests').value || '1';
      const name = document.getElementById('form-name').value || '';
      const phone = document.getElementById('form-phone').value || '';
      const nationality = document.getElementById('form-nationality').value || 'Not specified';
      const requests = document.getElementById('form-requests').value || 'None';

      const message = `🌊 *NEW BOOKING INQUIRY — Sea Secrets Hurghada*\n\n` +
        `• *Trip:* ${trip}\n` +
        `• *Date:* ${date}\n` +
        `• *Guests:* ${guests}\n` +
        `• *Name:* ${name}\n` +
        `• *Phone/WhatsApp:* ${phone}\n` +
        `• *Nationality:* ${nationality}\n` +
        `• *Special Requests:* ${requests}\n\n` +
        `Please confirm availability and booking details. Thank you!`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/201110890202?text=${encoded}`, '_blank');
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     11. AI CONCIERGE ASSISTANT
  ═══════════════════════════════════════════════════════════════ */
  function initConcierge() {
    const toggleBtn = document.getElementById('concierge-toggle');
    const widget = document.getElementById('concierge-widget');
    const closeBtn = document.getElementById('concierge-close');
    const feed = document.getElementById('concierge-feed');

    if (!toggleBtn || !widget) return;

    toggleBtn.addEventListener('click', () => {
      widget.classList.toggle('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => widget.classList.remove('open'));
    }

    renderConciergeOptions();
  }

  function updateConciergeLanguage() {
    const feed = document.getElementById('concierge-feed');
    if (!feed) return;

    const langData = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    const conciergeData = langData.concierge;
    if (!conciergeData) return;

    // Reset feed with greeting and options
    feed.innerHTML = `
      <div class="concierge-msg bot">${conciergeData.greeting}</div>
      <div class="concierge-options" id="concierge-options-wrap"></div>
    `;

    renderConciergeOptions();
  }

  function renderConciergeOptions() {
    const optionsWrap = document.getElementById('concierge-options-wrap');
    if (!optionsWrap) return;

    const langData = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    const conciergeData = langData.concierge;
    if (!conciergeData || !conciergeData.options) return;

    const keys = ['trips', 'included', 'diving', 'booking', 'contact'];

    optionsWrap.innerHTML = '';
    conciergeData.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'concierge-opt';
      btn.textContent = optText;
      btn.addEventListener('click', () => handleConciergeSelect(keys[idx], optText));
      optionsWrap.appendChild(btn);
    });
  }

  function handleConciergeSelect(key, userLabel) {
    const feed = document.getElementById('concierge-feed');
    const langData = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    const conciergeData = langData.concierge;
    if (!feed || !conciergeData) return;

    // Append User Msg
    const userMsg = document.createElement('div');
    userMsg.className = 'concierge-msg user';
    userMsg.textContent = userLabel;
    feed.appendChild(userMsg);

    // Append Bot Answer
    const answerText = conciergeData.answers[key] || 'Please contact our team via WhatsApp for details!';
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'concierge-msg bot';
      botMsg.textContent = answerText;
      feed.appendChild(botMsg);

      // Append WhatsApp CTA button
      const waBtn = document.createElement('a');
      waBtn.className = 'wa-cta-btn';
      waBtn.href = 'https://wa.me/201110890202';
      waBtn.target = '_blank';
      waBtn.rel = 'noopener';
      waBtn.innerHTML = `<span>💬</span> ${conciergeData.wa_cta}`;
      feed.appendChild(waBtn);

      feed.scrollTop = feed.scrollHeight;
    }, 400);

    feed.scrollTop = feed.scrollHeight;
  }

  /* ═══════════════════════════════════════════════════════════════
     11.5 BACK TO TOP BUTTON
  ═══════════════════════════════════════════════════════════════ */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     12. FLOATING WHATSAPP BUTTON (LAZY VISIBILITY)
  ═══════════════════════════════════════════════════════════════ */
  function initWhatsAppFloat() {
    const waFloat = document.getElementById('wa-float');
    if (!waFloat) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 200) {
        waFloat.style.opacity = '1';
        waFloat.style.pointerEvents = 'all';
      } else {
        waFloat.style.opacity = '0';
        waFloat.style.pointerEvents = 'none';
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     12.5 BACKGROUND AUDIO — automatic, looped sea waves
  ═══════════════════════════════════════════════════════════════ */
  function initAudio() {
    const audio = document.getElementById('bg-audio');
    if (!audio) return;

    let started = false;

    audio.volume = 0;
    audio.loop   = true;

    /* ── Smooth volume fade ── */
    function fadeVolume(targetVol, durationMs) {
      const steps    = 40;
      const interval = durationMs / steps;
      const startVol = audio.volume;
      const delta    = (targetVol - startVol) / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        audio.volume = Math.min(1, Math.max(0, startVol + delta * step));
        if (step >= steps) clearInterval(timer);
      }, interval);
    }

    /* ── Start playback (autoplay attempt, looped) ── */
    function startAudio() {
      if (started) return;
      audio.play().then(() => {
        started = true;
        fadeVolume(0.35, 3000); // gentle 3-second fade to 35%
      }).catch(() => {
        // Browser blocked autoplay — retry on next interaction
      });
    }

    // Try to start automatically on load
    startAudio();

    // Fallback: browsers that block autoplay start on first interaction
    const EVENTS = ['click', 'keydown', 'touchstart', 'scroll'];
    function onFirstInteraction() {
      startAudio();
      EVENTS.forEach(ev => document.removeEventListener(ev, onFirstInteraction));
    }
    EVENTS.forEach(ev => document.addEventListener(ev, onFirstInteraction, { passive: true, once: true }));

    /* ── Pause when tab hidden, resume when visible ── */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        audio.pause();
      } else if (started) {
        audio.play().catch(() => {});
        fadeVolume(0.35, 1200);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     13. PREMIUM CINEMATIC MODULES
  ═══════════════════════════════════════════════════════════════ */
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── 13.1 Custom Cursor (gold dot + trailing ring) ── */
  function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring || prefersReducedMotion() || isCoarsePointer()) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    (function ringFollow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(ringFollow);
    })();

    const HOVER_SELECTOR = 'a, button, .trip-card, .gallery-item, .exp-card, .faq-question, .lang-option, select, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOVER_SELECTOR)) ring.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOVER_SELECTOR)) ring.classList.remove('is-hovering');
    });
    document.addEventListener('mousedown', () => ring.classList.add('is-down'));
    document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
  }

  /* ── 13.2 Scroll Progress Bar ── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.pageYOffset / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── 13.3 Underwater Particle Canvas (bubbles, fish, plankton) ── */
  function initOceanCanvas() {
    const canvas = document.getElementById('fx-ocean');
    if (!canvas || prefersReducedMotion()) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    let fish = [];
    let rafId = null;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      particles = [];
      fish = [];
      const isMobile = W < 768;
      const pCount = isMobile ? 26 : 60;
      for (let i = 0; i < pCount; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.6 + Math.random() * 2.4,
          speed: 0.15 + Math.random() * 0.5,
          drift: (Math.random() - 0.5) * 0.35,
          glow: 0.25 + Math.random() * 0.5,
          hue: Math.random() > 0.7 ? '184,150,62' : '53,224,213'
        });
      }
      const fCount = isMobile ? 3 : 7;
      for (let i = 0; i < fCount; i++) {
        fish.push({
          x: Math.random() * W,
          y: H * (0.15 + Math.random() * 0.7),
          s: 10 + Math.random() * 16,
          v: 0.25 + Math.random() * 0.5,
          dir: Math.random() > 0.5 ? 1 : -1,
          flip: 0.4 + Math.random() * 0.6
        });
      }
    }

    function drawFish(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.dir, 1);
      ctx.globalAlpha = 0.28 * f.flip;
      ctx.fillStyle = '#35E0D5';
      ctx.beginPath();
      ctx.moveTo(-f.s, 0);
      ctx.lineTo(-f.s * 0.3, -f.s * 0.45);
      ctx.lineTo(-f.s * 0.3, f.s * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, f.s * 0.8, f.s * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      // Drifting plankton + bubbles
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.y * 0.01) * 0.15;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.glow})`;
        ctx.shadowColor = `rgba(${p.hue},0.8)`;
        ctx.shadowBlur = p.r * 6;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Fish schools
      fish.forEach(f => {
        f.x += f.v * f.dir;
        f.y += Math.sin(f.x * 0.01 + f.flip * 10) * 0.25;
        if (f.x < -60 && f.dir === -1) { f.x = W + 60; }
        if (f.x > W + 60 && f.dir === 1) { f.x = -60; }
        drawFish(f);
      });

      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); }
      else if (!prefersReducedMotion()) { if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
    });
  }

  /* ── 13.4 Hero 3D Mouse Parallax ── */
  function initHeroParallax() {
    const fx = document.querySelector('.hero-fx');
    const content = document.querySelector('.hero-content');
    if (prefersReducedMotion()) return;

    const layers = fx ? fx.querySelectorAll('.fx-layer') : [];
    let tx = 0, ty = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    (function parallaxLoop() {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      layers.forEach(layer => {
        const depth = parseFloat(layer.getAttribute('data-depth')) || 10;
        layer.style.translate = `${(-cx * depth).toFixed(2)}px ${(-cy * depth * 0.8).toFixed(2)}px`;
      });
      if (content) {
        content.style.translate = `${(cx * 6).toFixed(2)}px ${(cy * 4).toFixed(2)}px`;
      }
      requestAnimationFrame(parallaxLoop);
    })();
  }

  /* ── 13.5 Split Title Reveal (word by word) ── */
  function initSplitTitle() {
    const title = document.querySelector('.hero-title');
    if (!title || prefersReducedMotion()) return;

    const lines = title.querySelectorAll('[data-i18n]');
    lines.forEach(line => {
      const words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words.map(w =>
        `<span class="word"><span class="word-inner">${w}</span></span>`
      ).join(' ');
    });

    // Stagger each word
    const inners = title.querySelectorAll('.word-inner');
    inners.forEach((el, i) => {
      el.style.transitionDelay = `${0.12 + i * 0.07}s`;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => title.classList.add('split-in'));
    });
  }

  /* ── 13.6 Animated Counters ── */
  function initCounters() {
    const counters = document.querySelectorAll('.counter[data-count]');
    if (!counters.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const animate = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      const duration = 1800;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(easeOut(p) * target).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(c => observer.observe(c));
  }

  /* ── 13.7 Magnetic Buttons ── */
  function initMagnetic() {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    document.querySelectorAll('.btn-primary, .btn-book, .trip-wa-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        btn.style.translate = `${x}px ${y}px`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.translate = '0px 0px';
      });
    });
  }

  /* ── 13.8 Experience Cards 3D Tilt ── */
  function initExpTilt() {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    document.querySelectorAll('.exp-card[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((rect.height / 2 - y) / rect.height) * 8;
        const rotateY = ((x - rect.width / 2) / rect.width) * 8;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        card.style.setProperty('--gx', `${x}px`);
        card.style.setProperty('--gy', `${y}px`);
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     14. INITIALIZATION ON DOM READY
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // 1. i18n Detection & Initial Render
    const initialLang = detectLanguage();
    applyLanguage(initialLang);

    // 2. Core UI Initializers
    initIntro();
    initNavbar();
    initMobileMenu();
    initHeroMedia();
    initTripCards();
    initScrollReveal();
    initFAQ();
    initGallery();
    initBookingForm();
    initConcierge();
    initWhatsAppFloat();
    initBackToTop();
    initAudio();

    // 3. Premium Cinematic Initializers
    initCustomCursor();
    initScrollProgress();
    initOceanCanvas();
    initHeroParallax();
    initSplitTitle();
    initCounters();
    initMagnetic();
    initExpTilt();

    // Re-split the hero title when language changes
    window.addEventListener('ss:langchange', () => initSplitTitle());
  });

})();

