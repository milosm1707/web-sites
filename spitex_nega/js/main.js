/* ================================================
   Spitex PflegeAufRädern GmbH – main.js
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav scroll effect ── */
  const nav = document.getElementById('mainNav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Intersection observer for reveal animations ── */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 76;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Contact form – sendet an send.php ── */
  const form     = document.getElementById('contactForm');
  const success  = document.getElementById('formSuccess');
  const btn      = document.getElementById('submitBtn');
  const btnText  = document.getElementById('btnText');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Felder validieren – rot markieren wenn leer
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        if (!field.value.trim()) {
          field.style.borderColor = '#c0392b';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });
      if (!valid) return;

      // Button deaktivieren, Ladetext zeigen
      btn.disabled = true;
      btnText.textContent = 'Wird gesendet…';

      try {
        const formData = new FormData(form);

        const response = await fetch('send.php', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          // Erfolg
          form.reset();
          btn.style.display = 'none';
          success.style.display = 'block';
          success.style.background = '#e8f2ef';
          success.style.borderColor = '#b0cfc5';
          success.style.color = '#4d7a6a';
          success.textContent = '✓ Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns bald bei Ihnen.';
        } else {
          // Fehler vom Server
          btn.disabled = false;
          btnText.textContent = 'Nachricht senden';
          success.style.display = 'block';
          success.style.background = '#fdf0ed';
          success.style.borderColor = '#e8c4b0';
          success.style.color = '#bf6b4a';
          success.textContent = '✗ ' + (result.message || 'Fehler beim Senden. Bitte versuchen Sie es erneut.');
        }

      } catch (err) {
        // Netzwerkfehler
        btn.disabled = false;
        btnText.textContent = 'Nachricht senden';
        success.style.display = 'block';
        success.style.background = '#fdf0ed';
        success.style.borderColor = '#e8c4b0';
        success.style.color = '#bf6b4a';
        success.textContent = '✗ Verbindungsfehler. Bitte versuchen Sie es später erneut.';
      }
    });
  }

  /* ── Active nav link highlighting on scroll ── */
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    let current = '';
    sections.forEach((sec) => {
      if (sec.getBoundingClientRect().top <= 100) {
        current = sec.getAttribute('id');
      }
    });
    navAnchors.forEach((a) => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

});