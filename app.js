/* ============================================================
   FIGHTERS FIRST — shared interactions
   - mobile nav (hamburger morph + overlay)
   - scroll reveals (IntersectionObserver, no scroll listeners)
   - stat count-up
   - featured-card "data line" spawn animation
   - fighters.html bio viewer (URL-param + state swap, no reload)
   - contact form (demo, console.log + success message)
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mobile nav ---------------- */
  (function nav() {
    var burger = document.querySelector('.nav__burger');
    var overlay = document.querySelector('.nav__overlay');
    if (!burger) return;

    function close() {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (overlay) {
      overlay.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', close);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /* ---------------- Count-up ---------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) { return; }
    var suffix = el.getAttribute('data-suffix') || '';
    var isInt = target % 1 === 0;
    if (reduceMotion) {
      el.textContent = (isInt ? target : target.toFixed(1)) + suffix;
      return;
    }
    var dur = 800, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      var val = target * eased;
      el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = (isInt ? target : target.toFixed(1)) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------------- Data-line spawn (featured cards) ----------------
     types text out character-by-character when card enters viewport */
  function spawnDataLine(el) {
    var full = el.getAttribute('data-line') || el.textContent;
    if (reduceMotion) { el.textContent = full; return; }
    el.textContent = '';
    var i = 0;
    (function tick() {
      el.textContent = full.slice(0, i);
      i++;
      if (i <= full.length) setTimeout(tick, 24);
      else el.textContent = full;
    })();
  }

  /* ---------------- Scroll reveals ---------------- */
  (function reveals() {
    var els = document.querySelectorAll('.reveal, [data-count], .fcard__data');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('in');
        if (el.hasAttribute('data-count')) countUp(el);
        if (el.classList.contains('fcard__data')) el.textContent = el.getAttribute('data-line') || el.textContent;
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        if (el.hasAttribute('data-count')) countUp(el);
        if (el.classList.contains('fcard__data')) spawnDataLine(el);
        io.unobserve(el);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ============================================================
     FIGHTERS PAGE — bio viewer
     ============================================================ */
  var stage = document.querySelector('[data-fighter-stage]');
  if (stage && window.FIGHTERS) {
    var fighters = window.FIGHTERS;
    var selector = document.querySelector('[data-selector]');

    function imgOrPlaceholder(f) {
      if (f.photo) {
        return '<img src="' + f.photo + '" alt="' + f.first + ' ' + f.last +
          '" loading="lazy" decoding="async">';
      }
      return '<div class="ph-fill"><span class="ini">' + f.initials +
        '</span><span class="tag">Photo Pending</span></div>';
    }

    function detail(dt, dd) {
      return '<div class="detail"><dt>' + dt + '</dt><dd>' + dd + '</dd></div>';
    }

    // numeric records animate; unverified placeholders show a dash (no fabrication)
    function statCell(val, label) {
      var n = Number(val);
      var inner = (val !== '' && val != null && !isNaN(n))
        ? '<span class="num" data-count="' + n + '">0</span>'
        : '<span class="num">&mdash;</span>';
      return '<div class="stat">' + inner + '<span class="lbl">' + label + '</span></div>';
    }

    function renderStage(f) {
      var record = f.record; // {w,l,d,ko}
      var html =
        '<div class="stage__media">' + imgOrPlaceholder(f) + '</div>' +
        '<div class="stage__info">' +
          '<p class="stage__first">' + f.first + '</p>' +
          '<h2 class="stage__last">' + f.last + '</h2>' +
          (f.nick ? '<p class="stage__nick">&ldquo;' + f.nick + '&rdquo;</p>' : '') +
          '<div class="divider"></div>' +
          '<div class="stat-grid">' +
            statCell(record.w, 'Wins') +
            statCell(record.l, 'Losses') +
            statCell(record.d, 'Draws') +
            statCell(record.ko, 'KOs') +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="measure-row">' +
            '<div class="measure"><span class="num">' + f.weight + '</span><span class="lbl">Weight</span></div>' +
            '<div class="measure"><span class="num">' + f.height + '</span><span class="lbl">Height</span></div>' +
            '<div class="measure"><span class="num">' + f.reach + '</span><span class="lbl">Reach</span></div>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="detail-grid">' +
            detail('Born', f.born) +
            detail('Country', f.country) +
            detail('Born In', f.bornIn) +
            detail('Trains In', f.trainsIn) +
            detail('Stance', f.stance) +
            detail('Rounds Boxed', f.rounds) +
            detail('KO Percentage', f.koPct) +
            detail('Status', f.status) +
          '</div>' +
        '</div>';

      function paint() {
        stage.innerHTML = html;
        // animate the stat numbers
        stage.querySelectorAll('[data-count]').forEach(countUp);
      }

      if (reduceMotion) {
        paint();
      } else {
        stage.classList.add('swapping');
        setTimeout(function () {
          paint();
          // force reflow then fade in
          void stage.offsetWidth;
          stage.classList.remove('swapping');
        }, 300);
      }
    }

    function setActive(id) {
      if (!selector) return;
      selector.querySelectorAll('.sel-item').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-id') === id);
        if (b.getAttribute('data-id') === id) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    }

    function select(id, push) {
      var f = fighters.find(function (x) { return x.id === id; });
      if (!f) f = fighters[0];
      renderStage(f);
      setActive(f.id);
      if (push && window.history && history.replaceState) {
        history.replaceState(null, '', 'fighters.html?fighter=' + f.id);
      }
    }

    // build selector list
    if (selector) {
      var listHtml = '<p class="selector__head">The Roster — ' + fighters.length + ' Fighters</p>';
      fighters.forEach(function (f) {
        var thumb = f.photo
          ? '<img class="sel-thumb" src="' + f.photo + '" alt="" loading="lazy" decoding="async">'
          : '<span class="sel-thumb ph"><span class="ini" style="font-size:1rem;color:rgba(239,251,198,.3)">' + f.initials + '</span></span>';
        listHtml +=
          '<button class="sel-item" data-id="' + f.id + '" type="button">' +
            thumb +
            '<span class="sel-meta">' +
              '<span class="nm">' + f.first + ' ' + f.last + '</span>' +
              '<span class="rec">' + f.recLine + '</span>' +
            '</span>' +
          '</button>';
      });
      selector.innerHTML = listHtml;
      selector.querySelectorAll('.sel-item').forEach(function (b) {
        b.addEventListener('click', function () { select(b.getAttribute('data-id'), true); });
      });
    }

    // initial selection from ?fighter=
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('fighter');
    var startId = (initial && fighters.some(function (f) { return f.id === initial; }))
      ? initial : fighters[0].id;
    select(startId, false);
  }

  /* ============================================================
     CONTACT FORM (demo)
     ============================================================ */
  var form = document.querySelector('[data-signup-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      // Demo only — no backend. Log the payload for inspection.
      console.log('[Fighters First] Get Signed submission (demo):', data);
      var success = form.querySelector('.form__success');
      if (success) {
        success.classList.add('show');
        success.setAttribute('role', 'status');
      }
      form.querySelector('button[type="submit"]').textContent = 'Submitted ✓';
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
