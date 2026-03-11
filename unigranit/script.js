/**
 * UNIGRANIT OLJACA – Main JavaScript
 * Features: Navigation, Parallax, Scroll animations,
 *           Gallery filters, Counter animations, Form validation
 */

(function () {
  'use strict';

  /* ============================================================
     1. NAVBAR – Scroll behavior & mobile toggle
  ============================================================ */
  const navbar   = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');
  const navLinks  = document.querySelectorAll('.nav-link');

  // Scroll: add .scrolled class after 60px
  function handleNavScroll() {
    const scrolled = window.scrollY > 60;
    navbar.classList.toggle('scrolled', scrolled);
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run once on load

  // Mobile toggle
  navToggle.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');
      const link   = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        link.classList.toggle('active', scrollPos >= top && scrollPos < top + height);
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ============================================================
     2. PARALLAX – Hero background
  ============================================================ */
  const heroBg = document.getElementById('heroBg');

  function handleParallax() {
    if (!heroBg) return;
    const scrollY = window.scrollY;
    const speed   = 0.3;
    heroBg.style.transform = `translateY(${scrollY * speed}px)`;
  }

  // Only enable parallax on non-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    window.addEventListener('scroll', handleParallax, { passive: true });
  }

  /* ============================================================
     3. SCROLL ANIMATIONS – Intersection Observer
  ============================================================ */
  const animateTargets = document.querySelectorAll('[data-animate]');

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // Unobserve after animation (performance)
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateTargets.forEach(el => animationObserver.observe(el));

  /* ============================================================
     4. COUNTER ANIMATION – Hero stats
  ============================================================ */
  const counters = document.querySelectorAll('[data-count]');
  let countersStarted = false;

  function animateCounter(el) {
    const target  = parseInt(el.dataset.count, 10);
    const decimal = el.dataset.decimal || '';
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value  = Math.floor(eased * target);

      el.textContent = value + decimal;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target + decimal;
      }
    }
    requestAnimationFrame(update);
  }

  // Trigger counters when hero stats are visible
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersStarted) {
        countersStarted = true;
        counters.forEach(animateCounter);
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(heroStats);
  }

  /* ============================================================
     5. GALLERY FILTER
  ============================================================ */
  const filterButtons = document.querySelectorAll('.gallery-filter');
  const galleryItems  = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const filter = this.dataset.filter;

      // Update active state
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Filter items with stagger
      galleryItems.forEach((item, index) => {
        const category = item.dataset.category;
        const show = filter === 'all' || category === filter;

        setTimeout(() => {
          item.classList.toggle('filtered-out', !show);
        }, index * 40);
      });
    });
  });

  /* ============================================================
     6. SMOOTH SCROLL – For all anchor links
  ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 80;
      const top    = target.getBoundingClientRect().top + window.scrollY - navH - 20;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================================
     7. CONTACT FORM – Validation & Submission
  ============================================================ */
  const contactForm = document.getElementById('contactForm');
  const submitBtn   = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');
  const formError   = document.getElementById('formError');

  // Validation helpers
  const validators = {
    name: (v) => v.trim().length >= 2 ? null : 'Molimo unesite vaše ime (minimum 2 znaka)',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Molimo unesite ispravnu email adresu',
    phone: (v) => {
      if (!v.trim()) return null; // optional
      return /^[\d\s\+\-\(\)]{6,20}$/.test(v.trim()) ? null : 'Unesite ispravan broj telefona';
    },
    message: (v) => v.trim().length >= 10 ? null : 'Poruka mora imati najmanje 10 znakova'
  };

  function validateField(fieldId, value) {
    const validator = validators[fieldId];
    if (!validator) return true;
    const error = validator(value);
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (error) {
      if (errorEl) errorEl.textContent = error;
      if (inputEl) inputEl.classList.add('error');
      return false;
    } else {
      if (errorEl) errorEl.textContent = '';
      if (inputEl) inputEl.classList.remove('error');
      return true;
    }
  }

  // Real-time validation on blur
  ['name', 'email', 'phone', 'message'].forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur', () => validateField(id, field.value));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) {
        validateField(id, field.value);
      }
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Hide alerts
      formSuccess.hidden = true;
      formError.hidden   = true;

      // Validate all fields
      const fields = ['name', 'email', 'phone', 'message'];
      let valid = true;
      fields.forEach(id => {
        const field = document.getElementById(id);
        if (field && !validateField(id, field.value)) valid = false;
      });

      if (!valid) {
        // Focus first error field
        const firstError = contactForm.querySelector('.form-input.error');
        if (firstError) firstError.focus();
        return;
      }

      // Check honeypot
      const honeypot = contactForm.querySelector('[name="website"]');
      if (honeypot && honeypot.value) return; // Bot detected, silently fail

      // Show loading state
      const btnText    = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const btnIcon    = submitBtn.querySelector('.btn-icon');
      submitBtn.disabled = true;
      btnText.hidden     = true;
      btnLoading.hidden  = false;
      if (btnIcon) btnIcon.hidden = true;

      // Collect form data
      const formData = new FormData(contactForm);

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json().catch(() => ({ success: true }));
          if (result.success !== false) {
            formSuccess.hidden = false;
            contactForm.reset();
            // Clear all error states
            contactForm.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));
            contactForm.querySelectorAll('.form-error').forEach(e => e.textContent = '');
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            throw new Error(result.message || 'Server error');
          }
        } else {
          throw new Error('Network response was not ok');
        }
      } catch (err) {
        formError.hidden = false;
        formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.error('Form submission error:', err);
      } finally {
        submitBtn.disabled = false;
        btnText.hidden     = false;
        btnLoading.hidden  = true;
        if (btnIcon) btnIcon.hidden = false;
      }
    });
  }

  /* ============================================================
     8. BACK TO TOP BUTTON
  ============================================================ */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    function toggleBackToTop() {
      const show = window.scrollY > 500;
      backToTop.classList.toggle('visible', show);
      backToTop.hidden = !show;
    }
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     9. YEAR IN FOOTER
  ============================================================ */
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     10. KEYBOARD ACCESSIBILITY – Gallery hover
  ============================================================ */
  galleryItems.forEach(item => {
    item.setAttribute('tabindex', '0');
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // Could open a lightbox – for now, just show hover state
        item.querySelector('.gallery-hover').style.opacity = '1';
      }
    });
  });

  /* ============================================================
     11. SUBTLE ENTRANCE ANIMATION for Hero (immediate)
  ============================================================ */
  // Trigger hero animations immediately without waiting for scroll
  window.addEventListener('load', () => {
    const heroAnimateEls = document.querySelectorAll('.hero [data-animate]');
    heroAnimateEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('animated');
      }, 100 + i * 50);
    });
  });

})();
