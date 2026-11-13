/* emPath website — behaviour
 * 1. Scale the fixed 1440px design canvas to narrower viewports (tablet/desktop only —
 *    below the mobile breakpoint the canvas switches to a real flow layout in CSS).
 * 2. Fire the one-way "Mouse enter → Smart animate" interactions from the Figma prototype
 *    (quote card swing, "Travel we provide to" pills dropping in) the first time each
 *    block scrolls into view — not just on hover, so scrolling itself feels alive.
 *    Hover interactions ("While hovering") are pure CSS :hover.
 * 3. Keep the active nav link in sync with the section in view (desktop nav + mobile menu).
 * 4. Hamburger menu: open/close, backdrop + Escape + link-click to close, body scroll lock.
 * 5. Generic scroll-reveal for every .reveal-up/.reveal-fade section (benefit/feature
 *    cards, headings, team cards, CTA, footer) — fades/slides in once, on first view.
 * 6. Scroll progress bar across the top of the page.
 * 7. "Magnetic" pointer-follow nudge on the two primary CTA buttons (hover-capable
 *    pointers only).
 */
(function () {
  'use strict';

  /* ---------- 1. canvas scaling (desktop/tablet only, see MOBILE_BP) ---------- */
  var root = document.documentElement;
  var MOBILE_BP = 900; // keep in sync with the CSS mobile breakpoint
  function fit() {
    var z = Math.min(1, window.innerWidth / 1440);
    root.style.setProperty('--page-zoom', z.toFixed(4));
  }
  fit();
  window.addEventListener('resize', fit);

  /* ---------- 2. one-way mouse-enter animations ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  function enterOnce(trigger, target, cls) {
    if (!trigger || !target) return;
    var done = false;
    function go() {
      if (done) return;
      done = true;
      target.classList.add(cls);
    }
    if (reduce) { go(); return; }
    // Hovering/tapping before it's scrolled fully into view still plays it early.
    trigger.addEventListener('mouseenter', go, { once: true });
    trigger.addEventListener('touchstart', go, { once: true, passive: true });
    // Primary trigger, for every pointer type: play the first time it's in view.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { go(); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(trigger);
    } else {
      go();
    }
  }

  enterOnce(document.getElementById('quote'), document.getElementById('quoteEr'), 'is-entered');
  var dark = document.getElementById('why-us');
  enterOnce(dark, dark, 'is-entered');

  /* ---------- 3. active nav link (desktop nav + mobile menu, kept in sync) ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[data-nav], .mobile-menu a[data-nav]'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'))
    .map(function (a) { return document.getElementById(a.getAttribute('data-nav')); })
    .filter(Boolean);
  // de-dupe sections (desktop + mobile link lists point at the same ids)
  sections = sections.filter(function (s, i) { return sections.indexOf(s) === i; });
  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) current = e.target.id;
      });
      if (!current) return;
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('data-nav') === current);
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { io2.observe(s); });
  }

  /* ---------- 4. hamburger / mobile menu ---------- */
  var header = document.getElementById('siteHeader');
  var hamburger = document.getElementById('hamburgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var backdrop = document.getElementById('menuBackdrop');

  function closeMenu() {
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    document.body.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function toggleMenu() {
    if (document.body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  }

  if (hamburger && mobileMenu && backdrop && header) {
    hamburger.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    // Resizing past the mobile breakpoint (e.g. rotating a tablet) should
    // never leave the menu stuck open underneath the now-hidden hamburger.
    window.addEventListener('resize', function () {
      if (window.innerWidth > MOBILE_BP) closeMenu();
    });
  }

  /* ---------- 5. generic scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal-up, .reveal-fade'));
  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else if ('IntersectionObserver' in window && revealEls.length) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io3.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io3.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- 6. scroll progress bar ---------- */
  var progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    var tickingProgress = false;
    function updateProgress() {
      tickingProgress = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      progressBar.style.width = pct.toFixed(2) + '%';
    }
    function onScrollProgress() {
      if (!tickingProgress) {
        tickingProgress = true;
        window.requestAnimationFrame(updateProgress);
      }
    }
    updateProgress();
    window.addEventListener('scroll', onScrollProgress, { passive: true });
    window.addEventListener('resize', onScrollProgress);
  }

  /* ---------- 7. magnetic CTA buttons (hover-capable pointers only) ---------- */
  if (canHover && !reduce) {
    var magnets = Array.prototype.slice.call(document.querySelectorAll('.topbar .btn-brand, .cta-btn'));
    magnets.forEach(function (el) {
      var dx = 0, dy = 0, pressed = false;
      function render() {
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (pressed ? 0.94 : 1) + ')';
      }
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
        dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        render();
      });
      el.addEventListener('mouseleave', function () {
        dx = 0; dy = 0; pressed = false;
        el.style.transform = '';
      });
      el.addEventListener('mousedown', function () { pressed = true; render(); });
      el.addEventListener('mouseup', function () { pressed = false; render(); });
      el.style.transition = 'transform 0.2s var(--ease-slow, ease)';
    });
  }
})();
