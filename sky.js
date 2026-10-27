(function () {
  var KEY = "site-weather";
  var TIME_KEY = "site-time";
  var WEATHERS = ["sunny", "cloudy", "rain"];

  function readWeather() {
    try {
      var saved = localStorage.getItem(KEY);
      if (WEATHERS.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    return "sunny";
  }

  function readTime() {
    try {
      var saved = localStorage.getItem(TIME_KEY);
      if (saved === "night" || saved === "day") return saved;
      if (localStorage.getItem(KEY) === "night") return "night";
    } catch (e) {}
    return "day";
  }

  function applyWeather(mode) {
    if (WEATHERS.indexOf(mode) === -1) mode = "sunny";
    document.documentElement.setAttribute("data-weather", mode);
    var buttons = document.querySelectorAll(".weather-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-weather") === mode ? "true" : "false");
    }
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  function applyTime(time) {
    if (time !== "night") time = "day";
    document.documentElement.setAttribute("data-time", time);
    var toggle = document.querySelector(".daynight");
    if (toggle) {
      var night = time === "night";
      toggle.setAttribute("aria-pressed", night ? "true" : "false");
      toggle.setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
    }
    try { localStorage.setItem(TIME_KEY, time); } catch (e) {}
  }

  var cloudSvg =
    '<svg class="clouds" viewBox="0 0 1440 200" preserveAspectRatio="xMidYMin slice">' +
      '<g>' +
        '<ellipse cx="170" cy="86" rx="100" ry="36"/>' +
        '<ellipse cx="236" cy="70" rx="58" ry="30"/>' +
        '<ellipse cx="112" cy="78" rx="48" ry="24"/>' +
        '<ellipse cx="760" cy="96" rx="118" ry="40"/>' +
        '<ellipse cx="840" cy="78" rx="64" ry="30"/>' +
        '<ellipse cx="680" cy="88" rx="52" ry="24"/>' +
      '</g>' +
      '<g class="clouds-more">' +
        '<ellipse cx="460" cy="58" rx="88" ry="30"/>' +
        '<ellipse cx="520" cy="46" rx="48" ry="22"/>' +
        '<ellipse cx="400" cy="52" rx="40" ry="18"/>' +
        '<ellipse cx="1180" cy="108" rx="124" ry="38"/>' +
        '<ellipse cx="1260" cy="92" rx="66" ry="28"/>' +
      '</g>' +
    '</svg>';

  var planeSvg =
    '<svg viewBox="0 0 64 40" aria-hidden="true">' +
      '<path d="M4 22 L58 6 L36 34 L28 22 Z" fill="#fffef8" stroke="#142033" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M28 22 L58 6 L34 20" fill="none" stroke="#142033" stroke-width="1.7" stroke-linejoin="round"/>' +
    '</svg>';

  var initialTime = readTime();
  applyTime(initialTime);
  applyWeather(readWeather());

  if (!document.querySelector(".stars")) {
    var stars = document.createElement("div");
    stars.className = "stars";
    stars.setAttribute("aria-hidden", "true");
    document.body.insertBefore(stars, document.body.firstChild);
  }

  if (!document.querySelector(".sky")) {
    var sky = document.createElement("div");
    sky.className = "sky";
    sky.setAttribute("aria-hidden", "true");
    sky.innerHTML =
      '<div class="sun-mark"></div>' +
      '<div class="moon-mark"></div>' +
      '<div class="cloud-track">' + cloudSvg + cloudSvg + '</div>' +
      '<svg class="bird" viewBox="0 0 48 18" aria-hidden="true">' +
        '<path d="M3 12 C 10 4, 16 5, 20 11 C 16 9, 12 11, 9 13"/>' +
        '<path d="M20 11 C 28 3, 40 5, 45 12"/>' +
      '</svg>' +
      '<button type="button" class="plane" aria-label="Flick the paper plane">' + planeSvg + '</button>';
    document.body.insertBefore(sky, document.body.firstChild);
  }

  if (!document.querySelector(".rain")) {
    var rain = document.createElement("div");
    rain.className = "rain";
    rain.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 42; i++) {
      var drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = (Math.random() * 100) + "%";
      drop.style.height = (12 + Math.random() * 18) + "px";
      drop.style.animationDuration = (0.85 + Math.random() * 1.15) + "s";
      drop.style.animationDelay = (-Math.random() * 2.2) + "s";
      drop.style.opacity = String(0.35 + Math.random() * 0.5);
      rain.appendChild(drop);
    }
    document.body.insertBefore(rain, document.body.firstChild);
  }

  if (!document.querySelector(".field")) {
    var field = document.createElement("div");
    field.className = "field";
    field.setAttribute("aria-hidden", "true");
    field.innerHTML =
      '<svg class="mountains" viewBox="0 0 1440 360" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="ridge-far" d="M0 360 L0 250 C 120 240, 200 150, 310 128 C 420 106, 470 200, 590 182 C 720 162, 780 90, 910 104 C 1040 118, 1100 210, 1230 176 C 1330 150, 1380 210, 1440 188 L1440 360 Z"/>' +
        '<path class="ridge" d="M0 360 L0 270 C 100 258, 190 160, 310 142 C 430 124, 500 220, 640 196 C 770 174, 840 78, 980 98 C 1120 118, 1180 210, 1310 178 C 1380 160, 1410 200, 1440 190 L1440 360 Z"/>' +
        '<path class="ridge-near" d="M0 360 L0 300 C 150 292, 240 200, 370 182 C 500 164, 560 250, 730 228 C 880 208, 950 96, 1100 124 C 1230 148, 1300 240, 1440 210 L1440 360 Z"/>' +
        '<path class="snow" d="M930 150 C 980 92, 1040 88, 1090 148 C 1040 132, 990 136, 930 150 Z"/>' +
        '<path class="snow" d="M300 168 C 330 128, 370 126, 400 166 C 368 156, 334 158, 300 168 Z"/>' +
      '</svg>' +
      '<div class="field-hill"></div>' +
      '<svg class="flag" viewBox="0 0 20 36" aria-hidden="true">' +
        '<line class="flag-pole" x1="4" y1="2" x2="4" y2="34"/>' +
        '<path class="flag-fly" d="M4 3 H16 L12 8 L16 13 H4 Z"/>' +
      '</svg>' +
      '<p class="plane-note" aria-live="polite"></p>';
    document.body.appendChild(field);
  }

  if (!document.querySelector(".sky-controls")) {
    var wrap = document.createElement("div");
    wrap.className = "sky-controls";

    var daynight = document.createElement("button");
    daynight.type = "button";
    daynight.className = "daynight";
    daynight.innerHTML =
      '<span class="daynight-icon" aria-hidden="true">' +
        '<svg class="icon-sun" viewBox="0 0 24 24">' +
          '<circle cx="12" cy="12" r="3.6" fill="currentColor"/>' +
          '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
            '<path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/>' +
          '</g>' +
        '</svg>' +
        '<svg class="icon-moon" viewBox="0 0 24 24">' +
          '<path fill="currentColor" d="M16.2 3.1a8.6 8.6 0 1 0 4.6 14.8A7.6 7.6 0 1 1 16.2 3.1z"/>' +
        '</svg>' +
      '</span>';
    daynight.addEventListener("click", function () {
      applyTime(document.documentElement.getAttribute("data-time") === "night" ? "day" : "night");
    });

    var control = document.createElement("div");
    control.className = "weather";
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Weather");
    control.innerHTML =
      '<span class="weather-thumb" aria-hidden="true"></span>' +
      '<button type="button" class="weather-btn" data-weather="sunny">Sun</button>' +
      '<button type="button" class="weather-btn" data-weather="cloudy">Clouds</button>' +
      '<button type="button" class="weather-btn" data-weather="rain">Rain</button>';
    control.addEventListener("click", function (event) {
      var btn = event.target.closest(".weather-btn");
      if (!btn) return;
      applyWeather(btn.getAttribute("data-weather"));
    });

    wrap.appendChild(daynight);
    wrap.appendChild(control);
    document.body.appendChild(wrap);
    applyWeather(document.documentElement.getAttribute("data-weather") || "sunny");
    applyTime(document.documentElement.getAttribute("data-time") || "day");
  }

  function wind() {
    var mode = document.documentElement.getAttribute("data-weather");
    var night = document.documentElement.getAttribute("data-time") === "night";
    var w = { x: 0.1, g: 0.34 };
    if (mode === "cloudy") w = { x: 0.28, g: 0.3 };
    else if (mode === "rain") w = { x: -0.22, g: 0.5 };
    if (night) w.g = 0.18;
    return w;
  }

  function park(plane) {
    var sky = document.querySelector(".sky");
    if (!sky || !plane) return;
    sky.appendChild(plane);
    plane.classList.remove("is-flying", "is-landed", "is-held");
    plane.style.position = "";
    plane.style.left = "";
    plane.style.top = "";
    plane.style.bottom = "";
    plane.style.right = "";
    plane.style.transform = "";
    plane.style.margin = "";
    plane.setAttribute("aria-label", "Flick the paper plane");
    var note = document.querySelector(".plane-note");
    if (note) note.textContent = "";
  }

  function land(plane, clientX) {
    var field = document.querySelector(".field");
    var note = document.querySelector(".plane-note");
    if (!field) return;
    var pct = Math.max(8, Math.min(92, (clientX / window.innerWidth) * 100));
    field.appendChild(plane);
    plane.classList.remove("is-flying", "is-held");
    plane.classList.add("is-landed");
    plane.style.position = "absolute";
    plane.style.margin = "0";
    plane.style.top = "auto";
    plane.style.right = "auto";
    plane.style.left = pct + "%";
    plane.style.bottom = "5.4rem";
    plane.style.transform = "rotate(" + (pct > 64 ? 18 : -14) + "deg)";
    plane.setAttribute("aria-label", "Throw the paper plane again");
    var dist = Math.abs(pct - 64);
    if (note) {
      note.textContent = dist < 7 ? "Right on the flag." : dist < 16 ? "Close." : "Way out.";
    }
    field.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function launch(plane, x, y, vx, vy) {
    var w = wind();
    vx = Math.max(-26, Math.min(26, vx));
    vy = Math.max(-30, Math.min(16, vy));
    plane.classList.add("is-flying");
    plane.classList.remove("is-landed");
    document.body.appendChild(plane);
    plane.style.position = "fixed";
    plane.style.margin = "0";
    plane.style.bottom = "auto";
    plane.style.right = "auto";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      land(plane, x + vx * 18);
      return;
    }
    function frame() {
      vx += w.x;
      vy += w.g;
      x += vx;
      y += vy;
      var rot = Math.atan2(vy, vx) * 180 / Math.PI;
      plane.style.left = x + "px";
      plane.style.top = y + "px";
      plane.style.transform = "rotate(" + rot + "deg)";
      var inView = y < window.innerHeight * 0.78 && x > -60 && x < window.innerWidth + 20;
      if (inView) {
        requestAnimationFrame(frame);
        return;
      }
      land(plane, Math.max(0, Math.min(window.innerWidth, x)));
    }
    requestAnimationFrame(frame);
  }

  function setupPlane() {
    var plane = document.querySelector(".plane");
    if (!plane || plane.dataset.ready === "1") return;
    plane.dataset.ready = "1";
    var dragging = false;
    var moved = false;
    var trail = [];
    var origin = null;

    plane.addEventListener("pointerdown", function (event) {
      if (plane.classList.contains("is-flying")) return;
      dragging = true;
      moved = false;
      plane.setPointerCapture(event.pointerId);
      plane.classList.add("is-held");
      trail = [{ x: event.clientX, y: event.clientY, t: performance.now() }];
      var rect = plane.getBoundingClientRect();
      origin = { x: rect.left, y: rect.top };
    });

    plane.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      trail.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (trail.length > 5) trail.shift();
      var dx = event.clientX - trail[0].x;
      var dy = event.clientY - trail[0].y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      plane.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + (dx * 0.35) + "deg)";
    });

    function release(event) {
      if (!dragging) return;
      dragging = false;
      plane.classList.remove("is-held");
      var first = trail[0];
      var last = trail[trail.length - 1];
      var dt = Math.max(16, last.t - first.t);
      var vx = (last.x - first.x) / dt * 16;
      var vy = (last.y - first.y) / dt * 16;
      var rect = plane.getBoundingClientRect();
      plane.style.transform = "";
      if (!moved || Math.hypot(vx, vy) < 1.8) {
        if (plane.classList.contains("is-landed")) park(plane);
        return;
      }
      launch(plane, rect.left, rect.top, vx, vy);
    }

    plane.addEventListener("pointerup", release);
    plane.addEventListener("pointercancel", release);
    plane.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (plane.classList.contains("is-flying")) return;
      if (plane.classList.contains("is-landed")) {
        park(plane);
        return;
      }
      var rect = plane.getBoundingClientRect();
      launch(plane, rect.left, rect.top, 9, -16);
    });
  }

  applyTime(document.documentElement.getAttribute("data-time") || "day");
  applyWeather(document.documentElement.getAttribute("data-weather") || "sunny");
  setupPlane();
})();
