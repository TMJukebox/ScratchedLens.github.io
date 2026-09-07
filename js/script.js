// Live taskbar clock — no build step, plain vanilla JS
function updateClock() {
  const el = document.getElementById("tray-clock");
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  el.textContent = `${h}:${m} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000 * 15);

// Shared desktop icon column. Home page hard-codes its own copy for no-JS
// resilience; every other page gets this injected so there's one definition.
const DESKTOP_ICONS_HTML = `
  <div class="desktop-icons">

    <a class="desktop-icon icon-photo" href="photo-video.html">
      <img class="icon-glyph" src="img/camera95.jpg" alt="" width="48" height="48">
      <span class="label">Photo &amp;<br>Video</span>
    </a>

    <a class="desktop-icon icon-web" href="web-design.html">
      <img class="icon-glyph" src="img/computer95.png" alt="" width="48" height="48">
      <span class="label">Website<br>Work</span>
    </a>

    <a class="desktop-icon icon-about" href="about.html">
      <img class="icon-glyph" src="img/about95.png" alt="" width="48" height="48">
      <span class="label">About<br>Me</span>
    </a>

    <a class="desktop-icon icon-contact" href="contact.html">
      <img class="icon-glyph" src="img/mail95.png" alt="" width="48" height="48">
      <span class="label">Get In<br>Touch</span>
    </a>

    <a class="desktop-icon icon-recycle" href="#" title="nothing to see here" onclick="return false;">
      <img class="icon-glyph" src="img/recycle95.png" alt="" width="48" height="48">
      <span class="label">Recycle<br>Bin</span>
    </a>

  </div>`;

const TASKBAR_H = 40;
const ON_HOME = /(^|\/)(index\.html)?$/.test(window.location.pathname);

// Some embedded/preview renderers report window.innerWidth as 0 — fall back.
const vpW = () => window.innerWidth || document.documentElement.clientWidth || 1024;
const vpH = () => window.innerHeight || document.documentElement.clientHeight || 768;

// z-index pool for window stacking — kept below the taskbar (100).
let zTop = 50;
function bringToFront(win) {
  zTop = Math.min(zTop + 1, 99);
  win.style.zIndex = zTop;
}

// Turn a static .window into a draggable / resizable OS-style window.
function setupWindow(win) {
  const titleBar = win.querySelector(".title-bar");
  if (!titleBar) return;
  const controls = win.querySelector(".title-bar-controls");

  // Pick a tidy starting geometry, centred in the space right of the icon column.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
  const vw = vpW();
  const vh = vpH();
  const iconCol = vw > 600 ? 132 : 8; // icons sit down the left edge on wide screens
  const maxH = vh - TASKBAR_H - 24;

  win.classList.add("win-managed");
  win.style.maxWidth = "none";
  win.style.maxHeight = "none";

  // Width first (drives text wrapping), then measure the content for the height.
  const w = clamp(600, 300, Math.min(vw - iconCol - 24, 760));
  win.style.width = w + "px";
  win.style.height = "auto";
  void win.offsetHeight; // force reflow so the measurement below is real
  const natural = titleBar.offsetHeight + (win.querySelector(".window-body").scrollHeight || 0) + 12;
  const h = clamp(natural, 180, maxH);

  const avail = vw - iconCol - 24 - w;
  const left = iconCol + (avail > 0 ? avail / 2 : 8);
  const top = clamp((vh - TASKBAR_H - h) / 3, 16, Math.max(16, vh - TASKBAR_H - h - 8));

  Object.assign(win.style, {
    left: left + "px",
    top: top + "px",
    height: h + "px",
  });
  bringToFront(win);
  win.addEventListener("pointerdown", () => bringToFront(win), true);

  // ---- maximize state (shared with the drag handler) ----
  let restore = null;
  const captureRestore = () => {
    restore = {
      left: win.style.left,
      top: win.style.top,
      width: win.style.width,
      height: win.style.height,
    };
  };
  const unmaximize = () => {
    win.classList.remove("is-maximized");
    if (restore) Object.assign(win.style, restore);
  };

  // ---- drag via the title bar (pulling down also un-maximizes) ----
  let drag = null;
  titleBar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || (controls && controls.contains(e.target))) return;
    const r = win.getBoundingClientRect();
    drag = {
      x: e.clientX,
      y: e.clientY,
      left: parseFloat(win.style.left) || 0,
      top: parseFloat(win.style.top) || 0,
      grabFracX: r.width ? (e.clientX - r.left) / r.width : 0.5,
      grabOffsetY: e.clientY - r.top,
      maximized: win.classList.contains("is-maximized"),
    };
    titleBar.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  titleBar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const edge = 40; // keep at least this much of the bar on-screen

    // Tear a maximized window loose once the pointer has moved a little, and
    // drop it under the cursor at its restored size so the drag continues.
    if (drag.maximized) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.maximized = false;
      unmaximize();
      const nx = clamp(
        e.clientX - drag.grabFracX * win.offsetWidth,
        edge - win.offsetWidth,
        vpW() - edge
      );
      const ny = clamp(e.clientY - drag.grabOffsetY, 0, vpH() - TASKBAR_H - edge);
      win.style.left = nx + "px";
      win.style.top = ny + "px";
      Object.assign(drag, { left: nx, top: ny, x: e.clientX, y: e.clientY });
      return;
    }

    let nx = drag.left + (e.clientX - drag.x);
    let ny = drag.top + (e.clientY - drag.y);
    nx = Math.min(Math.max(nx, edge - win.offsetWidth), vpW() - edge);
    ny = Math.min(Math.max(ny, 0), vpH() - TASKBAR_H - edge);
    win.style.left = nx + "px";
    win.style.top = ny + "px";
  });
  const endDrag = (e) => {
    drag = null;
    if (e && e.pointerId != null) {
      try { titleBar.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  titleBar.addEventListener("pointerup", endDrag);
  titleBar.addEventListener("pointercancel", endDrag);

  // ---- resize via a bottom-right grip ----
  const grip = document.createElement("div");
  grip.className = "win-resize";
  grip.setAttribute("aria-hidden", "true");
  win.appendChild(grip);
  let rs = null;
  grip.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || win.classList.contains("is-maximized")) return;
    rs = { x: e.clientX, y: e.clientY, w: win.offsetWidth, h: win.offsetHeight };
    grip.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });
  grip.addEventListener("pointermove", (e) => {
    if (!rs) return;
    const left = parseFloat(win.style.left);
    const top = parseFloat(win.style.top);
    const nw = clamp(rs.w + (e.clientX - rs.x), 280, vpW() - left - 8);
    const nh = clamp(rs.h + (e.clientY - rs.y), 150, vpH() - TASKBAR_H - top - 8);
    win.style.width = nw + "px";
    win.style.height = nh + "px";
  });
  const endResize = (e) => {
    rs = null;
    if (e && e.pointerId != null) {
      try { grip.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  grip.addEventListener("pointerup", endResize);
  grip.addEventListener("pointercancel", endResize);

  // ---- maximize / restore ----
  function toggleMax() {
    if (win.classList.contains("is-maximized")) {
      unmaximize();
    } else {
      captureRestore();
      win.classList.add("is-maximized");
    }
  }
  const maxBtn = controls && controls.querySelector('button[aria-label="Maximize"]');
  if (maxBtn) maxBtn.addEventListener("click", toggleMax);
  titleBar.addEventListener("dblclick", (e) => {
    if (controls && controls.contains(e.target)) return;
    toggleMax();
  });

  // ---- minimize / restore from the taskbar ----
  const minBtn = controls && controls.querySelector('button[aria-label="Minimize"]');
  const taskBtn = document.querySelector(".taskbar-links .btn-task.active");
  if (minBtn) {
    minBtn.addEventListener("click", () => win.classList.add("is-minimized"));
  }
  if (taskBtn) {
    taskBtn.addEventListener("click", (e) => {
      if (win.classList.contains("is-minimized")) {
        e.preventDefault();
        win.classList.remove("is-minimized");
        bringToFront(win);
      }
    });
  }

  // ---- close: sub-pages go back to the desktop; home just tidies up ----
  const closeBtn = controls && controls.querySelector('button[aria-label="Close"]');
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (!ON_HOME) window.location.href = "index.html";
      else win.classList.add("is-minimized");
    });
  }

  // Keep the window reachable if the viewport shrinks.
  window.addEventListener("resize", () => {
    if (win.classList.contains("is-maximized")) return;
    const cx = Math.min(parseFloat(win.style.left), vpW() - 60);
    const cy = Math.min(parseFloat(win.style.top), vpH() - TASKBAR_H - 40);
    win.style.left = Math.max(60 - win.offsetWidth, cx) + "px";
    win.style.top = Math.max(0, cy) + "px";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Put the app icons on the left of every page that doesn't already have them.
  if (!document.querySelector(".desktop-icons")) {
    document.body.insertAdjacentHTML("afterbegin", DESKTOP_ICONS_HTML);
  }

  const startBtn = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");
  if (startBtn && startMenu) {
    startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startMenu.style.display = startMenu.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!startMenu.contains(e.target) && e.target !== startBtn) {
        startMenu.style.display = "none";
      }
    });
  }

  // Make every content window behave like a real desktop window. Skip it on
  // narrow screens, where the page is better as a normal scrolling document.
  // Wait for full load (CDN stylesheet + fonts) plus a beat so layout settles.
  const initWindows = () => {
    if (vpW() <= 600) return;
    setTimeout(
      () => document.querySelectorAll(".window.content-window").forEach(setupWindow),
      60
    );
  };
  if (document.readyState === "complete") initWindows();
  else window.addEventListener("load", initWindows, { once: true });
});
