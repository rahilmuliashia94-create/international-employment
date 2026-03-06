/* script.js
 - Smooth anchor scroll (only for same-page # links)
 - Animated counters (triggered when .stats is visible)
 - Responsive canvas "circuit" animation
 - Apple-style 3D tilt for .card elements
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

}); // DOMContentLoaded
