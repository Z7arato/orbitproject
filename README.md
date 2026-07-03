# Orbit — Space Technology Landing Page

A single-page landing site for a fictional space exploration company, built from a
StitchAI-generated design ("Celestial Immersion" — deep space glassmorphism + neon).

## Structure

- `index.html` — page markup only (header/nav, hero, stats, missions, rockets catalog, tech, CTA, footer)
- `style.css` — hand-written custom CSS (glass/glow effects, base theme, responsive fine-tuning). Tailwind's design tokens (colors, spacing, fonts) stay configured inside `index.html` via the Tailwind CDN's JS config object, since that's not plain CSS
- `app.js` — all site interactivity (welcome modal + localStorage, header scroll state, burger menu, scroll-to-top, live SpaceX API fetch, ScrollReveal setup). Loaded with `defer` so it runs after the DOM is parsed
- `assets/images/` — local images (placeholders included, swap for real photos before submitting)

## Running locally

No build step needed — it's a static file.

```
# just open it
open index.html

# or serve it (recommended, avoids some CORS quirks)
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Replacing the placeholder images

The generated placeholders are gradient starfields so the page isn't broken out of the box.
For submission, replace these with real photos (same filenames, any aspect ratio close to the
original works):

| File | Suggested subject |
|---|---|
| `assets/images/hero-nebula.jpg` | Wide nebula / starfield shot |
| `assets/images/mission-artemis.jpg` | Spacecraft near Earth |
| `assets/images/mission-mars.jpg` | Mars surface / probe |
| `assets/images/mission-station.jpg` | Space station module |
| `assets/images/rocket-fallback.jpg` | Rocket on launchpad (used only if the live API has no photo for a rocket) |

Good free sources: unsplash.com, pexels.com — search "nebula", "spacecraft earth orbit",
"mars rover", "space station", "rocket launch".

## Deploying to GitHub Pages

1. Create a new GitHub repo, e.g. `orbit-landing`.
2. Push this folder:
   ```
   git init
   git add .
   git commit -m "Orbit landing page"
   git branch -M main
   git remote add origin https://github.com/<your-username>/orbit-landing.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from branch → main / (root)**.
4. Your live link will be `https://<your-username>.github.io/orbit-landing/`.

## Requirements checklist (per assignment)

- [x] Semantic HTML5 tags (`header`, `nav`, `main`, `section`, `footer`)
- [x] Hover effects / transitions (buttons, cards, nav links, glow effects)
- [x] Responsive down to 320px (checked at 1024 / 768 / 480 / 320)
- [x] Custom fonts (Space Grotesk, Inter, JetBrains Mono via Google Fonts)
- [x] Burger menu (mobile nav toggle)
- [x] Live server data via `fetch` + `async/await` (Launch Library 2 API `/config/launcher/`, with a local fallback dataset if the request fails)
- [x] Extra JS logic: dropdown nav, header background on scroll, scroll-to-top,
      scroll-triggered section animations (ScrollReveal.js)
- [x] `localStorage` (welcome modal only shows once — same pattern as a cookie notice)
- [x] 8 sections total (well above the 5-6 minimum for a landing page)
- [x] No jQuery, no Bootstrap JS
- [ ] **You still need to:** swap placeholder images, push to GitHub, enable Pages

## Presentation notes — explaining the JavaScript

`app.js` is organized into six named functions, all called once from a single
`DOMContentLoaded` listener. Talking points for each:

1. **`initWelcomeModal()`** — Checks `localStorage.getItem('orbit_visited')`. If nothing is
   stored, it shows the welcome modal. Clicking "Accept" hides it and writes
   `orbit_visited = true`, so it won't show again on future visits — the same mechanism a
   cookie-consent banner uses.

2. **`initHeaderScroll()`** — Listens to `scroll` on `window`. Past 50px of scroll, it adds a
   blurred background + shrinks padding on the fixed header, so it goes from a transparent bar
   over the hero image to a solid "docked" nav once you're reading content.

3. **`initMobileMenu()`** — Toggles a `translate-x-full` class on the mobile nav panel (slides
   it on/off screen) and swaps the menu/close icon. Also locks page scroll (`body.style.overflow
   = 'hidden'`) while the menu is open, and auto-closes when a link is tapped.

4. **`initScrollToTop()`** — Shows a floating button once you've scrolled past 800px, hides it
   otherwise, and smooth-scrolls to the top on click.

5. **`fetchRockets()`** — The core data requirement. Uses `async/await` with `fetch()` to call
   the public Launch Library 2 API (`GET https://ll.thespacedevs.com/2.2.0/config/launcher/`),
   then builds a card per rocket (name, dimensions, description, maiden-flight year, and photo)
   and injects them into the DOM. Wrapped in `try/catch`: if the live request fails — offline,
   rate-limited, or any other network issue — it falls back to a small built-in dataset
   (`FALLBACK_ROCKETS`) so the section still renders correctly, which is safer for a live demo
   than showing a broken/empty page.

   > **Why not the SpaceX API?** The original StitchAI export called `api.spacexdata.com`,
   > which stopped sending CORS headers — browsers now block that request outright
   > (`No 'Access-Control-Allow-Origin' header is present`). Launch Library 2 serves the
   > same kind of data (real rockets, real specs) and is reachable from client-side JS.

6. **`initScrollReveal()`** — Configures the ScrollReveal.js library once, then registers which
   elements fade/slide in in as they enter the viewport (hero text, mission cards, tech cards,
   stat numbers), each with slightly staggered delays for a cascading effect.
