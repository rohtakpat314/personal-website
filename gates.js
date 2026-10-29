(function () {
  var N = 1, E = 2, S = 4, W = 8;
  var CW = {};
  CW[N] = E;
  CW[E] = S;
  CW[S] = W;
  CW[W] = N;

  function rotDir(dir, times) {
    var d = dir;
    var n = ((times || 0) % 4 + 4) % 4;
    for (var i = 0; i < n; i++) d = CW[d];
    return d;
  }

  function rotMask(mask, times) {
    var m = 0;
    [N, E, S, W].forEach(function (d) {
      if (mask & d) m |= rotDir(d, times);
    });
    return m;
  }

  function opposite(dir) { return rotDir(dir, 2); }

  function step(r, c, dir) {
    if (dir === N) return { r: r - 1, c: c, back: S };
    if (dir === E) return { r: r, c: c + 1, back: W };
    if (dir === S) return { r: r + 1, c: c, back: N };
    return { r: r, c: c - 1, back: E };
  }

  function dirsOf(mask) {
    var out = [];
    [N, E, S, W].forEach(function (d) { if (mask & d) out.push(d); });
    return out;
  }

  function src(v, v2) { return { t: "src", v: v, v2: v2 == null ? v : v2, dir: E, rot: 0, goal: 0 }; }
  function dst() { return { t: "dst", dir: W, rot: 0, goal: 0 }; }
  function wall() { return { t: "wall" }; }
  function empty() { return { t: "empty" }; }
  function wire(rot, goal) { return { t: "wire", mask: E | W, rot: rot, goal: goal == null ? rot : goal }; }
  function corner(rot, goal) { return { t: "wire", mask: N | E, rot: rot, goal: goal == null ? rot : goal }; }
  function inv(rot, goal) { return { t: "not", dir: E, rot: rot, goal: goal == null ? rot : goal }; }
  function andGate() { return { t: "and", dir: E, rot: 0, goal: 0, lock: true }; }
  function mem() { return { t: "mem", inn: W, out: E, rot: 0, goal: 0, lock: true }; }

  var LEVELS = [
    {
      prompt: "The 1 vanishes on the second pass. Park it in the latch.",
      win: "The latch kept the 1 after the source died.",
      rows: [[
        src(1, 0), wire(1, 0), mem(), wire(0), dst()
      ]]
    },
    {
      prompt: "A 0 can leak into the latch. Shut it out, and save the 1.",
      win: "The 0 stayed out, so the latch held a clean 1.",
      rows: [
        [src(1, 0), wire(1, 0), corner(0, 2), empty(), empty(), empty()],
        [empty(), empty(), corner(3, 0), mem(), wire(1, 0), dst()],
        [src(0), wire(0), corner(0, 1), empty(), empty(), empty()]
      ]
    },
    {
      prompt: "Save A's 1. The plane waits until B shows up.",
      win: "The latch waited, then B arrived. That's an AND.",
      rows: [
        [src(1, 0), wire(1, 0), mem(), corner(1, 2), empty(), empty()],
        [empty(), empty(), empty(), andGate(), wire(1, 0), dst()],
        [src(0, 1), wire(1, 0), wire(0), corner(0, 3), empty(), empty()]
      ]
    },
    {
      prompt: "A starts at 0, then flips to 1. Catch the inverted 1 before it disappears.",
      win: "The NOT flipped it in time, and the latch held on.",
      rows: [
        [src(0, 1), wire(0), inv(3, 0), mem(), corner(1, 2), empty()],
        [empty(), empty(), empty(), empty(), andGate(), dst()],
        [src(0, 1), wire(1, 0), wire(0), wire(0), corner(0, 3), empty()]
      ]
    }
  ];

  function cloneLevel(level) {
    return level.rows.map(function (row) {
      return row.map(function (cell) { return Object.assign({}, cell); });
    });
  }

  function face(cell) {
    if (!cell || cell.t === "empty" || cell.t === "wall") {
      return { open: 0 };
    }
    if (cell.t === "wire") {
      var open = rotMask(cell.mask, cell.rot);
      return { open: open, kind: "wire" };
    }
    if (cell.t === "src") {
      var sd = rotDir(cell.dir, cell.rot);
      return { open: sd, kind: "src", out: sd, v: cell.v };
    }
    if (cell.t === "dst") {
      var dd = rotDir(cell.dir, cell.rot);
      return { open: dd, kind: "dst", inn: dd };
    }
    if (cell.t === "not") {
      var no = rotDir(cell.dir, cell.rot);
      var ni = opposite(no);
      return { open: no | ni, kind: "not", out: no, inn: ni };
    }
    if (cell.t === "mem") {
      return { open: cell.inn | cell.out, kind: "mem", inn: cell.inn, out: cell.out };
    }
    var ao = rotDir(cell.dir, cell.rot);
    var aIn = [rotDir(ao, 1), rotDir(ao, 3)];
    return { open: ao | aIn[0] | aIn[1], kind: "and", out: ao, inputs: aIn };
  }

  function inGrid(grid, r, c) {
    return r >= 0 && c >= 0 && r < grid.length && c < grid[r].length;
  }

  function port(r, c, dir) { return r + "," + c + "," + dir; }

  function srcVal(cell, phase) {
    if (phase === 2 && cell.v2 != null) return cell.v2;
    return cell.v;
  }

  function simulate(grid, phase, memory) {
    phase = phase || 1;
    memory = memory || {};
    var parent = {};
    function find(a) {
      if (parent[a] == null) parent[a] = a;
      if (parent[a] !== a) parent[a] = find(parent[a]);
      return parent[a];
    }
    function union(a, b) {
      var ra = find(a);
      var rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    }

    var faces = grid.map(function (row) { return row.map(face); });

    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var f = faces[r][c];
        var openDirs = dirsOf(f.open);
        if (f.kind === "wire" && openDirs.length > 1) {
          for (var i = 1; i < openDirs.length; i++) union(port(r, c, openDirs[0]), port(r, c, openDirs[i]));
        }
        openDirs.forEach(function (d) {
          var nb = step(r, c, d);
          if (!inGrid(grid, nb.r, nb.c)) return;
          if (faces[nb.r][nb.c].open & nb.back) union(port(r, c, d), port(nb.r, nb.c, nb.back));
        });
      }
    }

    function readNet(key) {
      return values[find(key)];
    }

    var values = {};
    function drive(key, v) {
      var root = find(key);
      if (values[root] == null) values[root] = v;
      else if (values[root] !== v) values[root] = "x";
    }

    function gateOut(kind, inputs) {
      if (kind === "not") {
        var a = inputs[0];
        if (a !== 0 && a !== 1) return "x";
        return a ? 0 : 1;
      }
      var p = inputs[0];
      var q = inputs[1];
      if (p === 0 || q === 0) return 0;
      if (p === 1 && q === 1) return 1;
      return "x";
    }

    for (var pass = 0; pass < 8; pass++) {
      var next = {};
      function put(key, v) {
        var root = find(key);
        if (next[root] == null) next[root] = v;
        else if (next[root] !== v) next[root] = "x";
      }
      for (r = 0; r < grid.length; r++) {
        for (c = 0; c < grid[r].length; c++) {
          f = faces[r][c];
          if (f.kind === "src") put(port(r, c, f.out), srcVal(grid[r][c], phase));
          if (f.kind === "mem") {
            var mv;
            if (phase === 2) mv = memory[r + "," + c] == null ? "z" : memory[r + "," + c];
            else {
              var min = values[find(port(r, c, f.inn))];
              mv = min == null ? "z" : min;
            }
            put(port(r, c, f.out), mv);
          }
          if (f.kind === "not") {
            var iv = values[find(port(r, c, f.inn))];
            put(port(r, c, f.out), gateOut("not", [iv == null ? "z" : iv]));
          }
          if (f.kind === "and") {
            var ins = f.inputs.map(function (d) {
              var got = values[find(port(r, c, d))];
              return got == null ? "z" : got;
            });
            put(port(r, c, f.out), gateOut("and", ins));
          }
        }
      }
      var same = true;
      Object.keys(next).forEach(function (k) {
        if (values[k] !== next[k]) same = false;
      });
      Object.keys(values).forEach(function (k) {
        if (next[k] == null) same = false;
      });
      values = next;
      if (same) break;
    }

    var heat = {};
    var dstCell = null;
    for (r = 0; r < grid.length; r++) {
      for (c = 0; c < grid[r].length; c++) {
        f = faces[r][c];
        var key = r + "," + c;
        if (f.kind === "src") heat[key] = srcVal(grid[r][c], phase);
        else if (f.kind === "wire") {
          var wd = dirsOf(f.open)[0];
          heat[key] = wd == null ? "z" : (values[find(port(r, c, wd))] == null ? "z" : values[find(port(r, c, wd))]);
        } else if (f.kind === "not" || f.kind === "and" || f.kind === "mem") {
          var ov = values[find(port(r, c, f.out))];
          heat[key] = ov == null ? "z" : ov;
        } else if (f.kind === "dst") {
          var dv = values[find(port(r, c, f.inn))];
          heat[key] = dv == null ? "z" : dv;
          dstCell = { r: r, c: c, value: heat[key] };
        }
      }
    }

    var stored = {};
    for (r = 0; r < grid.length; r++) {
      for (c = 0; c < grid[r].length; c++) {
        if (faces[r][c].kind !== "mem") continue;
        var mk = r + "," + c;
        stored[mk] = phase === 2 ? (memory[mk] == null ? "z" : memory[mk]) : heat[mk];
      }
    }

    return { value: dstCell ? dstCell.value : "z", heat: heat, path: trace(grid, faces, phase, stored), stored: stored };
  }

  function trace(grid, faces, phase, memory) {
    phase = phase || 1;
    memory = memory || {};
    var q = [];
    var seen = {};
    var prev = {};
    function push(r, c, enter, fromKey) {
      var id = r + "," + c + "," + enter;
      if (seen[id]) return;
      seen[id] = true;
      prev[id] = fromKey;
      q.push({ r: r, c: c, enter: enter, id: id });
    }

    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var seed = faces[r][c];
        if (phase === 2 && seed.kind === "mem" && memory[r + "," + c] === 1) {
          var mb = step(r, c, seed.out);
          if (inGrid(grid, mb.r, mb.c) && (faces[mb.r][mb.c].open & mb.back)) {
            push(mb.r, mb.c, mb.back, "mem:" + r + "," + c);
          }
        }
      }
    }
    for (r = 0; r < grid.length; r++) {
      for (c = 0; c < grid[r].length; c++) {
        if (faces[r][c].kind !== "src") continue;
        if (phase === 2 && srcVal(grid[r][c], 2) !== 1) continue;
        var d = faces[r][c].out;
        var nb = step(r, c, d);
        if (!inGrid(grid, nb.r, nb.c)) continue;
        if (!(faces[nb.r][nb.c].open & nb.back)) continue;
        push(nb.r, nb.c, nb.back, "src:" + r + "," + c);
      }
    }

    var found = null;
    for (var qi = 0; qi < q.length; qi++) {
      var cur = q[qi];
      var f = faces[cur.r][cur.c];
      if (f.kind === "dst" && cur.enter === f.inn) { found = cur; break; }
      var leaves = [];
      if (f.kind === "wire") {
        dirsOf(f.open).forEach(function (d) { if (d !== cur.enter) leaves.push(d); });
      } else if (f.kind === "not" && cur.enter === f.inn) leaves.push(f.out);
      else if (f.kind === "mem" && cur.enter === f.inn && phase !== 2) leaves.push(f.out);
      else if (f.kind === "and" && (cur.enter === f.inputs[0] || cur.enter === f.inputs[1])) leaves.push(f.out);
      leaves.forEach(function (d) {
        var nb = step(cur.r, cur.c, d);
        if (!inGrid(grid, nb.r, nb.c)) return;
        if (!(faces[nb.r][nb.c].open & nb.back)) return;
        push(nb.r, nb.c, nb.back, cur.id);
      });
    }
    if (!found) return [];
    var path = [];
    var walk = found.id;
    while (walk && walk.indexOf("src:") !== 0 && walk.indexOf("mem:") !== 0) {
      var bits = walk.split(",");
      path.push({ r: Number(bits[0]), c: Number(bits[1]) });
      walk = prev[walk];
    }
    if (walk && (walk.indexOf("src:") === 0 || walk.indexOf("mem:") === 0)) {
      var sc = walk.slice(4).split(",");
      path.push({ r: Number(sc[0]), c: Number(sc[1]) });
    }
    path.reverse();
    return path;
  }

  function play(grid) {
    var first = simulate(grid, 1, {});
    var second = simulate(grid, 2, first.stored);
    return { first: first, second: second };
  }

  function checkLevels() {
    return LEVELS.map(function (level, i) {
      var initial = play(cloneLevel(level));
      var solvedGrid = cloneLevel(level);
      solvedGrid.forEach(function (row) {
        row.forEach(function (cell) { if (cell.goal != null) cell.rot = cell.goal; });
      });
      var solved = play(solvedGrid);
      return {
        level: i + 1,
        initial: initial.second.value,
        stored: solved.first.stored,
        solved: solved.second.value,
        path: solved.second.path.map(function (p) { return p.r + "," + p.c; }).join(" ")
      };
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { checkLevels: checkLevels, simulate: simulate, play: play, LEVELS: LEVELS, cloneLevel: cloneLevel };
  }

  if (typeof document === "undefined") return;
  var root = document.getElementById("gate-game");
  if (!root) return;

  var state = { level: 0, grid: null, running: false, won: false, timer: null };

  function spins(cell) {
    if (!cell || cell.lock) return false;
    return cell.t === "wire" || cell.t === "not" || cell.t === "and";
  }

  function icon(cell) {
    var f = face(cell);
    if (cell.t === "empty") return "";
    if (cell.t === "wall") return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="wall-body" x="10" y="10" width="44" height="44" rx="6"/></svg>';
    if (cell.t === "src") {
      var next = cell.v2 !== cell.v ? '<text class="src-next" x="46" y="16" text-anchor="middle">\u2192' + cell.v2 + "</text>" : "";
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="' + (cell.v ? "src-on" : "src-off") + '" cx="22" cy="36" r="14"/><text class="src-num" x="22" y="42" text-anchor="middle">' + cell.v + "</text>" + next + '<path d="M36 36 H63"/></svg>';
    }
    if (cell.t === "mem") {
      return '<svg viewBox="0 0 64 64" aria-hidden="true">' + stub(f.open) +
        '<rect class="mem-body" x="18" y="18" width="28" height="28" rx="6"/>' +
        '<circle class="mem-dot" cx="32" cy="32" r="5"/></svg>';
    }
    if (cell.t === "dst") {
      return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<path d="M1 32 H12"/>' +
        '<g class="mini-plane"><g transform="translate(8 13) scale(0.86)">' +
          '<path d="M4 22 L58 6 L36 34 L28 22 Z"/>' +
          '<path class="fold" d="M28 22 L58 6 L34 20"/>' +
        "</g></g></svg>";
    }
    if (cell.t === "not") {
      var deg = { 1: -90, 2: 0, 4: 90, 8: 180 }[f.out];
      return '<svg viewBox="0 0 64 64" aria-hidden="true">' + stub(f.open) +
        '<g class="gate-body" transform="rotate(' + deg + ' 32 32)">' +
          '<path d="M22 20 L22 44 L42 32 Z"/><circle cx="47" cy="32" r="4"/>' +
        "</g></svg>";
    }
    if (cell.t === "and") {
      var adeg = { 1: -90, 2: 0, 4: 90, 8: 180 }[f.out];
      return '<svg viewBox="0 0 64 64" aria-hidden="true">' + stub(f.open) +
        '<g class="gate-body" transform="rotate(' + adeg + ' 32 32)">' +
          '<path d="M22 18 H32 C44 18 48 32 32 46 H22 Z"/>' +
        "</g></svg>";
    }
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' + wireArt(f.open) + "</svg>";
  }

  function stub(mask) {
    return dirsOf(mask).map(function (d) {
      var end = endPoint(d);
      return '<path d="M32 32 L' + end[0] + " " + end[1] + '"/>';
    }).join("");
  }

  function endPoint(d) {
    if (d === N) return [32, 1];
    if (d === E) return [63, 32];
    if (d === S) return [32, 63];
    return [1, 32];
  }

  function wireArt(mask) {
    var ds = dirsOf(mask);
    if (ds.length === 2 && opposite(ds[0]) !== ds[1]) {
      var a = endPoint(ds[0]);
      var b = endPoint(ds[1]);
      return '<path d="M' + a[0] + " " + a[1] + " Q 32 32 " + b[0] + " " + b[1] + '"/>';
    }
    return stub(mask);
  }

  function labelFor(cell) {
    if (cell.t === "src") return cell.v2 !== cell.v ? "Source " + cell.v + ", then " + cell.v2 + " on the second pass." : "Source outputting " + cell.v;
    if (cell.t === "mem") return "Latch. It remembers the first pass.";
    if (cell.t === "dst") return "Plane. It launches on a 1.";
    if (cell.t === "not") return spins(cell) ? "NOT gate. Press to turn." : "NOT gate.";
    if (cell.t === "and") return "AND gate.";
    if (cell.t === "wire") return "Wire. Press to turn.";
    if (cell.t === "wall") return "Wall";
    return "";
  }

  function render() {
    var level = LEVELS[state.level];
    var cols = state.grid[0].length;
    var tiles = "";
    for (var r = 0; r < state.grid.length; r++) {
      for (var c = 0; c < state.grid[r].length; c++) {
        var cell = state.grid[r][c];
        if (cell.t === "empty") {
          tiles += '<div class="tile is-empty"></div>';
          continue;
        }
        var turn = spins(cell);
        var tag = turn ? "button" : "div";
        var type = turn ? ' type="button"' : "";
        var v2 = cell.t === "src" ? ' data-v2="' + cell.v2 + '"' : "";
        tiles += "<" + tag + type + ' class="tile t-' + cell.t + (turn ? " can-turn" : "") + '" data-rc="' + r + "," + c + '"' + v2 + ' aria-label="' + labelFor(cell) + '">' + icon(cell) + "</" + tag + ">";
      }
    }
    root.innerHTML =
      '<div class="gate-board">' +
        '<p class="gate-count">' + (state.level + 1) + " of " + LEVELS.length + '<span class="beats" aria-hidden="true"><i></i><i></i></span></p>' +
        '<h3 class="gate-prompt" tabindex="-1">' + level.prompt + "</h3>" +
        '<div class="bit-stage" style="--cols:' + cols + '">' +
          '<div class="bit-grid">' + tiles + "</div>" +
          '<span class="bit-dot" hidden></span>' +
        "</div>" +
        '<div class="gate-foot">' +
          '<p class="gate-status" aria-live="polite"></p>' +
          '<div class="gate-actions">' +
            '<button type="button" class="gate-reset">Reset</button>' +
            '<button type="button" class="gate-run">Run</button>' +
            '<button type="button" class="gate-next" hidden>Next</button>' +
          "</div>" +
        "</div>" +
      "</div>";
  }

  function paintHeat(heat) {
    if (!heat) return;
    Object.keys(heat).forEach(function (key) {
      var el = root.querySelector('[data-rc="' + key + '"]');
      if (!el) return;
      el.classList.remove("is-hot", "is-cold", "is-bad");
      if (heat[key] === 1) el.classList.add("is-hot");
      else if (heat[key] === 0) el.classList.add("is-cold");
      else if (heat[key] === "x") el.classList.add("is-bad");
    });
  }

  function clearHeat() {
    root.querySelectorAll(".tile").forEach(function (el) {
      el.classList.remove("is-hot", "is-cold", "is-bad");
    });
  }

  function stopRun() {
    state.running = false;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function placeDot(dot, rc, jump) {
    var cell = root.querySelector('[data-rc="' + rc.r + "," + rc.c + '"]');
    var stage = root.querySelector(".bit-stage");
    if (!cell || !stage) return;
    var cr = cell.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    if (jump) dot.style.transition = "none";
    dot.hidden = false;
    dot.style.left = (cr.left - sr.left + cr.width / 2) + "px";
    dot.style.top = (cr.top - sr.top + cr.height / 2) + "px";
    if (jump) {
      void dot.offsetWidth;
      dot.style.transition = "";
    }
  }

  function held(stored) {
    return Object.keys(stored || {}).some(function (k) { return stored[k] === 1; });
  }

  function markBeat(n) {
    var dots = root.querySelectorAll(".beats i");
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("is-on", i < n);
  }

  function showPass(phase) {
    root.querySelectorAll(".t-src").forEach(function (el) {
      var v2 = el.getAttribute("data-v2");
      var num = el.querySelector(".src-num");
      var circle = el.querySelector("circle");
      if (!num || v2 == null) return;
      if (!num.getAttribute("data-v0")) num.setAttribute("data-v0", num.textContent);
      var v = phase === 2 ? v2 : num.getAttribute("data-v0");
      if (v == null) return;
      num.textContent = v;
      if (circle) {
        circle.setAttribute("class", v === "1" ? "src-on" : "src-off");
      }
    });
  }

  function finish(result, stored) {
    var level = LEVELS[state.level];
    var status = root.querySelector(".gate-status");
    var next = root.querySelector(".gate-next");
    var dot = root.querySelector(".bit-dot");
    paintHeat(result.heat);
    markBeat(2);
    state.won = result.value === 1;
    if (result.value === 1) {
      status.textContent = level.win;
      next.hidden = false;
      next.textContent = state.level === LEVELS.length - 1 ? "Play again" : "Next";
      if (dot) dot.classList.add("is-hot");
      var plane = root.querySelector(".mini-plane");
      if (plane) plane.classList.add("is-go");
    } else if (Object.keys(stored || {}).some(function (k) { return stored[k] === "x"; })) {
      status.textContent = "A 0 crashed into the 1. The latch needs a clean 1.";
      next.hidden = true;
    } else if (!held(stored)) {
      status.textContent = "The latch never caught a 1.";
      next.hidden = true;
    } else if (result.value === 0) {
      status.textContent = "A 0 got through on the second pass.";
      if (dot) dot.classList.add("is-zero");
      next.hidden = true;
    } else if (result.value === "x") {
      status.textContent = "No clean 1. A gate is missing an input, or two signals hit one wire.";
      next.hidden = true;
    } else {
      status.textContent = "The bit dies before the plane.";
      next.hidden = true;
    }
    root.querySelector(".gate-board").classList.toggle("is-solved", state.won);
    state.running = false;
  }

  function hopAlong(dot, path, done) {
    if (!path.length) {
      dot.hidden = true;
      done();
      return;
    }
    var i = 0;
    placeDot(dot, path[0], true);
    function hop() {
      i += 1;
      if (i >= path.length) {
        done();
        return;
      }
      placeDot(dot, path[i], false);
      state.timer = setTimeout(hop, 150);
    }
    state.timer = setTimeout(hop, path.length > 1 ? 150 : 0);
  }

  function run() {
    if (state.running) return;
    stopRun();
    state.running = true;
    state.won = false;
    root.querySelector(".gate-next").hidden = true;
    root.querySelector(".gate-board").classList.remove("is-solved");
    clearHeat();
    showPass(1);
    markBeat(1);
    var first = simulate(state.grid, 1, {});
    var second = simulate(state.grid, 2, first.stored);
    var dot = root.querySelector(".bit-dot");
    dot.classList.remove("is-hot", "is-zero");
    root.querySelector(".gate-status").textContent = "First pass.";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function secondPass() {
      if (!state.running) return;
      showPass(2);
      markBeat(2);
      paintHeat(first.heat);
      root.querySelector(".gate-status").textContent = "Second pass. The sources just changed.";
      if (reduce) {
        if (second.path.length) placeDot(dot, second.path[second.path.length - 1], true);
        finish(second, first.stored);
        return;
      }
      hopAlong(dot, second.path, function () { finish(second, first.stored); });
    }
    if (reduce) {
      showPass(2);
      if (second.path.length) placeDot(dot, second.path[second.path.length - 1], true);
      finish(second, first.stored);
      return;
    }
    hopAlong(dot, first.path, function () {
      paintHeat(first.heat);
      state.timer = setTimeout(secondPass, 520);
    });
  }

  function startLevel() {
    stopRun();
    state.grid = cloneLevel(LEVELS[state.level]);
    state.won = false;
    render();
    var status = root.querySelector(".gate-status");
    status.textContent = "Dashed pieces turn. The arrow on a source is pass two.";
  }

  root.addEventListener("click", function (event) {
    var tile = event.target.closest(".can-turn");
    if (tile && !state.running) {
      var rc = tile.getAttribute("data-rc").split(",");
      var cell = state.grid[Number(rc[0])][Number(rc[1])];
      cell.rot = ((cell.rot || 0) + 1) % 4;
      state.won = false;
      render();
      root.querySelector(".gate-status").textContent = "Dashed pieces turn. The arrow on a source is pass two.";
      var again = root.querySelector('[data-rc="' + rc[0] + "," + rc[1] + '"]');
      if (again && again.focus) again.focus();
      return;
    }
    if (event.target.closest(".gate-run")) {
      run();
      return;
    }
    if (event.target.closest(".gate-reset")) {
      startLevel();
      return;
    }
    if (event.target.closest(".gate-next")) {
      state.level = (state.level + 1) % LEVELS.length;
      startLevel();
      var prompt = root.querySelector(".gate-prompt");
      if (prompt) prompt.focus();
    }
  });

  startLevel();
})();
