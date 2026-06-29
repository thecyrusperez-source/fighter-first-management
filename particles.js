/* ============================================================
   FIGHTERS FIRST — persistent spark backdrop
   Canvas particle system. Subtle #8D2001 embers drifting over the
   #010B14 studio. Slow drift, occasional flare. Dimension, not chaos.

   Usage: <canvas id="spark-canvas"></canvas> + <script src="particles.js">
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('spark-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var ACCENT = { r: 141, g: 32, b: 1 };       // #8D2001
  var EMBER  = { r: 197, g: 53, b: 12 };       // brighter flare tone

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var particles = [];
  var running = true;
  var rafId = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function spawn(initial) {
    return {
      x: rand(0, W),
      y: initial ? rand(0, H) : H + rand(0, 60),
      r: rand(0.6, 2.2),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.45, -0.12),          // slow upward drift
      baseAlpha: rand(0.18, 0.42),     // low opacity 0.3-0.5 range
      alpha: 0,
      twinkle: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.006, 0.02),
      flare: 0,                        // 0..1 active flare amount
      flareCooldown: rand(120, 900)    // frames until eligible to flare
    };
  }

  function targetCount() {
    var area = W * H;
    // density tuned low; fewer particles on small/mobile screens for perf
    var n = Math.round(area / 22000);
    return Math.max(26, Math.min(n, W < 600 ? 46 : 120));
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var want = targetCount();
    if (particles.length === 0) {
      for (var i = 0; i < want; i++) particles.push(spawn(true));
    } else if (want > particles.length) {
      while (particles.length < want) particles.push(spawn(true));
    } else if (want < particles.length) {
      particles.length = want;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // motion
      p.x += p.vx;
      p.y += p.vy;
      p.twinkle += p.twinkleSpeed;

      // gentle horizontal sway
      p.x += Math.sin(p.twinkle) * 0.12;

      // flare lifecycle: occasional brief glow
      if (p.flare > 0) {
        p.flare -= 0.012;
        if (p.flare < 0) p.flare = 0;
      } else {
        p.flareCooldown -= 1;
        if (p.flareCooldown <= 0 && Math.random() < 0.004) {
          p.flare = 1;
          p.flareCooldown = rand(300, 1100);
        }
      }

      // recycle off-screen
      if (p.y < -20 || p.x < -40 || p.x > W + 40) {
        particles[i] = spawn(false);
        continue;
      }

      // twinkle alpha around base
      var tw = 0.65 + 0.35 * Math.sin(p.twinkle);
      var a = p.baseAlpha * tw;

      var col = ACCENT;
      var radius = p.r;

      if (p.flare > 0) {
        var f = p.flare;
        a = Math.min(0.85, a + f * 0.5);
        radius = p.r * (1 + f * 1.6);
        col = EMBER;
        // glow only on the few flaring particles (shadowBlur is costly)
        ctx.shadowBlur = 14 * f;
        ctx.shadowColor = 'rgba(197,53,12,' + (0.6 * f).toFixed(3) + ')';
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + a.toFixed(3) + ')';
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!running) return;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (rafId == null) { running = true; loop(); }
  }
  function stop() {
    running = false;
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // Static render for reduced-motion users (no animation)
  function renderStatic() {
    resize();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + ACCENT.r + ',' + ACCENT.g + ',' + ACCENT.b + ',' +
        (p.baseAlpha * 0.8).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // debounced resize
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (reduceMotion) { renderStatic(); }
      else { resize(); }
    }, 150);
  });

  // pause when tab hidden — saves battery / CPU
  document.addEventListener('visibilitychange', function () {
    if (reduceMotion) return;
    if (document.hidden) stop();
    else start();
  });

  // init
  if (reduceMotion) {
    renderStatic();
  } else {
    resize();
    loop();
  }
})();
