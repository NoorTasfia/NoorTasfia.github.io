/* Guide robot for noortasfia.github.io. Wanders along the bottom of the page; click it for a site guide.
   Focus it and use ← → to walk, ↑ to jump, Esc to close. Respects prefers-reduced-motion. */
(function () {
  "use strict";
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var MENU = [
    ["Research direction", "#direction"],
    ["Selected work", "#work"],
    ["Knee-exo project", "projects/knee-exo/"],
    ["Publications", "#research"],
    ["Videos", "#videos"],
    ["About me", "#about"],
    ["Get in touch", "#contact"]
  ];
  var TIPS = [
    "Try the robot arm at the top: drag to teach it a path.",
    "Newest project: a learned knee-exoskeleton controller in MuJoCo.",
    "Looking for the CV? It's in the footer.",
    "Click me for a quick tour!"
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function init() {
    var W = 64, x = 24, target = x, dir = 1, keyMove = 0, busy = false, last = null, raf = null, idleT = null, tipT = null;
    var bot = el("div", "bot");
    bot.setAttribute("role", "group");
    bot.setAttribute("aria-label", "Guide robot");
    bot.innerHTML =
      '<div class="bot-bubble" id="bot-guide" hidden></div>' +
      '<button type="button" class="bot-btn" aria-controls="bot-guide" aria-expanded="false" aria-label="Open the site guide">' +
      '<div class="bot-rig" aria-hidden="true"><div class="b-ant"></div>' +
      '<div class="b-head"><div class="b-visor"><div class="b-eye l"></div><div class="b-eye r"></div></div><div class="b-mouth"></div></div>' +
      '<div class="b-arm l"></div><div class="b-arm r"></div><div class="b-body"><div class="b-core"></div></div>' +
      '<div class="b-leg l"></div><div class="b-leg r"></div></div></button>' +
      '<button type="button" class="bot-x" aria-label="Hide the guide robot">×</button>';
    document.body.appendChild(bot);
    var back = el("button", "bot-back", "🤖 Bring the robot back");
    back.type = "button";
    document.body.appendChild(back);

    var bubble = bot.querySelector(".bot-bubble"), btn = bot.querySelector(".bot-btn"), close = bot.querySelector(".bot-x");
    var hidden = store.get("bot-hidden") === "1";
    bot.hidden = hidden; back.hidden = !hidden;

    function maxX() { return Math.max(8, window.innerWidth - W - 24); }
    function place() {
      bot.style.transform = "translateX(" + x + "px)";
      bot.classList.toggle("face-left", dir < 0);
      if (!bubble.hidden) {
        var bw = bubble.getBoundingClientRect().width;
        var left = Math.max(8, Math.min(x + W / 2 - bw / 2, window.innerWidth - bw - 8));
        bubble.style.left = (left - x) + "px";
        bubble.style.setProperty("--tail", Math.max(16, Math.min(bw - 16, x + W / 2 - left)) + "px");
      }
    }

    function hideBubble() {
      clearTimeout(tipT);
      bubble.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      bot.classList.remove("open");
      busy = false;
      kick();
    }
    function say(text, ms) {
      if (busy) return;
      bubble.replaceChildren(el("div", "", text));
      bubble.hidden = false;
      place();
      clearTimeout(tipT);
      tipT = setTimeout(function () { if (!busy) bubble.hidden = true; }, ms || 4500);
    }
    function guide() {
      busy = true; target = x;
      bot.classList.add("open");
      bubble.replaceChildren();
      bubble.appendChild(el("div", "t", "Hi! I'm Tasfia's guide bot."));
      bubble.appendChild(el("div", "", "Where shall we go?"));
      var nav = el("nav", "bot-opts");
      nav.setAttribute("aria-label", "Site guide");
      MENU.forEach(function (m) {
        var a = el("a", "", m[0]);
        a.href = m[1];
        a.addEventListener("click", function () { if (m[1].charAt(0) === "#") hideBubble(); });
        nav.appendChild(a);
      });
      var cl = el("button", "", "Close");
      cl.type = "button";
      cl.addEventListener("click", function () { hideBubble(); btn.focus(); });
      nav.appendChild(cl);
      bubble.appendChild(nav);
      bubble.appendChild(el("small", "", "Tip: focus me and use ← → to walk, ↑ to jump."));
      bubble.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      place();
      var first = nav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
    function jump() {
      if (still) return;
      bot.classList.remove("jump"); void bot.offsetWidth; bot.classList.add("jump");
    }
    function wave() {
      if (still) return;
      bot.classList.remove("waving"); void bot.offsetWidth; bot.classList.add("waving");
      setTimeout(function () { bot.classList.remove("waving"); }, 1600);
    }

    // Wander: pick a new spot every 4–10 s, occasionally say a tip.
    function wander() {
      clearTimeout(idleT);
      idleT = setTimeout(function () {
        if (!busy && !document.hidden) {
          target = 8 + Math.random() * (maxX() - 8);
          if (Math.random() < 0.18) say(TIPS[Math.floor(Math.random() * TIPS.length)]);
        }
        wander();
      }, 4000 + Math.random() * 6000);
    }
    function frame(t) {
      if (bot.hidden || document.hidden) { raf = null; last = null; return; }
      if (last === null) last = t;
      var dt = Math.min(0.05, (t - last) / 1000), moving = false;
      last = t;
      if (keyMove) { dir = keyMove; x += keyMove * 170 * dt; target = x; moving = true; }
      else if (Math.abs(target - x) > 1) { dir = target > x ? 1 : -1; x += dir * Math.min(55 * dt, Math.abs(target - x)); moving = true; }
      x = Math.max(8, Math.min(maxX(), x));
      bot.classList.toggle("walking", moving && !still);
      if (moving || !bubble.hidden) place();
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !bot.hidden) raf = requestAnimationFrame(frame); }

    btn.addEventListener("click", function () { if (busy) hideBubble(); else { guide(); jump(); } });
    btn.addEventListener("mouseenter", function () { if (!busy) wave(); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { keyMove = e.key === "ArrowLeft" ? -1 : 1; kick(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { jump(); e.preventDefault(); }
    });
    btn.addEventListener("keyup", function (e) { if (e.key === "ArrowLeft" || e.key === "ArrowRight") keyMove = 0; });
    btn.addEventListener("blur", function () { keyMove = 0; });
    bot.addEventListener("keydown", function (e) { if (e.key === "Escape" && busy) { hideBubble(); btn.focus(); } });
    document.addEventListener("click", function (e) { if (busy && !bot.contains(e.target)) hideBubble(); });
    close.addEventListener("click", function () {
      hideBubble(); bot.hidden = true; back.hidden = false; store.set("bot-hidden", "1");
    });
    back.addEventListener("click", function () {
      bot.hidden = false; back.hidden = true; store.set("bot-hidden", null); kick(); wave(); btn.focus();
    });
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("resize", function () { x = Math.min(x, maxX()); target = Math.min(target, maxX()); place(); });

    place(); kick(); wander();
    if (!hidden) setTimeout(function () { wave(); say("Hi! Click me for a tour of the site.", 4000); }, 1800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
