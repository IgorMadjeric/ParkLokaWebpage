# ParkLoka Website

Static bilingual website for ParkLoka. The repository intentionally has no package manager, build step, analytics, or runtime framework.

## Local preview

From the repository root, start any static HTTP server. With Python available:

```powershell
py -m http.server 8080
```

Then open:

- English: <http://localhost:8080/>
- German: <http://localhost:8080/de/>
- Error page: <http://localhost:8080/404.html>

Opening the HTML files directly also works, but an HTTP server more closely matches GitHub Pages routing.

## Release checks

Run the dependency-free checker from the repository root:

```powershell
node scripts/check-site.mjs
node scripts/check-contrast.mjs
```

The checks validate the required GitHub Pages and AdMob files, public canonical and language-alternate metadata, social preview and icon assets, Google Play links, semantic landmarks, keyboard skip links, reduced-motion handling, static performance budgets, duplicate IDs, in-page anchors, local file targets, and WCAG contrast ratios for the shared light/dark color tokens. They also reject committed AdMob application or ad-unit IDs; only the public publisher record belongs in `app-ads.txt`.

## Live deployment

The public site is deployed from branch **main**, folder **/ (root)** in [IgorMadjeric/ParkLokaWebpage](https://github.com/IgorMadjeric/ParkLokaWebpage). The custom domain is live with HTTPS enforcement:

- Website: <https://parkloka.app/>
- English privacy policy: <https://parkloka.app/privacy/>
- German privacy policy: <https://parkloka.app/de/datenschutz/>
- English legal notice: <https://parkloka.app/legal/>
- German Impressum: <https://parkloka.app/de/impressum/>
- AdMob publisher declaration: <https://parkloka.app/app-ads.txt>

Keep the root `CNAME` exactly `parkloka.app`, retain the GitHub Pages DNS records, and run the release checks before pushing changes to `main`.

## Structure

```text
assets/
  css/site.css
  images/app-icon.svg
  images/social-preview.png
de/
  index.html
docs/planning/
docs/verification/
scripts/check-contrast.mjs
scripts/check-site.mjs
404.html
CNAME
app-ads.txt
index.html
manifest.webmanifest
robots.txt
sitemap.xml
```

Changes pushed to `main` are published automatically by GitHub Pages.

## Production application

Production availability was confirmed by the owner on 2026-10-01. Both localized homepages offer direct downloads from [Google Play](https://play.google.com/store/apps/details?id=app.parkloka). This date records confirmation, not the original launch date.
