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

// Start menu toggle (home page + shared taskbar)
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

  // Closing a window ([x] in the title bar) sends you back to the desktop.
  const onHome = /(^|\/)(index\.html)?$/.test(window.location.pathname);
  if (!onHome) {
    document.querySelectorAll('.title-bar-controls button[aria-label="Close"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    });
  }
});
