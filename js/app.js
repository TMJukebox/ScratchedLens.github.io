/* ===========================================================================
   Desktop — the one-page ("dynamic") build of the site.

   All behaviour lives here. index.html only supplies markup: the desktop icons,
   the taskbar shell, and a <template> per section (each template carries its
   own window metadata in data-* attributes). Call Desktop.init() once.

   Window mechanics (drag / resize / min / max / close) are reused from
   js/script.js via window.setupWindow + window.bringToFront, so load that
   first.
   ======================================================================== */
(function () {
  "use strict";

  var TASKBAR_H = 40;
  var vpW = function () { return window.innerWidth || document.documentElement.clientWidth || 1024; };
  var vpH = function () { return window.innerHeight || document.documentElement.clientHeight || 768; };

  var openWins = {};   // key -> { win, btn }
  var bar = null;
  var cascade = 0;
  var started = false;

  function titleBarHTML(title, tb) {
    return '<div class="title-bar ' + (tb || "tb-navy") + '">' +
      '<div class="title-bar-text"></div>' +
      '<div class="title-bar-controls">' +
        '<button aria-label="Minimize"></button>' +
        '<button aria-label="Maximize"></button>' +
        '<button aria-label="Close"></button>' +
      "</div></div>";
  }

  function reopen(rec) {
    rec.win.hidden = false;
    rec.win.classList.remove("is-minimized");
    window.bringToFront(rec.win);
  }

  // Append a built window, hand it to setupWindow, give it a taskbar button,
  // and keep the two in sync (button tracks minimise; both vanish on close).
  function register(key, win, tabInner) {
    document.body.appendChild(win);
    window.setupWindow(win);

    var off = (cascade++ % 6) * 26;
    win.style.left = Math.max(8, Math.min((parseFloat(win.style.left) || 0) + off, vpW() - win.offsetWidth - 8)) + "px";
    win.style.top = Math.max(8, Math.min((parseFloat(win.style.top) || 0) + off, vpH() - TASKBAR_H - win.offsetHeight - 8)) + "px";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-task active";
    btn.innerHTML = tabInner;
    btn.addEventListener("click", function () {
      if (win.classList.contains("is-minimized")) {
        win.classList.remove("is-minimized");
        window.bringToFront(win);
      } else {
        win.classList.add("is-minimized");
      }
    });
    bar.appendChild(btn);
    openWins[key] = { win: win, btn: btn };

    new MutationObserver(function () {
      if (win.hidden) {                       // closed
        win.remove();
        btn.remove();
        delete openWins[key];
        return;
      }
      btn.classList.toggle("active", !win.classList.contains("is-minimized"));
    }).observe(win, { attributes: true, attributeFilter: ["hidden", "class"] });

    window.bringToFront(win);
  }

  // A templated content section (Home / About / Recycle Bin / ...).
  function openSection(key) {
    var tpl = document.getElementById("tpl-" + key);
    if (!tpl) return;
    if (openWins[key]) { reopen(openWins[key]); return; }

    var d = tpl.dataset;
    var win = document.createElement("div");
    win.className = "window content-window app-window";
    win.dataset.width = d.w || 560;
    win.dataset.height = d.h || 400;
    win.innerHTML = titleBarHTML(d.title || key, d.tb) + '<div class="window-body"></div>';
    win.querySelector(".title-bar-text").textContent = d.title || key;
    win.querySelector(".window-body").appendChild(tpl.content.cloneNode(true));
    register(key, win, d.tab || d.title || key);
  }

  // An iframed mini-app launched from a .bin-icon inside the Recycle Bin.
  function openApp(icon) {
    var key = icon.getAttribute("href");
    if (openWins[key]) { reopen(openWins[key]); return; }

    var title = icon.dataset.title || "APP";
    var win = document.createElement("div");
    win.className = "window app-window";
    win.dataset.width = icon.dataset.w || 480;
    win.dataset.height = icon.dataset.h || 400;
    win.innerHTML = titleBarHTML(title, icon.dataset.tb) +
      '<div class="window-body app-body"><iframe class="app-frame" src="about:blank"></iframe></div>';
    win.querySelector(".title-bar-text").textContent = title;

    var glyph = icon.querySelector(".icon-glyph");
    var label = icon.querySelector(".label");
    var tabInner =
      (glyph ? '<img src="' + glyph.src + '" alt="" width="16" height="16" style="image-rendering:pixelated;margin-right:4px;vertical-align:-3px">' : "") +
      (label ? label.textContent : title);
    register(key, win, tabInner);

    var frame = win.querySelector(".app-frame");
    frame.title = title;
    frame.src = key;
    setTimeout(function () { try { frame.contentWindow.focus(); } catch (e) {} }, 90);
  }

  function init() {
    if (started) return;
    bar = document.getElementById("taskbar-links");
    if (!bar || typeof window.setupWindow !== "function") return;
    started = true;

    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open]");
      if (opener) {
        e.preventDefault();
        openSection(opener.dataset.open);
        var menu = document.getElementById("start-menu");
        if (menu) menu.style.display = "none";
        return;
      }
      var binIcon = e.target.closest(".bin-icon");
      if (binIcon) {
        e.preventDefault();
        openApp(binIcon);
      }
    });

    // Open the section flagged data-default (WELCOME) once layout has settled.
    var def = document.querySelector('template[data-default]');
    if (def) setTimeout(function () { openSection(def.id.replace(/^tpl-/, "")); }, 60);
  }

  window.Desktop = { init: init, open: openSection };
})();
