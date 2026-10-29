(function () {
  var PHYS = {
    k: 4600000,
    soft: 4200,
    crash: 30,
    margin: 26,
    maxT: 11
  };

  var LEVELS = [
    {
      name: "Bend",
      start: { x: 110, y: 287 },
      cup: { x: 548, y: 187, r: 40, catch: 180 },
      slots: [
        { x: 268, y: 73 },
        { x: 357, y: 245 },
        { x: 644, y: 252 }
      ]
    },
    {
      name: "Swing",
      start: { x: 110, y: 316 },
      cup: { x: 507, y: 228, r: 40, catch: 130 },
      slots: [
        { x: 317, y: 215 },
        { x: 348, y: 370 },
        { x: 553, y: 150 }
      ]
    },
    {
      name: "Skip",
      start: { x: 110, y: 267 },
      cup: { x: 628, y: 236, r: 40, catch: 260 },
      slots: [
        { x: 528, y: 204 },
        { x: 206, y: 245 },
        { x: 614, y: 340 }
      ]
    },
    {
      name: "Pocket",
      start: { x: 110, y: 326 },
      cup: { x: 603, y: 316, r: 40, catch: 140 },
      slots: [
        { x: 419, y: 295 },
        { x: 331, y: 65 },
        { x: 723, y: 323 }
      ]
    },
    {
      name: "Whip",
      start: { x: 110, y: 299 },
      cup: { x: 511, y: 117, r: 40, catch: 125 },
      slots: [
        { x: 646, y: 378 },
        { x: 352, y: 210 },
        { x: 358, y: 100 }
      ]
    }
  ];

  function chargesOf(level, signs) {
    var list = [];
    for (var i = 0; i < level.slots.length; i++) {
      if (!signs[i]) continue;
      list.push({ x: level.slots[i].x, y: level.slots[i].y, q: signs[i] });
    }
    return list;
  }

  function field(x, y, list) {
    var ax = 0;
    var ay = 0;
    for (var i = 0; i < list.length; i++) {
      var dx = x - list[i].x;
      var dy = y - list[i].y;
      var r2 = dx * dx + dy * dy;
      var r = Math.sqrt(r2);
      if (r < 1) r = 1;
      var mag = PHYS.k * list[i].q / (r2 + PHYS.soft);
      ax += mag * dx / r;
      ay += mag * dy / r;
    }
    return { ax: ax, ay: ay };
  }

  function nearest(x, y, list) {
    var best = Infinity;
    for (var i = 0; i < list.length; i++) {
      var d = Math.hypot(x - list[i].x, y - list[i].y);
      if (d < best) best = d;
    }
    return best;
  }

  function offBoard(level, x, y) {
    return x < PHYS.margin || y < PHYS.margin || x > 800 - PHYS.margin || y > 460 - PHYS.margin;
  }

  function distCup(level, x, y) {
    return Math.hypot(x - level.cup.x, y - level.cup.y);
  }

  function simulate(level, signs) {
    var list = chargesOf(level, signs);
    var x = level.start.x;
    var y = level.start.y;
    var vx = 0;
    var vy = 0;
    var path = [{ x: x, y: y, t: 0, s: 0 }];
    var t = 0;
    var steps = 0;
    var miss = distCup(level, x, y);
    var speedAt = 0;
    var skipped = false;
    var wasIn = false;
    if (!list.length) {
      return { result: "still", path: path, t: 0, miss: miss, speedAt: 0, skipped: false };
    }

    while (t < PHYS.maxT && steps < 80000) {
      var near = nearest(x, y, list);
      var speed = Math.hypot(vx, vy);
      var dt = 0.0022;
      if (near < 140 || speed > 280) dt = 0.0007;
      if (near < 70 || speed > 700) dt = 0.00022;
      var step = speed * dt;
      if (step > 3.5) dt *= 3.5 / step;

      var a = field(x, y, list);
      vx += a.ax * dt;
      vy += a.ay * dt;
      var nx = x + vx * dt;
      var ny = y + vy * dt;
      var nspeed = Math.hypot(vx, vy);
      if (nearest(nx, ny, list) < PHYS.crash || near < PHYS.crash) {
        path.push({ x: nx, y: ny, t: t, s: nspeed });
        return { result: "fell", path: path, t: t, miss: miss, speedAt: speedAt, skipped: skipped };
      }

      var cupD = distCup(level, nx, ny);
      if (cupD < miss) {
        miss = cupD;
        speedAt = nspeed;
      }
      var nowIn = cupD <= level.cup.r;
      if (nowIn && nspeed <= level.cup.catch) {
        path.push({ x: nx, y: ny, t: t + dt, s: nspeed });
        return { result: "cup", path: path, t: t + dt, miss: cupD, speedAt: nspeed, skipped: false };
      }
      if (wasIn && !nowIn && nspeed > level.cup.catch) {
        path.push({ x: nx, y: ny, t: t + dt, s: nspeed });
        return { result: "fast", path: path, t: t + dt, miss: miss, speedAt: speedAt, skipped: true };
      }
      if (wasIn && !nowIn) skipped = true;
      wasIn = nowIn;

      if (offBoard(level, nx, ny)) {
        path.push({ x: nx, y: ny, t: t, s: nspeed });
        return {
          result: skipped ? "fast" : "left",
          path: path,
          t: t,
          miss: miss,
          speedAt: speedAt,
          skipped: skipped
        };
      }
      x = nx;
      y = ny;
      t += dt;
      steps++;
      if (steps % 5 === 0) path.push({ x: x, y: y, t: t, s: nspeed });
      if (t > 1.4 && nspeed < 12 && Math.hypot(a.ax, a.ay) < 30) {
        path.push({ x: x, y: y, t: t, s: nspeed });
        return { result: "still", path: path, t: t, miss: miss, speedAt: speedAt, skipped: skipped };
      }
    }
    path.push({ x: x, y: y, t: t, s: Math.hypot(vx, vy) });
    var endIn = distCup(level, x, y) <= level.cup.r;
    return {
      result: endIn ? "cup" : skipped ? "fast" : "still",
      path: path,
      t: t,
      miss: miss,
      speedAt: speedAt,
      skipped: skipped
    };
  }

  function search() {
    return LEVELS.map(function (level) {
      var rows = [];
      for (var a = -1; a <= 1; a++) {
        for (var b = -1; b <= 1; b++) {
          for (var c = -1; c <= 1; c++) {
            var signs = [a, b, c];
            var run = simulate(level, signs);
            rows.push({
              signs: signs.join(","),
              result: run.result,
              t: Math.round(run.t * 100) / 100,
              miss: Math.round(run.miss),
              speed: Math.round(run.speedAt),
              skipped: run.skipped
            });
          }
        }
      }
      return { name: level.name, catch: level.cup.catch, rows: rows };
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { simulate: simulate, search: search, LEVELS: LEVELS, PHYS: PHYS };
    return;
  }

  var root = document.getElementById("sling-game");
  if (!root) return;

  var levelIndex = 0;
  var setups = LEVELS.map(function () { return [0, 0, 0]; });
  var unlocked = 0;
  var flying = false;
  var raf = 0;
  var outcome = null;
  var trail = [];
  var craft = { x: LEVELS[0].start.x, y: LEVELS[0].start.y, s: 0 };
  var lineCache = null;
  var sized = { w: 0, h: 0, dpr: 0 };

  function level() {
    return LEVELS[levelIndex];
  }

  function signs() {
    return setups[levelIndex];
  }

  function fitScale(canvas) {
    var parent = canvas.parentElement;
    var maxW = Math.min(parent.clientWidth || 720, 760);
    var scale = maxW / 800;
    canvas.style.width = Math.round(800 * scale) + "px";
    canvas.style.height = Math.round(460 * scale) + "px";
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(800 * scale * dpr);
    var bh = Math.round(460 * scale * dpr);
    if (sized.w !== bw || sized.h !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      sized.w = bw;
      sized.h = bh;
      sized.dpr = dpr;
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    return ctx;
  }

  function traceLines() {
    var list = chargesOf(level(), signs());
    var lines = [];
    var h = 6;
    for (var i = 0; i < list.length; i++) {
      var n = 8;
      for (var s = 0; s < n; s++) {
        var ang = (Math.PI * 2 * s) / n + 0.15;
        var x = list[i].x + Math.cos(ang) * (PHYS.crash + 8);
        var y = list[i].y + Math.sin(ang) * (PHYS.crash + 8);
        var pts = [{ x: x, y: y }];
        var dir = list[i].q > 0 ? 1 : -1;
        for (var step = 0; step < 130; step++) {
          var e = field(x, y, list);
          var m = Math.hypot(e.ax, e.ay);
          if (m < 1) break;
          x += dir * h * e.ax / m;
          y += dir * h * e.ay / m;
          if (x < 8 || y < 8 || x > 792 || y > 452) break;
          var hit = false;
          for (var j = 0; j < list.length; j++) {
            if (j !== i && Math.hypot(x - list[j].x, y - list[j].y) < PHYS.crash) hit = true;
          }
          if (hit) break;
          if (step % 2 === 0) pts.push({ x: x, y: y });
        }
        lines.push({ pts: pts, q: list[i].q });
      }
    }
    return lines;
  }

  function sample(path, t) {
    if (t <= path[0].t) return path[0];
    var last = path[path.length - 1];
    if (t >= last.t) return last;
    var lo = 0;
    var hi = path.length - 1;
    while (lo < hi - 1) {
      var mid = (lo + hi) >> 1;
      if (path[mid].t < t) lo = mid;
      else hi = mid;
    }
    var a = path[lo];
    var b = path[hi];
    var u = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
    return {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      t: t,
      s: a.s + (b.s - a.s) * u
    };
  }

  function draw() {
    var canvas = root.querySelector("canvas");
    var ctx = fitScale(canvas);
    var lv = level();
    ctx.clearRect(0, 0, 800, 460);

    if (!lineCache) lineCache = traceLines();
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    for (var i = 0; i < lineCache.length; i++) {
      var line = lineCache[i];
      if (line.pts.length < 2) continue;
      ctx.strokeStyle = line.q > 0 ? "rgba(176, 118, 18, 0.55)" : "rgba(36, 78, 150, 0.5)";
      ctx.beginPath();
      ctx.moveTo(line.pts[0].x, line.pts[0].y);
      for (var p = 1; p < line.pts.length; p++) ctx.lineTo(line.pts[p].x, line.pts[p].y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = "rgba(20, 32, 51, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.arc(lv.start.x, lv.start.y, 16, 0, Math.PI * 2);
    ctx.stroke();

    if (trail.length > 1) {
      for (var t = 1; t < trail.length; t++) {
        var sp = trail[t].s || 0;
        var hot = Math.max(0, Math.min(1, sp / 520));
        ctx.beginPath();
        ctx.strokeStyle = hot > 0.55 ? "#b07a10" : "#1e6b1a";
        ctx.lineWidth = 2.2 + hot * 2.4;
        ctx.moveTo(trail[t - 1].x, trail[t - 1].y);
        ctx.lineTo(trail[t].x, trail[t].y);
        ctx.stroke();
      }
    }

    var cup = lv.cup;
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = outcome === "cup" ? "#1e6b1a" : outcome === "fast" ? "#a15c12" : "#142033";
    ctx.fillStyle = outcome === "cup" ? "rgba(47, 138, 40, 0.18)" : "rgba(255, 254, 248, 0.28)";
    ctx.arc(cup.x, cup.y, cup.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (craft.s > 20) {
      var vx = 0;
      var vy = 0;
      if (trail.length > 1) {
        var prev = trail[trail.length - 2];
        vx = craft.x - prev.x;
        vy = craft.y - prev.y;
      }
      var m = Math.hypot(vx, vy) || 1;
      var len = Math.min(42, 10 + craft.s * 0.06);
      ctx.beginPath();
      ctx.strokeStyle = "#142033";
      ctx.lineWidth = 2;
      ctx.moveTo(craft.x, craft.y);
      ctx.lineTo(craft.x + (vx / m) * len, craft.y + (vy / m) * len);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = "#1e6b1a";
    ctx.arc(craft.x, craft.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#142033";
    ctx.stroke();
    ctx.fillStyle = "#fffef8";
    ctx.font = "800 13px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", craft.x, craft.y + 0.5);

    ctx.fillStyle = outcome === "cup" ? "#1e6b1a" : "#142033";
    ctx.font = "800 15px Nunito, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("cup", cup.x, cup.y + cup.r + 8);
  }

  function statusText() {
    if (flying) return "In flight.";
    if (outcome === "cup") {
      return levelIndex === LEVELS.length - 1 ? "In the cup. That's the last one." : "In the cup.";
    }
    if (outcome === "fast") return "Too fast. It skipped the cup.";
    if (outcome === "fell") return "It fell into a charge.";
    if (outcome === "left") return "It left the page.";
    if (outcome === "still") return "It never gets there.";
    return "Click a slot to set +, −, or empty. The cup only holds a slow charge.";
  }

  function paintSlots() {
    var buttons = root.querySelectorAll("[data-slot]");
    var s = signs();
    for (var i = 0; i < buttons.length; i++) {
      var q = s[i];
      buttons[i].textContent = q > 0 ? "+" : q < 0 ? "−" : "";
      buttons[i].classList.toggle("is-plus", q > 0);
      buttons[i].classList.toggle("is-minus", q < 0);
      buttons[i].classList.toggle("is-empty", q === 0);
      buttons[i].disabled = flying;
      buttons[i].setAttribute("aria-label", q > 0 ? "Positive charge" : q < 0 ? "Negative charge" : "Empty slot");
    }
  }

  function paintStatus() {
    var el = root.querySelector(".sling-status");
    el.textContent = statusText();
    el.classList.toggle("is-win", outcome === "cup");
    el.classList.toggle("is-bad", outcome === "fell" || outcome === "left" || outcome === "fast");
    root.querySelector('[data-act="go"]').disabled = flying;
    root.querySelector('[data-act="prev"]').disabled = flying || levelIndex === 0;
    root.querySelector('[data-act="next"]').disabled = flying || levelIndex >= unlocked || levelIndex >= LEVELS.length - 1;
    root.querySelector(".sling-name").textContent = level().name;
    root.querySelector(".sling-count").textContent = (levelIndex + 1) + " / " + LEVELS.length;
    root.querySelector(".sling-stage").classList.toggle("is-flying", flying);
  }

  function stopFlight() {
    flying = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function showStart() {
    var lv = level();
    outcome = null;
    trail = [{ x: lv.start.x, y: lv.start.y, t: 0, s: 0 }];
    craft = { x: lv.start.x, y: lv.start.y, s: 0 };
    lineCache = null;
  }

  function goLevel(next) {
    stopFlight();
    levelIndex = next;
    showStart();
    paintSlots();
    paintStatus();
    draw();
    placeSlots();
  }

  function launch() {
    if (flying) return;
    var run = simulate(level(), signs().slice());
    showStart();
    flying = true;
    paintSlots();
    paintStatus();
    draw();
    var pts = run.path;
    var dur = Math.max(1600, Math.min(4200, run.t * 520));
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var t0 = performance.now();
    function finish() {
      var end = pts[pts.length - 1];
      craft = { x: end.x, y: end.y, s: end.s };
      trail = pts;
      flying = false;
      outcome = run.result;
      if (outcome === "cup" && unlocked < levelIndex + 1) unlocked = levelIndex + 1;
      paintSlots();
      paintStatus();
      draw();
    }
    if (reduce || pts.length < 2) {
      finish();
      return;
    }
    function frame(now) {
      var u = Math.min(1, (now - t0) / dur);
      var simT = u * pts[pts.length - 1].t;
      craft = sample(pts, simT);
      trail = [];
      for (var i = 0; i < pts.length; i++) {
        if (pts[i].t <= simT) trail.push(pts[i]);
        else break;
      }
      trail.push(craft);
      draw();
      if (u >= 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  root.innerHTML =
    '<div class="sling-card">' +
      '<div class="sling-meta">' +
        '<span class="sling-name"></span>' +
        '<span class="sling-count"></span>' +
      "</div>" +
      '<div class="sling-stage">' +
        '<canvas></canvas>' +
        '<button type="button" class="slot" data-slot="0"></button>' +
        '<button type="button" class="slot" data-slot="1"></button>' +
        '<button type="button" class="slot" data-slot="2"></button>' +
      "</div>" +
      '<p class="sling-status" role="status"></p>' +
      '<div class="sling-tools">' +
        '<button type="button" data-act="prev">Prev</button>' +
        '<button type="button" data-act="reset">Reset</button>' +
        '<button type="button" class="sling-go" data-act="go">Go</button>' +
        '<button type="button" data-act="next">Next</button>' +
      "</div>" +
    "</div>";

  function placeSlots() {
    var canvas = root.querySelector("canvas");
    var stage = root.querySelector(".sling-stage");
    var rect = canvas.getBoundingClientRect();
    var stageRect = stage.getBoundingClientRect();
    var slots = level().slots;
    for (var i = 0; i < slots.length; i++) {
      var btn = root.querySelector('[data-slot="' + i + '"]');
      var x = rect.left - stageRect.left + (slots[i].x / 800) * rect.width;
      var y = rect.top - stageRect.top + (slots[i].y / 460) * rect.height;
      btn.style.left = x + "px";
      btn.style.top = y + "px";
    }
  }

  root.addEventListener("click", function (e) {
    var slot = e.target.closest("[data-slot]");
    if (slot) {
      if (flying) return;
      var i = +slot.getAttribute("data-slot");
      var s = signs();
      s[i] = s[i] === 0 ? 1 : s[i] === 1 ? -1 : 0;
      showStart();
      paintSlots();
      paintStatus();
      draw();
      placeSlots();
      return;
    }
    var act = e.target.closest("[data-act]");
    if (!act || act.disabled) return;
    var kind = act.getAttribute("data-act");
    if (kind === "go") launch();
    else if (kind === "prev") goLevel(levelIndex - 1);
    else if (kind === "next") goLevel(levelIndex + 1);
    else {
      setups[levelIndex] = [0, 0, 0];
      showStart();
      paintSlots();
      paintStatus();
      draw();
      placeSlots();
    }
  });

  window.addEventListener("resize", function () {
    sized.w = 0;
    draw();
    placeSlots();
  });

  showStart();
  paintSlots();
  paintStatus();
  draw();
  placeSlots();
})();
