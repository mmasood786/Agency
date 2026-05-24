/* ==========================================================================
   Mainline — interactions
   - custom cursor (dot + ring) with hover targets
   - scroll reveal via IntersectionObserver
   - services & FAQ accordion
   - work carousel prev/next
   - before/after slider (drag + click)
   - stat counters
   - nav scrolled state
   ========================================================================== */

(() => {
  /* ---------------- custom cursor ---------------- */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const supportsCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsCursor && dot && ring) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; });
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    const hoverSel = 'a, button, .service, .faq, .work-card, .ba-shell, [data-cursor-hover]';
    document.querySelectorAll(hoverSel).forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });

    // hide cursor when leaving window
    document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = 1; ring.style.opacity = 1; });
  }

  /* ---------------- scroll reveal ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------------- nav scrolled state ---------------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- services accordion ---------------- */
  document.querySelectorAll('[data-service]').forEach((service) => {
    service.querySelector('.service-head').addEventListener('click', () => {
      const wasOpen = service.classList.contains('open');
      document.querySelectorAll('[data-service]').forEach((s) => s.classList.remove('open'));
      if (!wasOpen) service.classList.add('open');
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('[data-faq]').forEach((faq) => {
    faq.addEventListener('click', () => {
      const wasOpen = faq.classList.contains('open');
      document.querySelectorAll('[data-faq]').forEach((f) => f.classList.remove('open'));
      if (!wasOpen) faq.classList.add('open');
    });
  });

  /* ---------------- work carousel ---------------- */
  const carousel = document.getElementById('workCarousel');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  if (carousel && prev && next) {
    const step = () => {
      const card = carousel.querySelector('.work-card');
      if (!card) return 480;
      return card.getBoundingClientRect().width + 24;
    };
    prev.addEventListener('click', () => carousel.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => carousel.scrollBy({ left:  step(), behavior: 'smooth' }));
  }

  /* ---------------- before / after slider ---------------- */
  const shell = document.getElementById('baShell');
  const handle = document.getElementById('baHandle');
  const tabs = document.querySelectorAll('#baTabs .ba-tab');
  const pairs = document.querySelectorAll('#baShell .ba-pair');
  if (shell && handle) {
    const setSplit = (pct) => {
      const p = Math.max(0, Math.min(100, pct));
      handle.style.left = p + '%';
      // clip every after layer so swapping tabs lands on a matching split
      shell.querySelectorAll('.ba-after').forEach((el) => { el.style.clipPath = `inset(0 0 0 ${p}%)`; });
    };
    setSplit(50);

    let dragging = false;
    const fromEvent = (e) => {
      const rect = shell.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    };
    shell.addEventListener('mousedown', (e) => { dragging = true; setSplit(fromEvent(e)); });
    shell.addEventListener('touchstart', (e) => { dragging = true; setSplit(fromEvent(e)); }, { passive: true });
    window.addEventListener('mousemove', (e) => { if (dragging) setSplit(fromEvent(e)); });
    window.addEventListener('touchmove', (e) => { if (dragging) setSplit(fromEvent(e)); }, { passive: true });
    window.addEventListener('mouseup',   () => dragging = false);
    window.addEventListener('touchend',  () => dragging = false);

    // tab switching with a small wipe animation
    tabs.forEach((tab) => {
      tab.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = tab.dataset.pair;
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        pairs.forEach((p) => { p.classList.toggle('active', p.dataset.pair === idx); });
        const from = parseFloat(handle.style.left) || 50;
        const start = performance.now();
        const animate = (now) => {
          const t = Math.min(1, (now - start) / 700);
          const eased = 0.5 - Math.cos(t * Math.PI) / 2;
          // do a small wipe: 80 → 50 to show off the new pair
          const wipeFrom = 80;
          if (t < 0.5) {
            setSplit(from + (wipeFrom - from) * (t * 2));
          } else {
            setSplit(wipeFrom + (50 - wipeFrom) * ((t - 0.5) * 2));
          }
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      });
    });

    // light auto-demo wiggle on first reveal
    let demoed = false;
    const demoIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !demoed) {
          demoed = true;
          const start = performance.now();
          const anim = (now) => {
            const t = (now - start) / 1400;
            if (t >= 1) { setSplit(50); return; }
            const eased = 0.5 - Math.cos(Math.min(t, 1) * Math.PI) / 2;
            setSplit(20 + eased * 60);
            requestAnimationFrame(anim);
          };
          requestAnimationFrame(anim);
        }
      });
    }, { threshold: 0.5 });
    demoIO.observe(shell);
  }

  /* ---------------- quote calculator ---------------- */
  const qc = document.getElementById('quoteCalc');
  if (qc) {
    const tiers = {
      starter:  { min: 200, max: 350,  days: '5 – 7',   revs: '1 revision round',  pages: 3 },
      standard: { min: 400, max: 650,  days: '7 – 10',  revs: '2 revision rounds', pages: 5 },
      premium:  { min: 700, max: 1200, days: '10 – 14', revs: '3 revision rounds', pages: 7 },
    };
    const state = { type: 'Restaurant or café', tier: 'standard' };
    const priceEl = document.getElementById('qcPrice');
    const deliveryEl = document.getElementById('qcDelivery');
    const revsEl = document.getElementById('qcRevs');
    const ctaEl = document.getElementById('qcCta');

    const updateCta = () => {};

    ctaEl.addEventListener('click', (e) => {
      e.preventDefault();
      const typeEl = document.getElementById('cf-type');
      const pkgEl  = document.getElementById('cf-package');
      if (typeEl) typeEl.value = state.type;
      if (pkgEl)  pkgEl.value  = { starter: 'Starter', standard: 'Standard', premium: 'Premium' }[state.tier] || '';
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
    const flash = (el) => {
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 180);
    };
    const update = () => {
      const t = tiers[state.tier];
      flash(priceEl);
      setTimeout(() => {
        priceEl.textContent = `$${t.min} — $${t.max}`;
        deliveryEl.textContent = `Delivered in ${t.days} days`;
        revsEl.textContent = t.revs;
      }, 120);
      updateCta();
    };

    qc.querySelectorAll('.qc-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        qc.querySelectorAll('.qc-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.type = chip.dataset.val;
        updateCta();
      });
    });
    qc.querySelectorAll('.qc-tier').forEach((tier) => {
      tier.addEventListener('click', (e) => {
        e.preventDefault();
        qc.querySelectorAll('.qc-tier').forEach((t) => t.classList.remove('active'));
        tier.classList.add('active');
        state.tier = tier.dataset.val;
        update();
      });
    });
    updateCta();
  }

  /* ---------------- stat counters ---------------- */  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const valEl = el.querySelector('.val');
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = target * eased;
        valEl.textContent = decimals ? v.toFixed(decimals) : Math.round(v).toString();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach((el) => counterIO.observe(el));

  /* ---------------- contact form ---------------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = document.getElementById('cfSubmit');
      const success = document.getElementById('formSuccess');
      const error   = document.getElementById('formError');
      const orig    = btn.innerHTML;
      btn.disabled  = true;
      btn.textContent = 'Sending…';
      success.style.display = 'none';
      error.style.display   = 'none';
      try {
        const data = {};
        new FormData(contactForm).forEach((v, k) => { data[k] = v; });
        const res  = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) { contactForm.reset(); success.style.display = 'block'; }
        else throw new Error(json.message);
      } catch { error.style.display = 'block'; }
      finally  { btn.disabled = false; btn.innerHTML = orig; }
    });
  }
})();
