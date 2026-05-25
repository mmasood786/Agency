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
      starter:  { min: 500,  max: 800,  days: '5 – 7',   revs: '1 revision round',  pages: 3 },
      standard: { min: 1000, max: 1500, days: '7 – 10',  revs: '2 revision rounds', pages: 5 },
      premium:  { min: 2000, max: 3500, days: '10 – 14', revs: '3 revision rounds', pages: 7 },
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

  /* ---------------- hamburger menu ---------------- */
  const hamburger = document.getElementById('navHamburger');
  const mobileNavEl = document.getElementById('navMobile');
  if (hamburger && mobileNavEl) {
    const toggleMenu = (force) => {
      const open = typeof force === 'boolean' ? force : !hamburger.classList.contains('open');
      hamburger.classList.toggle('open', open);
      mobileNavEl.classList.toggle('open', open);
      nav.classList.toggle('menu-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      mobileNavEl.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    hamburger.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    mobileNavEl.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) toggleMenu(false); });
    // also close on resize back to desktop
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) toggleMenu(false); });
  }

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
        const data = { access_key: 'e0e4740e-c0fb-4172-8c14-37be9375da41' };
        new FormData(contactForm).forEach((v, k) => { data[k] = v; });
        data.subject   = `New inquiry from ${data.name || 'DevStudio Hub'}`;
        data.from_name = data.name || 'DevStudio Hub';
        const res  = await fetch('https://api.web3forms.com/submit', {
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

  // ── Chat Widget ──────────────────────────────────────────────────────────
  const CHAT_QA = [
    {
      category: 'Pricing & Packages',
      items: [
        {
          q: 'What are your prices?',
          a: 'Three fixed-fee packages:<br><strong>Starter $500–$800</strong> — 3 pages<br><strong>Standard $1,000–$1,500</strong> — 5 pages<br><strong>Premium $2,000–$3,500</strong> — 6–7 pages<br><br>All are one-time payments. No monthly fees from us.',
          cta: 'See full pricing →',
          href: '#pricing',
        },
        {
          q: "What's the difference between Starter, Standard, and Premium?",
          a: '<strong>Starter</strong> — clean 3-page site, ideal for solo practitioners and brand-new businesses.<br><strong>Standard</strong> — 5 pages with a quote button and Google reviews. What most local businesses pick.<br><strong>Premium</strong> — everything in Standard plus a blog, FAQ page, full SEO setup, and Google Analytics.',
          cta: 'Compare packages →',
          href: '#pricing',
        },
        {
          q: 'Are there any monthly fees?',
          a: "No monthly fees from us. The only ongoing costs are hosting (~$10–15/month) and your domain (~$10–15/year) — both go directly to the provider, not us.",
        },
        {
          q: 'How does payment work?',
          a: 'Simple two-part payment: <strong>50% deposit</strong> when you approve the mockup (locks your spot in the calendar), and the <strong>remaining 50% on go-live day</strong>. The quote you get is the price you pay — no surprise charges.',
        },
        {
          q: 'Do you offer a money-back guarantee?',
          a: "Yes. We guarantee delivery in <strong>14 days or your money back</strong>. If you're not satisfied with the final result, you get a full refund — no awkward negotiations.",
        },
      ],
    },
    {
      category: 'Process & Timeline',
      items: [
        {
          q: 'How long does it take to build my website?',
          a: "Most sites are completed in <strong>5–14 days</strong> depending on the package. Starter ~1 week, Standard 7–10 days, Premium up to 2 weeks. You'll get a clear timeline before we start.",
        },
        {
          q: 'How do we get started?',
          a: 'Click <strong>"Get Free Website Audit"</strong> and fill out the short form. You\'ll receive a detailed audit report within 24 hours. From there we chat about your goals — no pressure, no obligation.',
          cta: 'Get free audit →',
          href: '#contact',
        },
        {
          q: 'What happens after I contact you?',
          a: "You'll get a free website audit within 24 hours. Then a quick chat about your goals, a package recommendation, and — once you're happy — a mockup within 1–2 days. The whole process from first email to live site takes under 2 weeks.",
        },
        {
          q: 'Can I get my website faster / rush delivery?',
          a: "Starter and Standard sites are often delivered in 5–10 days. If you have a specific deadline, reach out and mention it — I'll tell you what's possible.",
        },
      ],
    },
    {
      category: "What's Included",
      items: [
        {
          q: 'Do I need to provide content (text & images)?',
          a: "Not necessarily. For Starter and Standard I can help write basic copy and source quality stock images. The Premium package includes professional content writing. If you have your own content, I'll optimise it for the site.",
        },
        {
          q: 'Do you handle hosting and domain setup?',
          a: "Yes. I help set up hosting and connect your domain (or get a new one). I recommend reliable options at ~$10–15/month and handle all the technical setup so your site is live and ready.",
        },
        {
          q: 'Can I update my website myself after launch?',
          a: "Yes. I provide a short recorded training session showing you how to update text, images, and manage bookings. Plus you'll have my support for 30 days post-launch.",
        },
        {
          q: 'Does it include SEO?',
          a: "Basic on-page SEO is included on every package. The <strong>Premium package</strong> includes a full SEO setup — meta data, structured data, sitemap, and Google Analytics wired up from day one.",
        },
        {
          q: 'Do you offer ongoing support or maintenance?',
          a: "Every project includes <strong>30 days of free edits</strong> after go-live, with messages answered within one business day. Extended care plans are available — just ask when we chat.",
        },
      ],
    },
    {
      category: 'Design & Quality',
      items: [
        {
          q: "What if I don't like the design?",
          a: "I show you design mockups before building anything, so you can give feedback early. Revision rounds included: <strong>1 for Starter, 2 for Standard, unlimited for Premium</strong>. I'm not done until you love it.",
        },
        {
          q: 'Will my website work on phones and tablets?',
          a: "Absolutely. Every site is fully responsive and tested on phones, tablets, and desktops. I design mobile-first since most of your visitors will be browsing on their phones.",
        },
        {
          q: 'How many revision rounds do I get?',
          a: '<strong>Starter</strong> — 1 revision round<br><strong>Standard</strong> — 2 revision rounds<br><strong>Premium</strong> — unlimited revisions<br><br>Each round covers copy, layout, images, and any other details.',
          cta: 'Compare packages →',
          href: '#pricing',
        },
      ],
    },
    {
      category: 'Business Type',
      items: [
        {
          q: 'Do you work with my type of business?',
          a: "Most likely yes! We work with dentists, roofers, gyms, restaurants, salons, barbers, HVAC, plumbers, real estate agents, personal trainers, med spas, car detailers, contractors, and more. If you're a local service business, we can help.",
        },
        {
          q: 'Do you build e-commerce or online stores?',
          a: "Yes, e-commerce can be added. This is typically quoted as a custom project — reach out with your requirements and I'll give you a quote within 48 hours.",
        },
        {
          q: 'Can you add booking or appointment features?',
          a: "Yes! Booking and appointment systems are available across packages. Just mention it when you get in touch and I'll factor it into your quote.",
        },
      ],
    },
    {
      category: 'Free Audit',
      items: [
        {
          q: "What's included in the free website audit?",
          a: "A thorough review covering: <strong>mobile-friendliness, loading speed, SEO basics, lead-generation gaps,</strong> and how you compare to competitors. You'll get a clear, jargon-free report you can act on — even if you don't hire us.",
          cta: 'Claim free audit →',
          href: '#contact',
        },
        {
          q: 'Is the audit really free — no strings attached?',
          a: "100% free. No credit card, no obligation. You get the full report regardless of whether you hire us. I just want you to know exactly where your site stands.",
          cta: 'Claim free audit →',
          href: '#contact',
        },
      ],
    },
  ];

  const chatWidget   = document.getElementById('chatWidget');
  const chatPanel    = document.getElementById('chatPanel');
  const chatToggle   = document.getElementById('chatToggle');
  const chatClose    = document.getElementById('chatClose');
  const chatQaList   = document.getElementById('chatQaList');
  const chatHome     = document.getElementById('chatHome');
  const chatAnswerView  = document.getElementById('chatAnswerView');
  const chatAskedQ      = document.getElementById('chatAskedQ');
  const chatAnswerBubble = document.getElementById('chatAnswerBubble');
  const chatCtaBtn      = document.getElementById('chatCtaBtn');
  const chatBackBtn     = document.getElementById('chatBackBtn');

  if (chatWidget) {
    // render Q&A list
    CHAT_QA.forEach(({ category, items }) => {
      const label = document.createElement('div');
      label.className = 'chat-category-label';
      label.textContent = category;
      chatQaList.appendChild(label);

      items.forEach(({ q, a, cta, href }) => {
        const btn = document.createElement('button');
        btn.className = 'chat-q-item';
        btn.innerHTML = `<span>${q}</span><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        btn.addEventListener('click', () => showAnswer(q, a, cta, href));
        chatQaList.appendChild(btn);
      });
    });

    function openChat() {
      chatWidget.classList.add('is-open', 'was-opened');
      chatPanel.removeAttribute('aria-hidden');
      chatToggle.setAttribute('aria-expanded', 'true');
      showHome();
    }

    function closeChat() {
      chatWidget.classList.remove('is-open');
      chatPanel.setAttribute('aria-hidden', 'true');
      chatToggle.setAttribute('aria-expanded', 'false');
    }

    function showHome() {
      chatHome.hidden = false;
      chatAnswerView.hidden = true;
    }

    function showAnswer(q, a, cta, href) {
      chatAskedQ.textContent = q;
      chatAnswerBubble.innerHTML = a;
      chatCtaBtn.textContent = cta || 'Get started →';
      chatCtaBtn.href = href || '#contact';
      chatHome.hidden = true;
      chatAnswerView.hidden = false;
      chatAnswerView.scrollTop = 0;
      document.getElementById('chatBody').scrollTop = 0;
    }

    chatToggle.addEventListener('click', () => chatWidget.classList.contains('is-open') ? closeChat() : openChat());
    chatClose.addEventListener('click', closeChat);
    chatBackBtn.addEventListener('click', showHome);

    // close on outside click
    document.addEventListener('click', (e) => {
      if (chatWidget.classList.contains('is-open') && !chatWidget.contains(e.target)) closeChat();
    });

    // close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chatWidget.classList.contains('is-open')) closeChat();
    });
  }

})();
