# Portfolio site
Plain HTML/CSS, no build step. Uses [98.css](https://jdan.github.io/98.css/) via CDN for the Windows 95 UI chrome, plus a custom `css/style.css`.

## Files

```
index.html         front page — one dynamic page; every section opens as a window
js/app.js          the one-page desktop logic (window manager, taskbar, launchers)
classic.html       the older multi-page desktop (still linked from the Start menu)
app.html           redirect stub -> index.html

photo-video.html   photo & video gallery      (also a no-JS fallback for index.html)
web-design.html    website case studies       (   "   )
about.html         about page                 (   "   )
contact.html       contact form (mailto)      (   "   )
recycle-bin.html   games / screensavers bin   (   "   )
games/, viz/       iframed mini-apps launched from the Recycle Bin

css/style.css      custom theme layer
js/script.js       shared window mechanics (drag/resize/min/max), clock, start menu
img/               icons + screenshots
```
