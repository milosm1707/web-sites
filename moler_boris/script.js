/* ================================================
   MOLERSKO GIPSARSKI RADOVI – script.js v2
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Sticky Nav ---- */
  const nav = document.getElementById('nav');
  const handleScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ---- Mobile Burger ---- */
  const burger   = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { burger.classList.remove('open'); navLinks.classList.remove('open'); })
  );

  /* ---- Scroll Reveal ---- */
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal:not(.visible)'));
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), Math.min(idx * 90, 450));
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => revealObs.observe(el));

  /* ---- Gallery Lightbox ---- */
  const galleryItems  = document.querySelectorAll('.gallery-item');
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev  = document.getElementById('lightboxPrev');
  const lightboxNext  = document.getElementById('lightboxNext');
  let currentIdx = 0;
  const images = Array.from(galleryItems).map(i => i.dataset.src);

  const openLightbox = (idx) => {
    currentIdx = idx;
    lightboxImg.src = images[currentIdx];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };
  const navigate = (dir) => {
    currentIdx = (currentIdx + dir + images.length) % images.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => { lightboxImg.src = images[currentIdx]; lightboxImg.style.opacity = '1'; }, 160);
  };

  lightboxImg.style.transition = 'opacity .16s ease';
  galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigate(-1));
  lightboxNext.addEventListener('click', () => navigate(1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  /* ---- Contact Form – real fetch to contact.php ---- */
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const formResp   = document.getElementById('formResponse');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Loading state
      btnText.hidden    = true;
      btnSpinner.hidden = false;
      submitBtn.disabled = true;
      formResp.className = 'form-response';
      formResp.textContent = '';

      const data = new FormData(form);

      try {
        const res  = await fetch('contact.php', { method: 'POST', body: data });
        const json = await res.json();

        if (json.success) {
          formResp.className = 'form-response success';
          formResp.textContent = '✓ Poruka je uspešno poslata! Kontaktiraćemo vas uskoro.';
          form.reset();
        } else {
          throw new Error(json.message || 'Greška pri slanju');
        }
      } catch (err) {
        formResp.className = 'form-response error';
        formResp.textContent = '✗ Greška: ' + err.message + '. Pozovite nas direktno na 060 5335800.';
      } finally {
        btnText.hidden    = false;
        btnSpinner.hidden = true;
        submitBtn.disabled = false;
      }
    });
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  /* ---- Sticky call bar – show after scrolling past hero ---- */
  const stickyBar = document.getElementById('stickyCallBar');
  const hero      = document.getElementById('hero');
  if (stickyBar && hero) {
    const barObs = new IntersectionObserver(
      ([entry]) => stickyBar.style.display = entry.isIntersecting ? 'none' : 'block',
      { threshold: 0 }
    );
    barObs.observe(hero);
  }

});