/* emPath website — behaviour
 * 1. Scale the fixed 1440px design canvas to narrower viewports (tablet/desktop only —
 *    below the mobile breakpoint the canvas switches to a real flow layout in CSS).
 * 2. Fire the one-way "Mouse enter → Smart animate" interactions from the Figma prototype
 *    (quote card swing, "Travel we provide to" pills dropping in).
 *    Hover interactions ("While hovering") are pure CSS :hover.
 * 3. Keep the active nav link in sync with the section in view (desktop nav + mobile menu).
 * 4. Hamburger menu: open/close, backdrop + Escape + link-click to close, body scroll lock.
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
    trigger.addEventListener('mouseenter', go, { once: true });
    trigger.addEventListener('touchstart', go, { once: true, passive: true });
    // Devices without a pointer that can hover: play when the block is in view.
    if (!canHover && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { go(); io.disconnect(); }
        });
      }, { threshold: 0.55 });
      io.observe(trigger);
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
})();
