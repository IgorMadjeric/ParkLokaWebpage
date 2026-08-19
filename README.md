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

## GitHub Pages publication

Publication is intentionally deferred to P1-F02-T6. After the approved remote has been connected and the local branch has been renamed and pushed as `main`:

1. Open the public repository on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main**, folder **/ (root)**, and save.
4. Set the custom domain to `parkloka.app`. The committed root `CNAME` must remain exactly `parkloka.app`.
5. Configure the apex-domain DNS records required by GitHub Pages, wait for DNS verification, then enable **Enforce HTTPS**.
6. Verify `/`, `/de/`, both privacy routes, both legal routes, `/404.html`, `/sitemap.xml`, `/robots.txt`, and `/app-ads.txt` over HTTPS.
7. Set `https://parkloka.app/` as the developer website in the Google Play listing. AdMob discovers the confirmed publisher declaration at `https://parkloka.app/app-ads.txt` from that hostname.

Do not add DNS records or change repository settings until T6 has explicit authorization. See GitHub's [publishing-source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom-domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) documentation.

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

The website stays local until P1-F02-T6 explicitly connects and pushes the approved GitHub remote.
