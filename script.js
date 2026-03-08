/* script.js — cleaned & remade for Why-Us animations
   - Single file: smooth scroll, counters, circuit canvas, tilt, product slider + popup
   - Gallery/popup and FAQ
   - NEW: Why-Us layout enhancer: converts cards into photo+text pairs and adds scroll animations
   - Idempotent: checks flags so appending twice is harmless
*/
(function () {
  if (window.__everestScriptInit) return;
  window.__everestScriptInit = true;

  /* ---------------------------
     Helper utilities
  --------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const create = (tag, attrs = {}) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else e.setAttribute(k, v);
    });
    return e;
  };

  /* ---------------------------
     DOMContentLoaded wrapper
  --------------------------- */
  document.addEventListener("DOMContentLoaded", () => {

    /* ================= Smooth anchor scroll (in-page hashes) ================ */
    (function smoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const href = this.getAttribute('href') || "";
          if (!href.startsWith("#")) return;
          // allow if it's just "#" (top)
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    })();

    /* ================= Animated counters ================= */
    (function countersModule() {
      const counters = $$('h2[data-target]');
      if (!counters.length) return;
      counters.forEach(c => c.textContent = '0');

      const runCounter = (el, target, duration = 1400) => {
        const start = 0;
        let startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          const progress = Math.min((ts - startTime) / duration, 1);
          const val = Math.floor(progress * (target - start) + start);
          el.textContent = val;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      };

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const root = entry.target;
          const kids = root.querySelectorAll('h2[data-target]');
          kids.forEach(k => {
            if (k.dataset._done) return;
            k.dataset._done = '1';
            const t = Math.max(0, parseInt(k.getAttribute('data-target') || 0));
            const dur = Math.min(Math.max(800, t * 3), 2200);
            runCounter(k, t, dur);
          });
          obs.unobserve(root);
        });
      }, { threshold: 0.35 });

      // Observe each .stats or .why-stats region
      const roots = $$('.why-stats, .expanded-stats, .stats');
      roots.forEach(r => observer.observe(r));
      // fallback if none found
      if (!roots.length) {
        counters.forEach(c => runCounter(c, parseInt(c.getAttribute('data-target') || 0), 1200));
      }
    })();

    /* ================= Circuit canvas background ================= */
    (function circuitCanvas() {
      const canvas = $('#circuit');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let lines = [], raf = null, dpr = Math.max(1, window.devicePixelRatio || 1);

      function resize() {
        dpr = Math.max(1, window.devicePixelRatio || 1);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = 24 + Math.round(w / 300);
        lines = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 40 + Math.random() * 140,
          speed: 0.2 + Math.random() * 1.2,
          alpha: 0.12 + Math.random() * 0.4
        }));
      }

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1;
        const w = window.innerWidth, h = window.innerHeight;
        lines.forEach(l => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,119,255,${l.alpha})`;
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(l.x + l.len, l.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,119,255,${l.alpha * 0.6})`;
          ctx.moveTo(l.x + l.len / 3, l.y - 3);
          ctx.lineTo(l.x + l.len / 3, l.y + 3);
          ctx.stroke();

          l.x += l.speed;
          if (l.x - l.len > w) {
            l.x = -l.len;
            l.y = Math.random() * h;
          }
        });
        raf = requestAnimationFrame(draw);
      }

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resize();
          draw();
        }, 120);
      });

      resize();
      draw();
    })();

    /* ================= Apple-style tilt on .card elements ================= */
    (function cardTilt() {
      const cards = $$('.card');
      if (!cards.length) return;
      cards.forEach(card => {
        let rafId = null;
        function onMove(e) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const rx = - (y - cy) / 12;
          const ry = (x - cx) / 12;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            card.style.transition = 'transform 120ms linear';
          });
        }
        function onLeave() {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            card.style.transform = '';
            card.style.transition = 'transform 300ms ease';
          });
        }
        on(card, 'mousemove', onMove);
        on(card, 'mouseleave', onLeave);
        // keyboard focus subtle scale
        on(card, 'focus', () => card.style.transform = 'scale(1.02)');
        on(card, 'blur', () => card.style.transform = '');
      });
    })();

    /* ================= Products slider + popup (keeps original behavior) ================= */
    (function productsSlider() {
      const productsSection = $('#products');
      if (!productsSection) return;
      const track = productsSection.querySelector('.track');
      if (!track) return;

      if (!track.dataset.duplicated) {
        const items = Array.from(track.children);
        items.forEach(item => track.appendChild(item.cloneNode(true)));
        track.dataset.duplicated = 'true';
      }

      track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
      track.addEventListener('mouseleave', () => track.style.animationPlayState = '');

      // popup create or reuse
      let popup = $('#popup');
      if (!popup) {
        popup = create('div', { class: 'product-popup', id: 'popup' });
        popup.innerHTML = `
          <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div class="popup-close" id="popup-close" title="Close">✕</div>
            <img id="popup-img" src="" alt="">
            <h3 id="popup-title"></h3>
            <p id="popup-text"></p>
          </div>
        `;
        document.body.appendChild(popup);
      }

      const popupContent = popup.querySelector('.popup-content');
      const popupImg = popup.querySelector('#popup-img');
      const popupTitle = popup.querySelector('#popup-title');
      const popupText = popup.querySelector('#popup-text');
      const popupClose = popup.querySelector('#popup-close');

      function openPopup(src, title, text) {
        popupImg.src = src || '';
        popupImg.alt = title || 'Product';
        popupTitle.innerText = title || '';
        popupText.innerText = text || '';
        popup.classList.add('active');
        track.style.animationPlayState = 'paused';
        if (popupClose) popupClose.focus();
      }
      function closePopup() {
        popup.classList.remove('active');
        track.style.animationPlayState = '';
      }

      const attachListeners = () => {
        track.querySelectorAll('.product-card').forEach(card => {
          if (card.dataset._listened) return;
          card.addEventListener('click', () => {
            const imgEl = card.querySelector('img');
            const titleEl = card.querySelector('h3');
            const descEl = card.querySelector('p');
            const src = imgEl ? (imgEl.getAttribute('data-full') || imgEl.src) : '';
            const title = titleEl ? titleEl.innerText : '';
            const text = descEl ? descEl.innerText : '';
            openPopup(src, title, text);
          });
          card.dataset._listened = '1';
        });
      };
      attachListeners();
      new MutationObserver(attachListeners).observe(track, { childList: true, subtree: true });

      on(popupClose, 'click', (e) => { e.stopPropagation(); closePopup(); });
      popup.addEventListener('click', e => { if (!popupContent.contains(e.target)) closePopup(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && popup.classList.contains('active')) closePopup(); });
    })();

    /* ================= Gallery (uses #popup if present) ================= */
    (function galleryPopup() {
      const galleryItems = $$('.gallery-item');
      if (!galleryItems.length) return;
      // ensure popup exists (some pages have one)
      let popup = $('#popup');
      if (!popup) {
        popup = create('div', { class: 'product-popup', id: 'popup' });
        popup.innerHTML = `
          <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div class="popup-close" id="popup-close" title="Close">✕</div>
            <img id="popup-img" src="" alt="">
            <h3 id="popup-title"></h3>
            <p id="popup-text"></p>
          </div>
        `;
        document.body.appendChild(popup);
      }
      const popupImg = popup.querySelector('#popup-img');
      const popupTitle = popup.querySelector('#popup-title');
      const popupText = popup.querySelector('#popup-text');
      const popupClose = popup.querySelector('#popup-close');

      function open(src, title, text) {
        popupImg.src = src || '';
        popupTitle.textContent = title || '';
        popupText.textContent = text || '';
        popup.style.display = 'block';
        popup.setAttribute('aria-hidden', 'false');
      }
      function close() { popup.style.display = 'none'; popup.setAttribute('aria-hidden', 'true'); }

      document.addEventListener('click', (e) => {
        const g = e.target.closest('.gallery-item');
        if (g) {
          const src = g.dataset.img || g.querySelector('img')?.src || '';
          const caption = g.querySelector('.caption')?.textContent || '';
          open(src, caption, caption);
        }
        if (e.target.closest('#popup .popup-close') || e.target.id === 'popup-close') close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter') {
          const f = document.activeElement;
          if (f && f.classList && f.classList.contains('gallery-item')) {
            const src = f.dataset.img || f.querySelector('img')?.src || '';
            const caption = f.querySelector('.caption')?.textContent || '';
            open(src, caption, caption);
          }
        }
      });
      const popupRoot = $('#popup');
      if (popupRoot) popupRoot.addEventListener('click', ev => { if (ev.target === popupRoot) close(); });
      galleryItems.forEach(g => { if (!g.hasAttribute('tabindex')) g.tabIndex = 0; g.setAttribute('role', 'button'); });
    })();

    /* ================= FAQ accordion ================= */
    (function faqAccordion() {
      const faqBtns = $$('.faq-q');
      if (!faqBtns.length) return;
      faqBtns.forEach(btn => {
        const panel = btn.nextElementSibling;
        if (!panel) return;
        panel.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', open ? 'false' : 'true');
          panel.style.display = open ? 'none' : 'block';
        });
      });
    })();

    /* ================= Demo buttons (reuse popup) ================= */
    (function demoButtons() {
      document.addEventListener('click', e => {
        const btn = e.target.closest('.demo-btn');
        if (!btn) return;
        const popup = $('#popup');
        if (!popup) return;
        const img = popup.querySelector('#popup-img');
        const h = popup.querySelector('#popup-title');
        const p = popup.querySelector('#popup-text');
        img.src = 'EVEREST-PLATINUM.jpg';
        img.alt = 'Everest Monitoring Demo';
        h.textContent = 'Everest Monitoring — Demo';
        p.textContent = 'Demo: Operator verifies events using short camera clips and sensor correlation, then escalates to responders when required.';
        popup.style.display = 'block';
        popup.setAttribute('aria-hidden', 'false');
      });
    })();

    /* ================= NEW: Why-Us Layout enhancer + scroll animations =================
       Goals:
         - Make feature cards read as image + paragraph (photo → para → text animations)
         - Normalize image heights and object-fit cover for consistency
         - Animate image sliding in from left, text fading up from right with stagger
         - Keep markup safe: only touch elements inside .why-us, .feature-deep, .hero-why, .case-cards
    ==============================================================================*/
    (function whyUsEnhancer() {
      const whyRoot = document.querySelector('.why-us, .full-why');
      if (!whyRoot) return;

      // utility: ensure img sizing consistent
      function normalizeImages(root) {
        $$('img', root).forEach(img => {
          // avoid changing product cards images drastically
          if (img.closest('.product-card')) return;
          img.style.width = '100%';
          img.style.height = img.dataset.fixHeight || '220px';
          img.style.objectFit = 'cover';
          img.style.display = 'block';
          img.style.borderRadius = img.style.borderRadius || '8px';
        });
      }

      // convert .feature-deep .card -> media/text layout
      function convertFeatureCards() {
        const featureContainers = $$('.feature-deep .card', whyRoot);
        featureContainers.forEach((card, idx) => {
          // if already converted, skip
          if (card.dataset.converted) return;
          const img = card.querySelector('img');
          // create wrappers
          const media = create('div', { class: 'card-media' });
          const content = create('div', { class: 'card-content' });

          // move image into media
          if (img) {
            media.appendChild(img);
          } else {
            // placeholder if no image
            const ph = create('div', { class: 'img-placeholder' });
            ph.style.height = '220px';
            ph.style.background = '#e9eefb';
            media.appendChild(ph);
          }

          // move heading & paragraphs into content
          const childrenToMove = [];
          Array.from(card.children).forEach(ch => {
            if (ch.tagName.toLowerCase() === 'img') return; // already moved
            // keep caption, h3, p, small
            childrenToMove.push(ch);
          });
          childrenToMove.forEach(ch => content.appendChild(ch));

          // clear card and re-append as two-column
          card.innerHTML = '';
          card.appendChild(media);
          card.appendChild(content);

          // set classes for animation
          media.classList.add('animate-media');
          content.classList.add('animate-text');

          // mark converted
          card.dataset.converted = '1';
        });
      }

      // convert hero card (big photo + text)
      function convertHeroCard() {
        const hero = $('.hero-why', whyRoot);
        if (!hero) return;
        // For hero we already had hero-card + hero-side; ensure the hero-card image normalized
        const heroCard = $('.hero-card', hero);
        if (!heroCard) return;
        const img = heroCard.querySelector('img');
        if (img) {
          img.style.width = '100%';
          img.style.height = '320px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '10px';
          img.classList.add('animate-media');
        }
        const text = heroCard.querySelector('.hero-card-text');
        if (text) text.classList.add('animate-text');
      }

      // convert case studies (make image left text right)
      function convertCases() {
        const caseCards = $$('.case-cards .case', whyRoot);
        caseCards.forEach(card => {
          if (card.dataset.caseConverted) return;
          const img = card.querySelector('img');
          const media = create('div', { class: 'case-media' });
          const content = create('div', { class: 'case-content' });
          if (img) media.appendChild(img);
          // move rest children into content
          Array.from(card.children).forEach(ch => {
            if (ch.tagName.toLowerCase() !== 'img') content.appendChild(ch);
          });
          card.innerHTML = '';
          card.appendChild(media);
          card.appendChild(content);
          media.classList.add('animate-media');
          content.classList.add('animate-text');
          card.dataset.caseConverted = '1';
        });
      }

      // make gallery grid images smaller so page isn't too long
      function compactGallery() {
        const gallery = $('.why-gallery .gallery-grid', whyRoot) || $('.gallery-grid', whyRoot);
        if (!gallery) return;
        $$('img', gallery).forEach(img => {
          img.style.height = '140px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '8px';
        });
      }

      // animation observer: reveal media then text with stagger
      function setupScrollAnimations() {
        const options = { threshold: 0.18 };
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const root = entry.target;
            const media = root.querySelector('.animate-media');
            const text = root.querySelector('.animate-text');

            // animate media: slide from left, fade in
            if (media && !media.dataset._seen) {
              media.style.transition = 'transform 700ms cubic-bezier(.2,.9,.2,1), opacity 700ms ease';
              media.style.transform = 'translateX(-24px)';
              media.style.opacity = '0';
              // trigger in next frame
              requestAnimationFrame(() => {
                media.style.transform = 'translateX(0)';
                media.style.opacity = '1';
              });
              media.dataset._seen = '1';
            }
            // animate text: fade-up with small delay
            if (text && !text.dataset._seen) {
              text.style.transition = 'transform 700ms cubic-bezier(.2,.9,.2,1) 120ms, opacity 700ms ease 120ms';
              text.style.transform = 'translateY(18px)';
              text.style.opacity = '0';
              requestAnimationFrame(() => {
                text.style.transform = 'translateY(0)';
                text.style.opacity = '1';
              });
              text.dataset._seen = '1';
            }
            obs.unobserve(root);
          });
        }, options);

        // targets to observe: each converted card and hero/case blocks
        const targets = [
          ...$$('.feature-deep .card', whyRoot),
          ...$$('.feature-cards .card', whyRoot),
          ...$$('.hero-card', whyRoot),
          ...$$('.case-cards .case', whyRoot),
          ...$$('.why-team .card', whyRoot)
        ];
        targets.forEach(t => {
          // set initial hidden states for children
          const m = t.querySelector('.animate-media');
          const txt = t.querySelector('.animate-text');
          if (m) { m.style.opacity = m.style.opacity || '0'; }
          if (txt) { txt.style.opacity = txt.style.opacity || '0'; }
          io.observe(t);
        });
      }

      // small helper to make cards keyboard accessible & add aria roles
      function enhanceAccessibility() {
        $$('.card', whyRoot).forEach(c => {
          if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
          if (!c.getAttribute('role')) c.setAttribute('role', 'group');
        });
      }

      // run transforms
      normalizeImages(whyRoot);
      convertFeatureCards();
      convertHeroCard();
      convertCases();
      compactGallery();
      enhanceAccessibility();
      setupScrollAnimations();

      // Responsive adjustments: on small screens revert to stacked single column by touching inline styles
      const mql = window.matchMedia('(max-width: 800px)');
      function handleMqChange() {
        const stacked = mql.matches;
        // when stacked, make media full width and text block under it
        $$('.card-media, .case-media', whyRoot).forEach(m => {
          m.style.width = stacked ? '100%' : '';
          m.style.display = stacked ? 'block' : '';
        });
        $$('.card-content, .case-content', whyRoot).forEach(c => {
          c.style.width = stacked ? '100%' : '';
        });
      }
      mql.addEventListener ? mql.addEventListener('change', handleMqChange) : mql.addListener(handleMqChange);
      handleMqChange();

    })(); // whyUsEnhancer

    // small final: prevent accidental form submissions on demo buttons if inside forms
    document.querySelectorAll('button').forEach(b => {
      if (b.type === undefined) b.type = 'button';
    });

  }); // DOMContentLoaded end

})(); // init IIFE end
