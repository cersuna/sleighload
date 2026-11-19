(function () {
  "use strict";
  var C = window.SL_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var DAY = 86400000;
  var START = Date.UTC(2026, 10, 18); // puzzle #1 = Nov 18, 2026 (local date)

  function dayNum(d) { return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - START) / DAY) + 1; }
  function dateFor(n) { return new Date(2026, 10, 18 + n - 1); }
  var today = dayNum(new Date());
  var num = parseInt(new URLSearchParams(location.search).get("n"), 10) || today;
  if (num < 1 || num > today) num = today;
  var N = [7, 5, 5, 6, 6, 6, 7][dateFor(num).getDay()]; // Mon/Tue easy, weekend hard

  // ---------- seeded generation ----------
  function rng32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = rng32(Math.imul(num, 2654435761) ^ 0x51e16);
  function nbrs(c) {
    var x = c % N, y = (c / N) | 0, out = [];
    if (x > 0) out.push(c - 1); if (x < N - 1) out.push(c + 1);
    if (y > 0) out.push(c - N); if (y < N - 1) out.push(c + N);
    return out;
  }
  function partition() {
    var regions, owner;
    for (var tries = 0; tries < 500; tries++) {
      owner = new Array(N * N).fill(-1); regions = [];
      for (var s = 0; s < N * N; s++) {
        if (owner[s] !== -1) continue;
        var target = 3 + Math.floor(rnd() * 3), reg = [s];
        owner[s] = regions.length;
        while (reg.length < target) {
          var fr = [];
          reg.forEach(function (c) { nbrs(c).forEach(function (nb) { if (owner[nb] === -1 && fr.indexOf(nb) < 0) fr.push(nb); }); });
          if (!fr.length) break;
          var pick = fr[Math.floor(rnd() * fr.length)];
          owner[pick] = regions.length; reg.push(pick);
        }
        regions.push(reg);
      }
      var ok = true;
      for (var i = 0; i < regions.length && ok; i++) {
        if (!regions[i].length || regions[i].length >= 3) continue;
        var adj = [];
        regions[i].forEach(function (c) { nbrs(c).forEach(function (nb) { var o = owner[nb]; if (o !== i && adj.indexOf(o) < 0) adj.push(o); }); });
        var cands = adj.filter(function (j) { return regions[j].length + regions[i].length <= 6; });
        if (!cands.length) { ok = false; break; }
        var j = cands[Math.floor(rnd() * cands.length)];
        regions[i].forEach(function (c) { owner[c] = j; regions[j].push(c); });
        regions[i] = [];
      }
      if (ok) break;
    }
    return regions.filter(function (r) { return r.length; });
  }
  function norm(shape) {
    var mx = Math.min.apply(null, shape.map(function (p) { return p[0]; }));
    var my = Math.min.apply(null, shape.map(function (p) { return p[1]; }));
    return shape.map(function (p) { return [p[0] - mx, p[1] - my]; }).sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
  }
  function rot(shape) { return norm(shape.map(function (p) { return [-p[1], p[0]]; })); }
  function key(shape) { return shape.map(function (p) { return p.join(","); }).join(";"); }
  function dims(shape) {
    return { w: 1 + Math.max.apply(null, shape.map(function (p) { return p[0]; })), h: 1 + Math.max.apply(null, shape.map(function (p) { return p[1]; })) };
  }

  var COLORS = ["#c8102e", "#1f7a3f", "#d4a017", "#2563eb", "#9333ea", "#ea580c", "#0891b2", "#db2777", "#65a30d", "#7c3aed", "#b45309", "#0f766e", "#be123c", "#4d7c0f", "#1d4ed8", "#a21caf"];
  var pieces = partition().map(function (reg, i) {
    var cells = reg.map(function (c) { return [c % N, (c / N) | 0]; });
    var mx = Math.min.apply(null, cells.map(function (p) { return p[0]; }));
    var my = Math.min.apply(null, cells.map(function (p) { return p[1]; }));
    var sol = norm(cells);
    var shape = sol, r = Math.floor(rnd() * 4);
    while (r--) shape = rot(shape);
    return { id: i, color: COLORS[i % COLORS.length], shape: shape, at: null, locked: false, sol: { x: mx, y: my, shape: sol } };
  });
  // shuffle tray order
  var order = pieces.map(function (p) { return p.id; });
  for (var k = order.length - 1; k > 0; k--) { var j2 = Math.floor(rnd() * (k + 1)); var t = order[k]; order[k] = order[j2]; order[j2] = t; }

  // ---------- state & persistence ----------
  var SKEY = "sl:p:" + num, STATS = "sl:stats";
  var st = { elapsed: 0, moves: 0, hints: 0, started: false, done: false };
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var saved = lsGet(SKEY);
  if (saved && saved.p && saved.p.length === pieces.length) {
    saved.p.forEach(function (s, i) { pieces[i].shape = s.shape; pieces[i].at = s.at; pieces[i].locked = s.locked; });
    st.elapsed = saved.elapsed || 0; st.moves = saved.moves || 0; st.hints = saved.hints || 0; st.started = !!saved.started; st.done = !!saved.done;
  }
  function save() {
    lsSet(SKEY, { p: pieces.map(function (p) { return { shape: p.shape, at: p.at, locked: p.locked }; }), elapsed: st.elapsed, moves: st.moves, hints: st.hints, started: st.started, done: st.done });
  }
  function track(name, params) { try { if (window.gtag) gtag("event", name, params || {}); } catch (e) {} }

  // ---------- board logic ----------
  function occupancy(except) {
    var occ = new Array(N * N).fill(-1);
    pieces.forEach(function (p) {
      if (!p.at || p === except) return;
      p.shape.forEach(function (c) { occ[(p.at.y + c[1]) * N + p.at.x + c[0]] = p.id; });
    });
    return occ;
  }
  function fits(p, shape, x, y) {
    var occ = occupancy(p);
    return shape.every(function (c) {
      var cx = x + c[0], cy = y + c[1];
      return cx >= 0 && cy >= 0 && cx < N && cy < N && occ[cy * N + cx] === -1;
    });
  }
  function isFull() { return occupancy().every(function (o) { return o !== -1; }); }

  // ---------- rendering ----------
  var board = $("#board"), tray = $("#tray"), cell = 40;
  function blocksHTML(p, size) {
    var set = {};
    p.shape.forEach(function (c) { set[c[0] + "," + c[1]] = 1; });
    return p.shape.map(function (c) {
      var x = c[0], y = c[1];
      var T = !set[x + "," + (y - 1)], B = !set[x + "," + (y + 1)], L = !set[(x - 1) + "," + y], R = !set[(x + 1) + "," + y];
      var bw = 3, r = Math.round(size * 0.22);
      var style = "left:" + x * size + "px;top:" + y * size + "px;width:" + size + "px;height:" + size + "px;background:" + p.color + ";" +
        "border-style:solid;border-color:rgba(0,0,0,.28);border-width:" + (T ? bw : 0) + "px " + (R ? bw : 0) + "px " + (B ? bw : 0) + "px " + (L ? bw : 0) + "px;" +
        "border-radius:" + (T && L ? r : 0) + "px " + (T && R ? r : 0) + "px " + (B && R ? r : 0) + "px " + (B && L ? r : 0) + "px";
      return '<i class="blk" style="' + style + '"></i>';
    }).join("");
  }
  function pieceEl(p, size) {
    var d = dims(p.shape), el = document.createElement("div");
    el.className = "piece" + (p.locked ? " locked" : "");
    el.style.width = d.w * size + "px"; el.style.height = d.h * size + "px";
    el.innerHTML = blocksHTML(p, size);
    el.dataset.id = p.id;
    return el;
  }
  function layout() {
    var w = Math.min(440, document.documentElement.clientWidth - 32);
    cell = Math.floor(w / N);
    board.style.width = board.style.height = cell * N + "px";
    board.style.backgroundSize = cell + "px " + cell + "px";
    render();
  }
  function render() {
    board.querySelectorAll(".piece").forEach(function (e) { e.remove(); });
    tray.innerHTML = "";
    var tcell = Math.max(16, Math.round(cell * 0.55));
    pieces.forEach(function (p) {
      if (!p.at) return;
      var el = pieceEl(p, cell);
      el.style.left = p.at.x * cell + "px"; el.style.top = p.at.y * cell + "px";
      board.appendChild(el); bind(el, p, cell);
    });
    order.forEach(function (id) {
      var p = pieces[id];
      if (p.at) return;
      var wrap = document.createElement("div");
      wrap.className = "slot";
      var el = pieceEl(p, tcell);
      wrap.appendChild(el); tray.appendChild(wrap); bind(el, p, tcell);
    });
    if (!tray.children.length && !st.done) tray.innerHTML = '<p class="muted">All presents are out of the tray.</p>';
    $("#moves").textContent = st.moves;
    $("#hints").textContent = st.hints;
    renderTime();
  }
  function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function renderTime() { $("#time").textContent = fmt(st.elapsed); }

  // ---------- interaction ----------
  var drag = null;
  function bind(el, p, size) {
    el.addEventListener("pointerdown", function (e) {
      if (st.done || p.locked) return;
      e.preventDefault();
      var r = el.getBoundingClientRect();
      drag = { p: p, el: el, sx: e.clientX, sy: e.clientY, fx: (e.clientX - r.left) / size, fy: (e.clientY - r.top) / size, moving: false, touch: e.pointerType !== "mouse" };
      startTimer();
    });
  }
  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    if (!drag.moving) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      drag.moving = true;
      drag.p.at = null;
      render();
      drag.float = pieceEl(drag.p, cell);
      drag.float.classList.add("floating");
      document.body.appendChild(drag.float);
    }
    var lift = drag.touch ? cell * 1.1 : 0;
    drag.left = e.clientX - drag.fx * cell; drag.top = e.clientY - drag.fy * cell - lift;
    drag.float.style.left = drag.left + "px"; drag.float.style.top = drag.top + "px";
    // ghost preview
    var g = gridPos();
    showGhost(fits(drag.p, drag.p.shape, g.x, g.y) ? g : null);
  });
  function gridPos(d) {
    d = d || drag;
    var b = board.getBoundingClientRect();
    return { x: Math.round((d.left - b.left) / cell), y: Math.round((d.top - b.top) / cell) };
  }
  var ghost = document.createElement("div"); ghost.className = "ghost";
  function showGhost(g) {
    if (!g) { ghost.remove(); return; }
    ghost.innerHTML = drag.p.shape.map(function (c) { return '<i style="left:' + c[0] * cell + "px;top:" + c[1] * cell + "px;width:" + cell + "px;height:" + cell + 'px"></i>'; }).join("");
    ghost.style.left = g.x * cell + "px"; ghost.style.top = g.y * cell + "px";
    board.appendChild(ghost);
  }
  window.addEventListener("pointerup", function () {
    if (!drag) return;
    var d = drag; drag = null; ghost.remove();
    if (!d.moving) return tap(d.p);
    d.float.remove();
    var pos = gridPos(d);
    if (fits(d.p, d.p.shape, pos.x, pos.y)) { d.p.at = pos; st.moves++; buzz(); }
    after();
  });
  window.addEventListener("pointercancel", function () { if (drag && drag.float) drag.float.remove(); drag = null; ghost.remove(); render(); });

  function tap(p) {
    var r = rot(p.shape);
    if (p.at) {
      if (fits(p, r, p.at.x, p.at.y)) { p.shape = r; }
      else { p.shape = r; p.at = null; }
    } else p.shape = r;
    after();
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
  function after() { save(); render(); if (isFull()) win(); }

  $("#resetBtn").onclick = function () {
    if (st.done) return;
    pieces.forEach(function (p) { if (!p.locked) p.at = null; });
    save(); render();
  };
  $("#hintBtn").onclick = function () {
    if (st.done) return;
    var target = pieces.filter(function (p) {
      return !p.locked && !(p.at && p.at.x === p.sol.x && p.at.y === p.sol.y && key(p.shape) === key(p.sol.shape));
    })[0];
    if (!target) return;
    startTimer();
    target.at = null;
    var cells = {};
    target.sol.shape.forEach(function (c) { cells[(target.sol.y + c[1]) * N + target.sol.x + c[0]] = 1; });
    pieces.forEach(function (p) {
      if (p.locked || !p.at) return;
      if (p.shape.some(function (c) { return cells[(p.at.y + c[1]) * N + p.at.x + c[0]]; })) p.at = null;
    });
    target.shape = target.sol.shape; target.at = { x: target.sol.x, y: target.sol.y }; target.locked = true;
    st.hints++; track("hint", { n: num });
    after();
  };

  // ---------- timer ----------
  var timer = null;
  function startTimer() {
    if (st.done) return;
    if (!st.started) { st.started = true; track("puzzle_start", { n: num, size: N }); }
    if (timer) return;
    timer = setInterval(function () {
      if (document.hidden || st.done) return;
      st.elapsed++; renderTime();
      if (st.elapsed % 5 === 0) save();
    }, 1000);
  }

  // ---------- win / stats ----------
  function stats() { return lsGet(STATS) || { done: {} }; }
  function streak(s) {
    var n = s.done[today] ? today : today - 1, c = 0;
    while (s.done[n]) { c++; n--; }
    return c;
  }
  function win() {
    if (!st.done) {
      st.done = true; clearInterval(timer); timer = null; save();
      var s = stats(); s.done[num] = { t: st.elapsed, m: st.moves, h: st.hints }; lsSet(STATS, s);
      track("puzzle_complete", { n: num, size: N, seconds: st.elapsed, hints: st.hints });
      confetti();
      var cur = document.querySelector(".day.cur");
      if (cur) { cur.classList.add("done"); cur.querySelector("small").textContent = "✓ " + fmt(st.elapsed); }
    }
    board.classList.add("won");
    showWin();
  }
  function shareText() {
    var s = stats();
    var stars = st.hints === 0 ? "⭐⭐⭐" : st.hints <= 2 ? "⭐⭐" : "⭐";
    var str = streak(s);
    return "Sleighload #" + num + " (" + N + "×" + N + ") 🛷 " + stars + "\n" +
      "🎁 Packed in " + fmt(st.elapsed) + " · " + st.moves + " moves" + (st.hints ? " · 💡" + st.hints : "") + "\n" +
      (str > 1 ? "🔥 " + str + "-day streak\n" : "") + C.siteUrl + "/";
  }
  function showWin() {
    var s = stats();
    $("#winStats").innerHTML =
      '<div><b>' + fmt(st.elapsed) + '</b><span>time</span></div><div><b>' + st.moves + '</b><span>moves</span></div>' +
      '<div><b>' + st.hints + '</b><span>hints</span></div><div><b>' + streak(s) + '</b><span>streak</span></div>';
    $("#win").classList.remove("hidden");
    $("#controls").classList.add("hidden");
    $("#shareBtn").onclick = function () {
      var text = shareText();
      track("share", { n: num });
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { navigator.share({ text: text }).catch(function () {}); return; }
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        $("#shareBtn").textContent = "Copied! Paste it anywhere 📋";
      }, function () { window.prompt("Copy your result:", text); });
    };
    tickCountdown();
  }
  function tickCountdown() {
    var el = $("#next"); if (!el) return;
    var now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var s = Math.floor((mid - now) / 1000);
    el.textContent = num === today
      ? "Next puzzle in " + Math.floor(s / 3600) + "h " + Math.floor(s % 3600 / 60) + "m"
      : "";
    setTimeout(tickCountdown, 30000);
  }
  function confetti() {
    var colors = ["#c8102e", "#1f7a3f", "#d4a017", "#fff", "#2563eb"];
    for (var i = 0; i < 80; i++) {
      var c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 2 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(c);
      setTimeout(function (el) { el.remove(); }.bind(null, c), 4600);
    }
  }

  // ---------- header, archive, sponsor ----------
  var d = dateFor(num);
  $("#pTitle").textContent = "Puzzle #" + num + " · " + d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  $("#pSize").textContent = N + "×" + N + " · " + pieces.length + " presents · " + (N === 5 ? "Easy" : N === 6 ? "Medium" : "Hard");
  var now = new Date(), xmas = new Date(now.getFullYear(), 11, 25);
  if (now > xmas) xmas = new Date(now.getFullYear() + 1, 11, 25);
  var dl = Math.ceil((xmas - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / DAY);
  $("#xmas").textContent = dl === 0 ? "🎄 Merry Christmas!" : "🎄 " + dl + " day" + (dl === 1 ? "" : "s") + " until Christmas";
  var s0 = stats(), arch = [];
  for (var n = today; n >= 1; n--) {
    var dn = s0.done[n];
    arch.push('<a class="day' + (n === num ? " cur" : "") + (dn ? " done" : "") + '" href="?n=' + n + '" title="' + dateFor(n).toDateString() + '">' +
      "#" + n + "<small>" + (dn ? "✓ " + fmt(dn.t) : dateFor(n).toLocaleDateString(undefined, { month: "short", day: "numeric" })) + "</small></a>");
  }
  $("#archive").innerHTML = arch.join("");
  if (C.sponsor && C.sponsor.name) {
    $("#sponsor").innerHTML = 'Today\'s puzzle is supported by <a href="' + C.sponsor.url + '" target="_blank" rel="sponsored noopener">' + C.sponsor.name + "</a>";
  } else if (C.sponsorPitchUrl) {
    $("#sponsor").innerHTML = '<a href="' + C.sponsorPitchUrl + '" target="_blank" rel="noopener">Sponsor a day of Sleighload →</a>';
  }

  window.addEventListener("resize", layout);
  layout();
  if (st.done) { board.classList.add("won"); showWin(); }
})();
