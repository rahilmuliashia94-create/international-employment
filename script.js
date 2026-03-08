/* script.js
 - Smooth anchor scroll (only for same-page # links)
 - Animated counters (triggered when .stats is visible)
 - Responsive canvas "circuit" animation
 - Apple-style 3D tilt for .card elements
 - Product slider duplication for seamless rightward infinite scroll
 - Product click popup (centered preview) with escape/click-outside/close button
*/

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------
     Smooth scroll (only for #hash links)
     ------------------------- */
  document.querySelectorAll('nav a').forEach(anchor => {
    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('#')) {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });


  /* -------------------------
     Animated counters
     - Triggers once when .stats enters viewport
     - Uses requestAnimationFrame for smooth timing
     ------------------------- */
  const statsSection = document.querySelector('.stats');
  const counters = document.querySelectorAll('.stat h2');

  // ensure counters show 0 initially
  counters.forEach(c => c.innerText = '0');

  function animateCounterEl(el, endVal, duration = 1400) {
    const startVal = 0;
    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const value = Math.floor(progress * (endVal - startVal) + startVal);
      el.innerText = value;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.innerText = endVal; // ensure exact final
      }
    }
    requestAnimationFrame(step);
  }

  let countersStarted = false;

  if (statsSection && counters.length) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target')) || 0;
            // duration proportional to target magnitude (clamped)
            const duration = Math.min(Math.max(800, target * 3), 2200);
            animateCounterEl(counter, target, duration);
          });
          observer.unobserve(statsSection);
        }
      });
    }, { threshold: 0.45 });
    obs.observe(statsSection);
  } else {
    // fallback: if .stats missing, animate immediately
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target')) || 0;
      animateCounterEl(counter, target, 1200);
    });
  }


  /* -------------------------
     Responsive circuit canvas
     - Handles DPR for crisp lines
     - Recreates lines on resize
     ------------------------- */
  (function setupCircuit() {
    const canvas = document.getElementById('circuit');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lines = [];
    let rafId = null;

    function createLines(count = 30) {
      lines = [];
      for (let i = 0; i < count; i++) {
        lines.push({
          x: Math.random() * canvas.width / dpr,
          y: Math.random() * canvas.height / dpr,
          len: 40 + Math.random() * 140,
          speed: 0.2 + Math.random() * 1.2,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    }

    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels
      createLines(28 + Math.round(w / 300)); // more lines on wide screens
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;
      lines.forEach(l => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,119,255,${l.alpha})`;
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.len, l.y);
        ctx.stroke();

        // small vertical connectors for "circuit" feel
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,119,255,${l.alpha * 0.6})`;
        ctx.moveTo(l.x + l.len / 3, l.y - 3);
        ctx.lineTo(l.x + l.len / 3, l.y + 3);
        ctx.stroke();

        l.x += l.speed;
        if (l.x - l.len > window.innerWidth) {
          l.x = -l.len;
          l.y = Math.random() * window.innerHeight;
        }
      });

      rafId = requestAnimationFrame(draw);
    }

    // handle resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        draw();
      }, 120);
    });

    // init
    resize();
    draw();
  })();


  /* -------------------------
     Apple-style 3D tilt for cards
     - Uses mouse position inside element
     - Smoothly resets on mouseleave
     ------------------------- */
  (function setupTilt() {
    const cards = document.querySelectorAll('.card');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
      // subtle inner shadow / depth via CSS transform
      let requestId = null;

      function onMove(e) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // rotate range small and subtle
        const rotateX = -(y - centerY) / 12;
        const rotateY = (x - centerX) / 12;

        // apply transform (use rAF to avoid layout thrash)
        if (requestId) cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(() => {
          card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
          // enhance shadow a bit using boxShadow (optional: CSS handles most)
        });
      }

      function onLeave() {
        if (requestId) cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(() => {
          card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);

      // make sure keyboard focus also gets subtle effect (nice for accessibility)
      card.addEventListener('focus', () => { card.style.transform = 'scale(1.02)'; });
      card.addEventListener('blur', () => { card.style.transform = 'scale(1)'; });
    });
  })();


  /* -------------------------
     Product slider duplication + popup
     - duplicates track children for continuous visual loop
     - pause on hover
     - product click opens centered popup (created if missing)
     ------------------------- */
  (function setupProducts() {
    const productsSection = document.getElementById('products');
    if (!productsSection) return;

    const track = productsSection.querySelector('.track');
    if (!track) return;

    // 1) Duplicate children to create a seamless continuous row (if not already duplicated)
    // We check if we've already duplicated (data-duplicated flag).
    if (!track.dataset.duplicated) {
      const items = Array.from(track.children);
      items.forEach(item => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
      });
      track.dataset.duplicated = "true";
    }

    // 2) Pause-on-hover for accessibility & better UX
    track.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = '';
    });

    // 3) Create popup markup if missing
    let popup = document.getElementById('popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.className = 'product-popup';
      popup.id = 'popup';
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

    // helper open/close functions
    function openPopup(src, title, text) {
      popupImg.src = src || '';
      popupImg.alt = title || 'Product';
      popupTitle.innerText = title || '';
      popupText.innerText = text || '';
      popup.classList.add('active');

      // pause slider while popup open
      track.style.animationPlayState = 'paused';

      // trap focus briefly (simple): move focus to close button
      if (popupClose) popupClose.focus();
    }

    function closePopup() {
      popup.classList.remove('active');
      // resume slider
      track.style.animationPlayState = '';
      // clear img src to stop audio-heavy files or free memory
      // leave it, optional
    }

    // 4) Attach click handler to product cards (including cloned ones)
    // We look for elements with .product-card inside the track
    function attachProductListeners() {
      const productCards = track.querySelectorAll('.product-card');
      productCards.forEach(card => {
        // avoid adding multiple listeners
        if (card.dataset.listenerAttached) return;

        card.addEventListener('click', (e) => {
          // find title, description, image inside the card
          const imgEl = card.querySelector('img');
          const titleEl = card.querySelector('h3');
          const descEl = card.querySelector('p');
          const src = imgEl ? (imgEl.getAttribute('data-full') || imgEl.src) : '';
          const title = titleEl ? titleEl.innerText : '';
          const text = descEl ? descEl.innerText : '';

          openPopup(src, title, text);
        });

        card.dataset.listenerAttached = '1';
      });
    }

    attachProductListeners();

    // If new product cards are added later, observe and attach listeners
    const mo = new MutationObserver(() => {
      attachProductListeners();
    });
    mo.observe(track, { childList: true, subtree: true });

    // 5) Close popup interactions
    // close button
    if (popupClose) {
      popupClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closePopup();
      });
    }

    // click outside content closes
    popup.addEventListener('click', (e) => {
      if (!popupContent.contains(e.target)) {
        closePopup();
      }
    });

    // Esc key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });

    // Accessibility: prevent propagation when clicking inside content
    popupContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 6) Nice: pause slider while user focuses anywhere inside popup (keyboard)
    popup.addEventListener('focusin', () => {
      track.style.animationPlayState = 'paused';
    });
    popup.addEventListener('focusout', () => {
      if (!popup.classList.contains('active')) {
        track.style.animationPlayState = '';
      }
    });

    // 7) Optional: if CSS animation is not smooth across widths, we can programmatically set
    // animation-duration based on content width (kept simple here). If you want more refined speed
    // we can measure scroll width and adjust duration. For now we leave CSS durations.
  })();

}); // DOMContentLoaded
// ===== why-us page interactivity (append to script.js) =====
(function(){
  if (window.__everestWhyUsPageInit) return;
  window.__everestWhyUsPageInit = true;

  /* 1) Counters (works for .why-stats, .stats, expanded-stats) */
  (function runCounters(){
    const roots = document.querySelectorAll('.why-stats, .expanded-stats, .stats');
    roots.forEach(root => {
      const items = root.querySelectorAll('h2[data-target]');
      if (!items.length) return;
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          items.forEach(el => {
            if (el.dataset._done) return;
            const target = Math.max(0, +el.dataset.target || 0);
            const speed = 220;
            const step = Math.max(1, Math.floor(target / speed));
            let n = 0;
            const tick = () => {
              n += step;
              if (n >= target) {
                el.textContent = target;
                el.dataset._done = '1';
              } else {
                el.textContent = n;
                requestAnimationFrame(tick);
              }
            };
            tick();
          });
          obs.disconnect();
        });
      }, {threshold: 0.35});
      obs.observe(root);
    });
  })();

  /* 2) Gallery: open #popup with image and caption */
  (function gallery(){
    function openPopup(src, title, text) {
      const popup = document.getElementById('popup');
      if (!popup) return;
      const img = popup.querySelector('#popup-img');
      const h = popup.querySelector('#popup-title');
      const p = popup.querySelector('#popup-text');
      img.src = src || '';
      img.alt = title || '';
      h.textContent = title || '';
      p.textContent = text || '';
      popup.style.display = 'block';
      popup.setAttribute('aria-hidden', 'false');
    }
    function closePopup() {
      const popup = document.getElementById('popup');
      if (!popup) return;
      popup.style.display = 'none';
      popup.setAttribute('aria-hidden', 'true');
    }

    document.addEventListener('click', function(e){
      const g = e.target.closest('.gallery-item');
      if (g) {
        const src = g.dataset.img || g.querySelector('img')?.src || '';
        const caption = g.querySelector('.caption')?.textContent || '';
        openPopup(src, caption, caption);
      }
      if (e.target.closest('#popup .popup-close') || e.target.id === 'popup-close') {
        closePopup();
      }
    });

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') {
        const popup = document.getElementById('popup');
        if (popup && popup.style.display === 'block') closePopup();
      }
      if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (focused && focused.classList && focused.classList.contains('gallery-item')) {
          const src = focused.dataset.img || focused.querySelector('img')?.src || '';
          const caption = focused.querySelector('.caption')?.textContent || '';
          openPopup(src, caption, caption);
        }
      }
    });

    // close when user clicks outside content
    const popupRoot = document.getElementById('popup');
    if (popupRoot) {
      popupRoot.addEventListener('click', function(ev){
        if (ev.target === popupRoot) closePopup();
      });
    }

    // make gallery items keyboard friendly
    document.querySelectorAll('.gallery-item').forEach(g => {
      if (!g.hasAttribute('tabindex')) g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
    });
  })();

  /* 3) FAQ accordion */
  (function faq(){
    document.querySelectorAll('.faq-q').forEach(btn => {
      const panel = btn.nextElementSibling;
      if (panel) panel.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        if (panel) panel.style.display = isOpen ? 'none' : 'block';
      });
    });
  })();

  /* 4) Hover/tap reveal logic for feature cards (if you used reveal blocks)
     If .reveal exists inside .card, we toggle aria-hidden on hover/focus/click.
  */
  (function reveals(){
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const reveal = card.querySelector('.reveal, .card-reveal');
      if (!reveal) return;
      reveal.setAttribute('aria-hidden', 'true');

      card.addEventListener('mouseenter', () => {
        reveal.setAttribute('aria-hidden', 'false');
      });
      card.addEventListener('mouseleave', () => {
        reveal.setAttribute('aria-hidden', 'true');
      });

      card.addEventListener('focusin', () => reveal.setAttribute('aria-hidden', 'false'));
      card.addEventListener('focusout', () => reveal.setAttribute('aria-hidden', 'true'));

      // mobile/tap toggle (ignore clicks on links/buttons inside)
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const open = reveal.getAttribute('aria-hidden') === 'false';
        reveal.setAttribute('aria-hidden', open ? 'true' : 'false');
      });
    });
  })();

  /* 5) Demo buttons: reuse popup for demo text */
  (function demoBtns(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.demo-btn');
      if (!btn) return;
      const popup = document.getElementById('popup');
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

})();
