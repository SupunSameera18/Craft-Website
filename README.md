# Craft-Website

Website for selling arts and crafts, for **Kraft Lady by Sara**.

Live site: https://supunsameera18.github.io/Craft-Website/

## Pages

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Hero sections, flower animation, links to Vlog/Blog |
| Vlog | `vlog.html` | Auto-pulls videos from the YouTube channel via YouTube Data API v3 |
| Blog | `blog.html` | Posts stored in Firebase Realtime Database; admin panel to publish/edit/delete |
| Shop | `shop.html` | Coming soon placeholder |
| Downloads | `downloads.html` | Coming soon placeholder |
| Contact Me | `contact.html` | Form submits to Formspree (`https://formspree.io/f/xqakbaez`) |
| 404 | `404.html` | Served automatically by GitHub Pages for unmatched URLs |

## Tech stack

Plain HTML/CSS/JS — no framework, no bundler. Bootstrap 4.5.2, jQuery 3.5.1, Popper 2.5.4, Font Awesome 5.15.1, and AOS 2.3.4 are loaded from CDNs (all pinned with SRI hashes). Google Fonts (Gupter, Julee) plus a self-hosted display font (`fonts/Brastika-Black.ttf`).

Data/services:
- **Firebase Realtime Database** — stores blog posts.
- **Firebase Authentication** (email/password) — gates the blog admin panel.
- **YouTube Data API v3** — powers the Vlog page video list.
- **Formspree** — handles the contact form submission.

## Project structure

```
pages/        source HTML templates — edit these, not the root .html files
partials/     shared fragments included into every page:
              nav.html, footer.html, head.html (CDN <link> tags), scripts-common.html (CDN <script> tags)
js/           one file per feature, loaded only on the pages that need it:
              main.js (AOS init, every page), flowers.js (index only),
              vlog.js (vlog only), blog.js (blog only)
styles.css    single stylesheet for the whole site
fonts/        self-hosted font files
images/       site images
build.js      stitches pages/ + partials/ into the root *.html files
robots.txt, sitemap.xml   SEO basics, point at the live GitHub Pages URL
```

The root `index.html`, `blog.html`, `contact.html`, `downloads.html`, `shop.html`, `vlog.html`, and `404.html` are **generated files** — GitHub Pages serves them directly from the repo root (legacy branch deploy, no CI build step), so they have to exist as real files, but they should always match what's in `pages/` + `partials/`.

## Local preview

No build step is required to preview — open `index.html` directly in a browser, or serve the folder locally, e.g.:

```
npx serve .
```

## Editing a page

1. Edit the relevant file in `pages/`, or `partials/nav.html` / `partials/footer.html` for site-wide nav/footer changes, or `partials/head.html` / `partials/scripts-common.html` for shared CDN tags.
2. Run `npm run build` (or `node build.js`) to regenerate the root `.html` files.
3. Commit **both** the `pages/`/`partials/` changes and the regenerated root files, then push. Don't hand-edit the root `.html` files — the next build will overwrite them.

## Admin login (Blog page)

The blog's admin panel is protected by Firebase Authentication (email/password) — not a hardcoded password. To grant someone admin access:

1. Firebase console → project `kraft-website-4f5dc` → **Authentication → Sign-in method** → enable **Email/Password**.
2. **Authentication → Users → Add user** — create an email/password for that admin. This is what they'll type into the blog's login modal.
3. **Realtime Database → Rules**, make sure writes require auth:
   ```json
   {
     "rules": {
       "blogPosts": {
         ".read": true,
         ".write": "auth != null"
       }
     }
   }
   ```
   Posts stay publicly readable (so the blog page works for visitors), but only a signed-in admin can create, edit, or delete them.

The `apiKey`/`databaseURL`/etc. in `js/blog.js` are Firebase's public client config — not secrets. They're safe to have visible in the browser; the rules above are what actually control access.

## YouTube Vlog setup

`js/vlog.js` needs a YouTube Data API v3 key to auto-fetch videos. Until one is set, the Vlog page just shows a "Visit YouTube Channel" button.

1. https://console.cloud.google.com/apis/credentials → create/select a project → enable **YouTube Data API v3** → create an API key (restrict it to that API).
2. Paste the key into `API_KEY` near the top of `js/vlog.js` (replacing `"YOUR_YOUTUBE_API_KEY_HERE"`).
3. Rebuild if needed and redeploy. Videos ≤60 seconds (Shorts) are filtered out automatically.

## Deployment

GitHub Pages, legacy build, deploying straight from the `main` branch root — whatever is committed to the root `.html`/`.css`/`.js`/asset files is what's live. There is no CI/CD step, so remember to run the build script (see above) and commit its output before pushing.
