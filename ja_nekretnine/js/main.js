'use strict';

// =============================================
// NEKRETNINE — DODAJTE / UREDITE OVDJE
// =============================================
// Da dodate novu nekretninu: kopirajte jedan
// objekat unutar niza i promijenite vrijednosti.
//
// tip:       "Prodaja" | "Iznajmljivanje"
// kategorija:"Stan" | "Kuca" | "Poslovni prostor"
// istaknuta: true | false  (prikazuje zlatnu oznaku)
// slika:     putanja do slike, npr. "images/nekretnine/stan1.jpg"
//            (ostavite "" ako slika još nije dostupna)
// sobe:      0 ako nije primjenjivo (poslovni prostor, zemljište)
// =============================================

var NEKRETNINE_DATA = [

  {
    naziv:      "Luksuzni penthouse",
    lokacija:   "Ilidža, Sarajevo",
    tip:        "Prodaja",
    kategorija: "Stan",
    kvadratura: 185,
    sobe:       4,
    cijena:     "650.000 KM",
    opis:       "Ekskluzivni penthouse na posljednjem spratu sa panoramskim pogledom na grad. Visoki stropovi, premium materijali, privatna terasa od 60m².",
    slika:      "images/nekretnine/nekretnina1.jpg",
    istaknuta:  true
  },

  {
    naziv:      "Moderna vila sa bazenom",
    lokacija:   "Pale, RS",
    tip:        "Prodaja",
    kategorija: "Kuca",
    kvadratura: 320,
    sobe:       6,
    cijena:     "1.200.000 KM",
    opis:       "Reprezentativna vila na mirnoj lokaciji. Bazen, garaža za 3 vozila, uređeni vrt od 1200m². Vrhunska gradnja i oprema.",
    slika:      "images/nekretnine/nekretnina2.jpg",
    istaknuta:  true
  },

  {
    naziv:      "Poslovni prostor u centru",
    lokacija:   "Centar, Sarajevo",
    tip:        "Iznajmljivanje",
    kategorija: "Poslovni prostor",
    kvadratura: 95,
    sobe:       0,
    cijena:     "3.500 KM/mj",
    opis:       "Reprezentativan poslovni prostor u srcu grada. Idealan za premium urede, advokatske kancelarije ili medicinske prakse.",
    slika:      "images/nekretnine/nekretnina3.jpg",
    istaknuta:  false
  }

  // ── NOVA NEKRETNINA — samo dodajte novi objekat ovdje: ──
  // ,{
  //   naziv:      "Naziv nekretnine",
  //   lokacija:   "Grad, Lokacija",
  //   tip:        "Prodaja",
  //   kategorija: "Stan",
  //   kvadratura: 75,
  //   sobe:       3,
  //   cijena:     "150.000 KM",
  //   opis:       "Opis nekretnine...",
  //   slika:      "images/nekretnine/naziv-slike.jpg",
  //   istaknuta:  false
  // }

];



// ── NAV SCROLL ──────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── MOBILE BURGER ───────────────────────────
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  const bars = burger.querySelectorAll('span');
  if (open) {
    bars[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    bars[1].style.opacity   = '0';
    bars[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
  }
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.querySelectorAll('span').forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
  });
});

// ── REVEAL ON SCROLL ────────────────────────
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = entry.target.parentElement
        ? [...entry.target.parentElement.querySelectorAll('.reveal, .reveal-left, .reveal-right')]
        : [];
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = idx > 0 ? (idx * 0.1) + 's' : '0s';
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => observer.observe(el));

// ── CONTACT FORM ────────────────────────────
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn      = form.querySelector('button[type="submit"]');
    const note     = form.querySelector('.form-note');
    const original = btn.textContent;

    // Stanje: šalje se
    btn.textContent = 'Šaljemo...';
    btn.disabled    = true;
    if (note) { note.style.color = ''; note.textContent = 'Odgovaramo u roku od 24 sata. Diskrecija garantovana.'; }

    try {
      const data = new FormData(form);

      const response = await fetch('/contact.php', {
        method: 'POST',
        body:   data
      });

      const result = await response.json();

      if (result.success) {
        // ── Uspjeh ──
        btn.textContent    = '✓ Poruka je poslana';
        btn.style.background = '#5c8a28';
        if (note) {
          note.style.color   = '#7ab33a';
          note.textContent   = 'Hvala! Odgovorit ćemo vam u roku od 24 sata.';
        }
        form.reset();

        setTimeout(() => {
          btn.textContent      = original;
          btn.style.background = '';
          btn.disabled         = false;
          if (note) {
            note.style.color   = '';
            note.textContent   = 'Odgovaramo u roku od 24 sata. Diskrecija garantovana.';
          }
        }, 5000);

      } else {
        // ── Greška sa servera ──
        btn.textContent      = 'Greška — pokušajte ponovo';
        btn.style.background = '#8a2828';
        btn.disabled         = false;
        if (note) {
          note.style.color   = '#c0392b';
          note.textContent   = result.message || 'Došlo je do greške. Kontaktirajte nas direktno.';
        }
        setTimeout(() => {
          btn.textContent      = original;
          btn.style.background = '';
          if (note) {
            note.style.color   = '';
            note.textContent   = 'Odgovaramo u roku od 24 sata. Diskrecija garantovana.';
          }
        }, 4000);
      }

    } catch (err) {
      // ── Mrežna greška ──
      btn.textContent      = 'Greška veze';
      btn.style.background = '#8a2828';
      btn.disabled         = false;
      if (note) {
        note.style.color   = '#c0392b';
        note.textContent   = 'Nije moguće uspostaviti vezu. Provjerite internet konekciju.';
      }
      setTimeout(() => {
        btn.textContent      = original;
        btn.style.background = '';
        btn.disabled         = false;
        if (note) {
          note.style.color   = '';
          note.textContent   = 'Odgovaramo u roku od 24 sata. Diskrecija garantovana.';
        }
      }, 4000);
    }
  });
}

// ── SMOOTH SCROLL ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.getElementById(this.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth'
    });
  });
});

// ── CURSOR GLOW ─────────────────────────────
const glow = document.createElement('div');
glow.style.cssText = 'position:fixed;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(122,179,58,0.06)0%,transparent 70%);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:opacity 0.5s;top:-999px;left:-999px;';
document.body.appendChild(glow);
let glowVisible = false;
document.addEventListener('mousemove', (e) => {
  glow.style.top = e.clientY + 'px';
  glow.style.left = e.clientX + 'px';
  if (!glowVisible) { glow.style.opacity = '1'; glowVisible = true; }
});
document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; glowVisible = false; });

// ── GENERISANJE KARTICA IZ NEKRETNINE_DATA ──
function renderNekretnine(lista) {
  const grid = document.getElementById('nekretnineGrid');
  if (!grid) return;

  if (!lista || lista.length === 0) {
    grid.innerHTML = '<div class="nekretnine__empty">Nekretnine uskoro.</div>';
    return;
  }

  grid.innerHTML = lista.map((n, i) => {
    const sobeHTML = n.sobe > 0
      ? `<div class="nekr-card__meta-item">
           <svg viewBox="0 0 16 16" fill="none"><path d="M1 10V6a2 2 0 012-2h10a2 2 0 012 2v4M1 10h14M1 10v3M15 10v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
           ${n.sobe} ${n.sobe === 1 ? 'soba' : 'sobe'}
         </div>`
      : '';

    const slikaHTML = n.slika
      ? `<img src="${n.slika}" alt="${n.naziv}" loading="lazy"
             onerror="this.parentElement.innerHTML='<div class=\\'nekr-card__img-placeholder\\'>📷 Slika uskoro</div>'">`
      : `<div class="nekr-card__img-placeholder">📷 Slika uskoro</div>`;

    return `
      <article class="nekr-card" data-tip="${n.tip}" data-kat="${n.kategorija}" data-index="${i}">
        <div class="nekr-card__img">
          ${slikaHTML}
          <span class="nekr-card__badge${n.tip === 'Iznajmljivanje' ? ' nekr-card__badge--iznajmljivanje' : ''}">${n.tip}</span>
          ${n.istaknuta ? '<span class="nekr-card__featured">◆ Istaknuto</span>' : ''}
        </div>
        <div class="nekr-card__body">
          <p class="nekr-card__lokacija">${n.lokacija}</p>
          <h3 class="nekr-card__naziv">${n.naziv}</h3>
          <p class="nekr-card__opis">${n.opis}</p>
          <div class="nekr-card__meta">
            <div class="nekr-card__meta-item">
              <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M1 6h14" stroke="currentColor" stroke-width="1.2"/></svg>
              ${n.kvadratura} m²
            </div>
            ${sobeHTML}
            <div class="nekr-card__meta-item">
              <svg viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 015 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 015-5z" stroke="currentColor" stroke-width="1.2"/></svg>
              ${n.kategorija}
            </div>
          </div>
          <div class="nekr-card__cijena">
            ${n.cijena}
            <span>Detalji →</span>
          </div>
        </div>
      </article>`;
  }).join('');

  // Reveal animacija za kartice
  grid.querySelectorAll('.nekr-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 100);
  });
}

// ── FILTERI ─────────────────────────────────
let aktivniFilter = 'sve';

function primijeniFilter(filter) {
  aktivniFilter = filter;
  const kartice = document.querySelectorAll('.nekr-card');
  kartice.forEach(kartica => {
    const tip = kartica.dataset.tip;
    const kat = kartica.dataset.kat;
    const prikazati = filter === 'sve' || tip === filter || kat === filter;
    kartica.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    if (prikazati) {
      kartica.style.display = '';
      setTimeout(() => { kartica.style.opacity = '1'; kartica.style.transform = 'translateY(0)'; }, 10);
    } else {
      kartica.style.opacity = '0';
      kartica.style.transform = 'translateY(8px)';
      setTimeout(() => { kartica.style.display = 'none'; }, 300);
    }
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    primijeniFilter(btn.dataset.filter);
  });
});

// ── MODAL ───────────────────────────────────
document.addEventListener('click', (e) => {
  const kartica = e.target.closest('.nekr-card');
  if (!kartica) return;

  const idx = parseInt(kartica.dataset.index, 10);
  const n = NEKRETNINE_DATA[idx];
  if (!n) return;

  const overlay = document.getElementById('nekrModal');

  const sobeDetalj = n.sobe > 0
    ? `<div class="nekr-modal__detalj">
         <div class="nekr-modal__detalj-label">Sobe</div>
         <div class="nekr-modal__detalj-value">${n.sobe}</div>
       </div>`
    : '';

  overlay.innerHTML = `
    <div class="nekr-modal">
      <button class="nekr-modal__close" id="zatvoriModal">&#x2715;</button>
      <div class="nekr-modal__img">
        ${n.slika
          ? `<img src="${n.slika}" alt="${n.naziv}" onerror="this.parentElement.style.background='var(--dark-2)'">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--dark-2);color:var(--mid)">📷 Slika uskoro</div>`
        }
      </div>
      <div class="nekr-modal__body">
        <p class="nekr-modal__tip">${n.tip} · ${n.kategorija}${n.istaknuta ? ' · ◆ Istaknuto' : ''}</p>
        <h2 class="nekr-modal__naziv">${n.naziv}</h2>
        <p class="nekr-modal__lokacija">📍 ${n.lokacija}</p>
        <p class="nekr-modal__opis">${n.opis}</p>
        <div class="nekr-modal__detalji">
          <div class="nekr-modal__detalj">
            <div class="nekr-modal__detalj-label">Kvadratura</div>
            <div class="nekr-modal__detalj-value">${n.kvadratura} m²</div>
          </div>
          ${sobeDetalj}
          <div class="nekr-modal__detalj">
            <div class="nekr-modal__detalj-label">Kategorija</div>
            <div class="nekr-modal__detalj-value">${n.kategorija}</div>
          </div>
        </div>
        <div class="nekr-modal__cijena">
          <div>
            <div class="nekr-modal__cijena-label">Cijena</div>
            <div class="nekr-modal__cijena-broj">${n.cijena}</div>
          </div>
          <a href="#contact" class="btn btn--solid" id="modalKontakt">Kontaktirajte nas</a>
        </div>
      </div>
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('zatvoriModal').addEventListener('click', zatvoriModal);
  document.getElementById('modalKontakt').addEventListener('click', zatvoriModal);
  overlay.addEventListener('click', ev => { if (ev.target === overlay) zatvoriModal(); });
});

function zatvoriModal() {
  const overlay = document.getElementById('nekrModal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') zatvoriModal(); });

// ── START ────────────────────────────────────
renderNekretnine(NEKRETNINE_DATA);