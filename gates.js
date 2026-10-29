(function () {
  var COLS = 4;
  var ROWS = 5;
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Classic board: yellow 2x2 on top, wide block under it, two gaps at the bottom.
  var START = [
    { id: "big", x: 1, y: 0, w: 2, h: 2, kind: "big" },
    { id: "t1", x: 0, y: 0, w: 1, h: 2, kind: "tall" },
    { id: "t2", x: 3, y: 0, w: 1, h: 2, kind: "tall" },
    { id: "wide", x: 0, y: 2, w: 2, h: 1, kind: "wide" },
    { id: "t3", x: 2, y: 2, w: 1, h: 2, kind: "tall" },
    { id: "t4", x: 3, y: 2, w: 1, h: 2, kind: "tall" },
    { id: "s1", x: 0, y: 3, w: 1, h: 1, kind: "small" },
    { id: "s2", x: 1, y: 3, w: 1, h: 1, kind: "small" },
    { id: "s3", x: 0, y: 4, w: 1, h: 1, kind: "small" },
    { id: "s4", x: 3, y: 4, w: 1, h: 1, kind: "small" }
  ];

  function clonePieces(list) {
    return list.map(function (p) {
      return { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, kind: p.kind };
    });
  }

  function gridOf(list, ignoreId) {
    var grid = new Array(COLS * ROWS).fill(0);
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.id === ignoreId) continue;
      for (var dy = 0; dy < p.h; dy++) {
        for (var dx = 0; dx < p.w; dx++) grid[(p.y + dy) * COLS + (p.x + dx)] = 1;
      }
    }
    return grid;
  }

  function fits(grid, x, y, w, h) {
    if (x < 0 || y < 0 || x + w > COLS || y + h > ROWS) return false;
    for (var dy = 0; dy < h; dy++) {
      for (var dx = 0; dx < w; dx++) {
        if (grid[(y + dy) * COLS + (x + dx)]) return false;
      }
    }
    return true;
  }

  function maxSlide(list, piece, dx, dy) {
    var grid = gridOf(list, piece.id);
    var k = 0;
    while (fits(grid, piece.x + dx * (k + 1), piece.y + dy * (k + 1), piece.w, piece.h)) k++;
    return k;
  }

  function won(list) {
    var big = null;
    for (var i = 0; i < list.length; i++) if (list[i].kind === "big") big = list[i];
    return big.x === 1 && big.y === 3;
  }

  function stateKey(list) {
    var big, wide, talls = [], smalls = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var spot = p.x + "," + p.y;
      if (p.kind === "big") big = spot;
      else if (p.kind === "wide") wide = spot;
      else if (p.kind === "tall") talls.push(spot);
      else smalls.push(spot);
    }
    talls.sort();
    smalls.sort();
    return big + "|" + wide + "|" + talls.join(";") + "|" + smalls.join(";");
  }

  function slide(list, id, dx, dy, steps) {
    var next = clonePieces(list);
    for (var i = 0; i < next.length; i++) {
      if (next[i].id === id) {
        next[i].x += dx * steps;
        next[i].y += dy * steps;
      }
    }
    return next;
  }

  function neighbors(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var piece = list[i];
      for (var d = 0; d < DIRS.length; d++) {
        var dx = DIRS[d][0];
        var dy = DIRS[d][1];
        var max = maxSlide(list, piece, dx, dy);
        for (var k = 1; k <= max; k++) out.push(slide(list, piece.id, dx, dy, k));
      }
    }
    return out;
  }

  function shortest() {
    var start = clonePieces(START);
    var q = [start];
    var dist = new Map();
    dist.set(stateKey(start), 0);
    var head = 0;
    while (head < q.length) {
      var cur = q[head++];
      var key = stateKey(cur);
      if (won(cur)) return { moves: dist.get(key), seen: dist.size };
      var nexts = neighbors(cur);
      for (var i = 0; i < nexts.length; i++) {
        var k = stateKey(nexts[i]);
        if (dist.has(k)) continue;
        dist.set(k, dist.get(key) + 1);
        q.push(nexts[i]);
      }
    }
    return { moves: -1, seen: dist.size };
  }

  function selfCheck() {
    var covered = gridOf(START, null);
    var filled = covered.reduce(function (n, c) { return n + c; }, 0);
    var big = START.filter(function (p) { return p.kind === "big"; })[0];
    var small = START.filter(function (p) { return p.id === "s2"; })[0];
    var reach = shortest();
    return {
      cells: filled === 18 && covered.length === 20,
      blocked: maxSlide(START, big, 0, 1) === 0,
      smallDown: maxSlide(START, small, 0, 1) === 1,
      solvable: reach.moves > 0,
      shortest: reach.moves,
      seen: reach.seen
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { selfCheck: selfCheck, won: won, START: START };
    return;
  }

  var root = document.getElementById("gate-game");
  if (!root) return;

  var pieces = clonePieces(START);
  var moves = 0;
  var undoStack = [];
  var drag = null;
  var unit = 72;

  function fitUnit() {
    var host = root.clientWidth || 360;
    var u = Math.floor((Math.min(host - 8, 440) - 36) / 4);
    if (u > 76) u = 76;
    if (u < 58) u = 58;
    return u;
  }

  function findPiece(id) {
    for (var i = 0; i < pieces.length; i++) if (pieces[i].id === id) return pieces[i];
    return null;
  }

  function commit(next) {
    undoStack.push(JSON.stringify({ pieces: pieces, moves: moves }));
    if (undoStack.length > 400) undoStack.shift();
    pieces = next;
    moves += 1;
    render();
  }

  function tryStep(id, dx, dy, steps) {
    if (won(pieces)) return;
    var piece = findPiece(id);
    var max = maxSlide(pieces, piece, dx, dy);
    var k = steps == null ? 1 : steps;
    if (k < 1 || k > max) return;
    commit(slide(pieces, id, dx, dy, k));
  }

  function legalDirs(piece) {
    var found = [];
    for (var d = 0; d < DIRS.length; d++) {
      if (maxSlide(pieces, piece, DIRS[d][0], DIRS[d][1]) >= 1) found.push(DIRS[d]);
    }
    return found;
  }

  function onDown(e) {
    if (won(pieces)) return;
    if (e.button != null && e.button !== 0) return;
    var el = e.currentTarget;
    var piece = findPiece(el.getAttribute("data-id"));
    drag = {
      id: piece.id,
      pid: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: piece.x,
      oy: piece.y,
      axis: null,
      px: 0,
      py: 0
    };
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic clicks have no pointer */ }
    el.classList.add("is-drag");
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dx = e.clientX - drag.sx;
    var dy = e.clientY - drag.sy;
    if (!drag.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    var piece = findPiece(drag.id);
    if (drag.axis === "x") {
      var left = maxSlide(pieces, piece, -1, 0) * unit;
      var right = maxSlide(pieces, piece, 1, 0) * unit;
      drag.px = Math.max(-left, Math.min(right, dx));
      drag.py = 0;
    } else {
      var up = maxSlide(pieces, piece, 0, -1) * unit;
      var down = maxSlide(pieces, piece, 0, 1) * unit;
      drag.py = Math.max(-up, Math.min(down, dy));
      drag.px = 0;
    }
    var el = e.currentTarget;
    el.style.left = (drag.ox * unit + 4 + drag.px) + "px";
    el.style.top = (drag.oy * unit + 4 + drag.py) + "px";
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var info = drag;
    drag = null;
    var el = e.currentTarget;
    el.classList.remove("is-drag");
    if (!info.axis) {
      var piece = findPiece(info.id);
      var dirs = legalDirs(piece);
      if (dirs.length === 1) tryStep(info.id, dirs[0][0], dirs[0][1], 1);
      else render();
      return;
    }
    var delta = info.axis === "x" ? info.px : info.py;
    var steps = Math.round(delta / unit);
    if (steps === 0) {
      render();
      return;
    }
    var dir = steps > 0 ? 1 : -1;
    var dx = info.axis === "x" ? dir : 0;
    var dy = info.axis === "y" ? dir : 0;
    tryStep(info.id, dx, dy, Math.abs(steps));
  }

  function onKey(e) {
    var map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    var dir = map[e.key];
    if (!dir) return;
    var el = document.activeElement;
    if (!el || !root.contains(el) || !el.getAttribute("data-id")) return;
    e.preventDefault();
    tryStep(el.getAttribute("data-id"), dir[0], dir[1], 1);
  }

  function render() {
    var done = won(pieces);
    var card = root.querySelector(".k-card");
    card.style.setProperty("--u", unit + "px");
    root.querySelector(".k-count").innerHTML = "<b>" + moves + "</b> " + (moves === 1 ? "move" : "moves");
    var status = root.querySelector(".k-status");
    status.textContent = done ? "Through." : "Drag a block, or tap one that can only go one way.";
    status.classList.toggle("is-win", done);
    root.querySelector('[data-act="undo"]').disabled = undoStack.length === 0;
    var gap = 4;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var el = root.querySelector('[data-id="' + p.id + '"]');
      var dragging = drag && drag.id === p.id;
      if (dragging) continue;
      el.style.left = (p.x * unit + gap) + "px";
      el.style.top = (p.y * unit + gap) + "px";
      el.style.width = (p.w * unit - gap * 2) + "px";
      el.style.height = (p.h * unit - gap * 2) + "px";
    }
  }

  function build() {
    root.innerHTML =
      '<div class="k-card">' +
        '<div class="k-count"></div>' +
        '<div class="k-frame">' +
          '<div class="k-board"></div>' +
          '<div class="k-sill" aria-hidden="true"><span></span><span class="gate">out</span><span></span></div>' +
        "</div>" +
        '<p class="k-status" role="status"></p>' +
        '<div class="k-tools">' +
          '<button type="button" data-act="undo">Undo</button>' +
          '<button type="button" data-act="reset">Reset</button>' +
        "</div>" +
      "</div>";
    var board = root.querySelector(".k-board");
    board.innerHTML = pieces.map(function (p) {
      var label = p.kind === "big" ? "Yellow piece" : "Block";
      return '<button type="button" class="piece ' + p.kind + '" data-id="' + p.id + '" aria-label="' + label + '"></button>';
    }).join("");
    var buttons = board.querySelectorAll(".piece");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("pointerdown", onDown);
      buttons[i].addEventListener("pointermove", onMove);
      buttons[i].addEventListener("pointerup", onUp);
      buttons[i].addEventListener("pointercancel", onUp);
    }
    root.addEventListener("click", function (e) {
      var act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.getAttribute("data-act") === "undo") {
        var raw = undoStack.pop();
        if (!raw) return;
        var saved = JSON.parse(raw);
        pieces = saved.pieces;
        moves = saved.moves;
        drag = null;
        render();
      } else {
        pieces = clonePieces(START);
        moves = 0;
        undoStack = [];
        drag = null;
        render();
      }
    });
    document.addEventListener("keydown", onKey);
    render();
  }

  unit = fitUnit();
  build();
  window.addEventListener("resize", function () {
    var next = fitUnit();
    if (next === unit) return;
    unit = next;
    render();
  });
})();
