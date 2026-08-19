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

Opening the HTML files directly also works, but an HTTP server more closely matches GitHub Pages routing.

## Structure

```text
assets/
  css/site.css
  images/
de/
  index.html
docs/planning/
index.html
```

The website stays local until P1-F02-T6 explicitly connects and pushes the approved GitHub remote.
