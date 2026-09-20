/* =========================================================
   Feliz día de las Flores Amarillas — lógica (mobile-first)
   Sin imágenes: estrellas, partículas y flores son SVG/Canvas.
   ========================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pickWithoutRepeat(arr, lastValue) {
    if (arr.length === 1) return arr[0];
    var v = lastValue;
    while (v === lastValue) { v = pick(arr); }
    return v;
  }

  /* ---------------------------------------------------------
     Mensajes (tono de amistad)
     --------------------------------------------------------- */
  var CENTRAL_MESSAGES = [
    'Una florecita para ti 🌻',
    'Feliz día de las flores amarillas ✨',
    'Esta zona oficialmente está llena de flores 🌼',
    'No podía darte flores físicas, así que tocó hacerlas digitales JAJA',
    'Una pequeña sorpresa para ti'
  ];

  var FIELD_MESSAGES = [
    'Porque hoy tocaban flores amarillas 🌻',
    'Espero que esto te saque una sonrisa',
    'Solo para ti 💛',
    'Una más para la colección',
    'Brillando por ti ✨',
    'Sigue tocando, hay más por aquí'
  ];

  var lastCentralMsg = null;
  var lastFieldMsg = null;

  /* ---------------------------------------------------------
     Toast de mensajes
     --------------------------------------------------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(text) {
    clearTimeout(toastTimer);
    toastEl.textContent = text;
    // reflow para reiniciar la transición si ya estaba visible
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2200);
  }

  /* ---------------------------------------------------------
     Canvas de cielo: estrellas + polvo dorado flotando
     --------------------------------------------------------- */
  var skyCanvas = document.getElementById('sky');
  var skyCtx = skyCanvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var stars = [];
  var dust = [];
  var W = 0, H = 0;

  function sizeCanvas(canvas, ctx) {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function buildStars() {
    var count = Math.round((W * H) / 5500); // densidad moderada
    count = Math.max(60, Math.min(count, 160));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: rand(0, W),
        y: rand(0, H * 0.85),
        r: rand(0.5, 1.6),
        base: rand(0.25, 0.85),
        speed: rand(0.6, 1.8),
        phase: rand(0, Math.PI * 2)
      });
    }
  }

  function buildDust() {
    dust = [];
    if (reduceMotion) return;
    var count = Math.max(16, Math.min(Math.round(W / 14), 36));
    for (var i = 0; i < count; i++) {
      dust.push(spawnDust());
    }
  }

  function spawnDust() {
    return {
      x: rand(0, W),
      y: H + rand(0, H * 0.3),
      r: rand(1, 2.6),
      speed: rand(10, 22), // px por segundo, hacia arriba
      drift: rand(-8, 8),
      alpha: 0,
      alphaTarget: rand(0.35, 0.85),
      life: 0,
      maxLife: rand(6, 13),
      swayPhase: rand(0, Math.PI * 2)
    };
  }

  var lastFrame = null;

  function drawSky(ts) {
    if (lastFrame === null) lastFrame = ts;
    var dt = Math.min((ts - lastFrame) / 1000, 0.05);
    lastFrame = ts;

    skyCtx.clearRect(0, 0, W, H);

    // fondo con leve degradado vertical
    var grad = skyCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#06060d');
    grad.addColorStop(1, '#0c0c1a');
    skyCtx.fillStyle = grad;
    skyCtx.fillRect(0, 0, W, H);

    // estrellas parpadeantes
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduceMotion ? s.base : s.base + Math.sin(ts / 1000 * s.speed + s.phase) * 0.25;
      tw = Math.max(0.1, Math.min(1, tw));
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      skyCtx.fillStyle = 'rgba(255, 248, 230, ' + tw.toFixed(3) + ')';
      skyCtx.fill();
    }

    // polvo dorado
    if (!reduceMotion) {
      for (var j = 0; j < dust.length; j++) {
        var d = dust[j];
        d.life += dt;
        d.y -= d.speed * dt;
        d.x += Math.sin(ts / 1000 + d.swayPhase) * d.drift * dt;

        var fadeIn = Math.min(d.life / 1.2, 1);
        var fadeOut = Math.min((d.maxLife - d.life) / 1.2, 1);
        d.alpha = d.alphaTarget * Math.max(0, Math.min(fadeIn, fadeOut));

        skyCtx.beginPath();
        skyCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        skyCtx.fillStyle = 'rgba(255, 205, 90, ' + d.alpha.toFixed(3) + ')';
        skyCtx.shadowColor = 'rgba(255, 190, 60, 0.8)';
        skyCtx.shadowBlur = 4;
        skyCtx.fill();
        skyCtx.shadowBlur = 0;

        if (d.life >= d.maxLife || d.y < -10) {
          dust[j] = spawnDust();
        }
      }
    }

    requestAnimationFrame(drawSky);
  }

  function initSky() {
    sizeCanvas(skyCanvas, skyCtx);
    buildStars();
    buildDust();
    requestAnimationFrame(drawSky);
  }

  /* ---------------------------------------------------------
     Canvas de ráfagas (explosión de partículas al tocar)
     --------------------------------------------------------- */
  var burstCanvas = document.getElementById('burst');
  var burstCtx = burstCanvas.getContext('2d');
  var burstParticles = [];
  var burstRunning = false;

  function sizeBurstCanvas() {
    sizeCanvas(burstCanvas, burstCtx);
  }

  function spawnBurst(x, y, count, colorList) {
    for (var i = 0; i < count; i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(60, 220);
      burstParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(20, 60),
        r: rand(1.5, 3.6),
        life: 0,
        maxLife: rand(0.6, 1.1),
        color: pick(colorList)
      });
    }
    if (!burstRunning) {
      burstRunning = true;
      lastBurstFrame = null;
      requestAnimationFrame(drawBurst);
    }
  }

  var lastBurstFrame = null;
  var GOLD_TONES = ['255, 211, 77', '255, 182, 39', '255, 241, 194', '255, 150, 60'];

  function drawBurst(ts) {
    if (lastBurstFrame === null) lastBurstFrame = ts;
    var dt = Math.min((ts - lastBurstFrame) / 1000, 0.05);
    lastBurstFrame = ts;

    burstCtx.clearRect(0, 0, W, H);

    var stillAlive = false;
    for (var i = 0; i < burstParticles.length; i++) {
      var p = burstParticles[i];
      if (!p) continue;
      p.life += dt;
      if (p.life >= p.maxLife) { burstParticles[i] = null; continue; }
      stillAlive = true;

      p.vy += 140 * dt; // gravedad suave
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      var a = 1 - (p.life / p.maxLife);
      burstCtx.beginPath();
      burstCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      burstCtx.fillStyle = 'rgba(' + p.color + ', ' + a.toFixed(3) + ')';
      burstCtx.shadowColor = 'rgba(' + p.color + ', 0.9)';
      burstCtx.shadowBlur = 6;
      burstCtx.fill();
      burstCtx.shadowBlur = 0;
    }

    if (stillAlive) {
      burstParticles = burstParticles.filter(function (p) { return p !== null; });
      requestAnimationFrame(drawBurst);
    } else {
      burstParticles = [];
      burstRunning = false;
    }
  }

  /* ---------------------------------------------------------
     Generador de flores en SVG (sin imágenes)
     --------------------------------------------------------- */
  var svgIdCounter = 0;

  function makeFlowerSVG(opts) {
    svgIdCounter++;
    var gPetal = 'petalG' + svgIdCounter;
    var gCenter = 'centerG' + svgIdCounter;
    var petals = opts.petals || 12;
    var vb = 100;
    var cx = 50, cy = 50;
    var petalLen = opts.petalLen || 34;
    var petalW = opts.petalW || 13;
    var centerR = opts.centerR || 17;

    var petalShapes = '';
    for (var i = 0; i < petals; i++) {
      var angle = (360 / petals) * i;
      petalShapes +=
        '<ellipse cx="' + cx + '" cy="' + (cy - centerR - petalLen / 2 + 4) + '" ' +
        'rx="' + (petalW / 2) + '" ry="' + (petalLen / 2) + '" ' +
        'fill="url(#' + gPetal + ')" ' +
        'transform="rotate(' + angle + ' ' + cx + ' ' + cy + ')" />';
    }

    var seedDots = '';
    var seedCount = 10;
    for (var s = 0; s < seedCount; s++) {
      var sa = (360 / seedCount) * s + 15;
      var sr = centerR * 0.55;
      var sx = cx + Math.cos(sa * Math.PI / 180) * sr;
      var sy = cy + Math.sin(sa * Math.PI / 180) * sr;
      seedDots += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="1.4" fill="rgba(0,0,0,0.28)" />';
    }

    return (
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<radialGradient id="' + gPetal + '" cx="50%" cy="15%" r="90%">' +
            '<stop offset="0%" stop-color="' + (opts.petalColor1 || '#fff1c2') + '"/>' +
            '<stop offset="55%" stop-color="' + (opts.petalColor2 || '#ffd34d') + '"/>' +
            '<stop offset="100%" stop-color="' + (opts.petalColor3 || '#ffb627') + '"/>' +
          '</radialGradient>' +
          '<radialGradient id="' + gCenter + '" cx="40%" cy="35%" r="70%">' +
            '<stop offset="0%" stop-color="' + (opts.centerColor1 || '#5b3a1c') + '"/>' +
            '<stop offset="100%" stop-color="' + (opts.centerColor2 || '#2a1a10') + '"/>' +
          '</radialGradient>' +
        '</defs>' +
        petalShapes +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + centerR + '" fill="url(#' + gCenter + ')" />' +
        seedDots +
      '</svg>'
    );
  }

  function makeCentralFlowerSVG() {
    return makeFlowerSVG({
      petals: 16,
      petalLen: 40,
      petalW: 15,
      centerR: 19,
      petalColor1: '#fff6d6',
      petalColor2: '#ffd34d',
      petalColor3: '#ffab1f',
      centerColor1: '#6b431f',
      centerColor2: '#241509'
    });
  }

  function makeFieldFlowerSVG() {
    return makeFlowerSVG({
      petals: Math.round(rand(9, 12)),
      petalLen: rand(28, 36),
      petalW: rand(10, 14),
      centerR: rand(13, 17),
      petalColor1: '#fff6d6',
      petalColor2: '#ffd34d',
      petalColor3: '#ffb627',
      centerColor1: '#5b3a1c',
      centerColor2: '#2a1a10'
    });
  }

  /* ---------------------------------------------------------
     Construcción de la flor central
     --------------------------------------------------------- */
  var centralBtn = document.getElementById('centralFlower');
  centralBtn.innerHTML = makeCentralFlowerSVG();

  /* ---------------------------------------------------------
     Construcción del campo de flores
     --------------------------------------------------------- */
  var fieldEl = document.getElementById('field');
  var fieldFlowers = [];
  var MAX_FLOWERS = 22;

  // Zonas seguras: evitamos el centro (donde está la flor grande)
  // y repartimos el resto de la pantalla en un anillo + esquinas.
  function randomFieldSpot() {
    var zone = pick(['top', 'bottom', 'side']);
    var xPct, yPct;
    if (zone === 'top') {
      xPct = rand(8, 92);
      yPct = rand(6, 26);
    } else if (zone === 'bottom') {
      xPct = rand(6, 94);
      yPct = rand(66, 92);
    } else {
      xPct = pick([rand(2, 20), rand(80, 98)]);
      yPct = rand(20, 74);
    }
    return { x: xPct, y: yPct };
  }

  function addFieldFlower(delayMs) {
    if (fieldFlowers.length >= MAX_FLOWERS) return;

    var spot = randomFieldSpot();
    var size = rand(46, 78);
    var rot = rand(-10, 10);
    var swayDeg = rand(3, 7);
    var swayDur = rand(3.5, 6.5);
    var swayDelay = rand(0, 2);

    var btn = document.createElement('button');
    btn.className = 'field-flower';
    btn.setAttribute('aria-label', 'Tocar flor');
    btn.style.setProperty('--x', spot.x + '%');
    btn.style.setProperty('--y', spot.y + '%');
    btn.style.setProperty('--size', size + 'px');
    btn.style.setProperty('--rot', rot + 'deg');
    btn.style.setProperty('--sway-deg', swayDeg + 'deg');
    btn.style.setProperty('--sway-dur', swayDur + 's');
    btn.style.setProperty('--sway-delay', swayDelay + 's');
    btn.style.setProperty('--o', rand(0.85, 1));
    btn.innerHTML = makeFieldFlowerSVG();

    btn.addEventListener('click', onFieldFlowerTap);

    fieldEl.appendChild(btn);
    fieldFlowers.push(btn);

    setTimeout(function () {
      btn.classList.add('show');
    }, delayMs || 20);
  }

  /* ---------------------------------------------------------
     Interacciones (100% táctiles, sin hover)
     --------------------------------------------------------- */
  function onCentralTap() {
    var rect = centralBtn.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    centralBtn.classList.remove('bloom');
    void centralBtn.offsetWidth;
    centralBtn.classList.add('bloom');

    var glowRing = document.getElementById('glowRing');
    glowRing.classList.remove('burst');
    void glowRing.offsetWidth;
    glowRing.classList.add('burst');

    spawnBurst(cx, cy, 30, GOLD_TONES);

    // aparecen un par de flores nuevas
    addFieldFlower(60);
    addFieldFlower(220);

    var msg = pickWithoutRepeat(CENTRAL_MESSAGES, lastCentralMsg);
    lastCentralMsg = msg;
    showToast(msg);
  }

  function onFieldFlowerTap(e) {
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    btn.classList.remove('tapped');
    void btn.offsetWidth;
    btn.classList.add('tapped');

    spawnBurst(cx, cy, 12, GOLD_TONES);

    var msg = pickWithoutRepeat(FIELD_MESSAGES, lastFieldMsg);
    lastFieldMsg = msg;
    showToast(msg);
  }

  centralBtn.addEventListener('click', onCentralTap);

  /* ---------------------------------------------------------
     Secuencia de entrada
     --------------------------------------------------------- */
  function playIntro() {
    var titleWrap = document.getElementById('titleWrap');
    var glowRing = document.getElementById('glowRing');
    var hint = document.getElementById('hint');

    setTimeout(function () { titleWrap.classList.add('show'); }, 350);
    setTimeout(function () { glowRing.classList.add('show'); }, 950);
    setTimeout(function () { centralBtn.classList.add('show'); }, 1300);

    var initialCount = 11;
    for (var i = 0; i < initialCount; i++) {
      addFieldFlower(1900 + i * 140);
    }

    setTimeout(function () { hint.classList.add('show'); }, 1900 + initialCount * 140 + 200);
  }

  /* ---------------------------------------------------------
     Resize / orientación
     --------------------------------------------------------- */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      sizeCanvas(skyCanvas, skyCtx);
      buildStars();
      buildDust();
      sizeBurstCanvas();
    }, 150);
  });

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  initSky();
  sizeBurstCanvas();
  playIntro();

})();
