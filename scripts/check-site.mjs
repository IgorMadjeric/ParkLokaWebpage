import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];
const requiredFiles = [
    ".nojekyll",
    "404.html",
    "CNAME",
    "app-ads.txt",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
    "assets/css/site.css",
    "assets/images/icons.svg",
    "assets/images/app-icon.svg",
    "assets/images/app-icon-192.png",
    "assets/images/app-icon-512.png",
    "assets/images/social-preview.png",
    "scripts/check-contrast.mjs",
];

const pages = new Map([
    ["index.html", { canonical: "https://parkloka.app/", en: "https://parkloka.app/", de: "https://parkloka.app/de/", fallback: "https://parkloka.app/", play: true }],
    ["de/index.html", { canonical: "https://parkloka.app/de/", en: "https://parkloka.app/", de: "https://parkloka.app/de/", fallback: "https://parkloka.app/", play: true }],
    ["privacy/index.html", { canonical: "https://parkloka.app/privacy/", en: "https://parkloka.app/privacy/", de: "https://parkloka.app/de/datenschutz/", fallback: "https://parkloka.app/privacy/" }],
    ["de/datenschutz/index.html", { canonical: "https://parkloka.app/de/datenschutz/", en: "https://parkloka.app/privacy/", de: "https://parkloka.app/de/datenschutz/", fallback: "https://parkloka.app/privacy/" }],
    ["legal/index.html", { canonical: "https://parkloka.app/legal/", en: "https://parkloka.app/legal/", de: "https://parkloka.app/de/impressum/", fallback: "https://parkloka.app/legal/" }],
    ["de/impressum/index.html", { canonical: "https://parkloka.app/de/impressum/", en: "https://parkloka.app/legal/", de: "https://parkloka.app/de/impressum/", fallback: "https://parkloka.app/legal/" }],
]);

function check(condition, message) {
    if (!condition) issues.push(message);
}

function read(relativePath) {
    return readFileSync(path.join(root, relativePath), "utf8");
}

function walk(directory) {
    const result = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if ([".git", "docs"].includes(entry.name)) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) result.push(...walk(absolute));
        else result.push(absolute);
    }
    return result;
}

for (const file of requiredFiles) check(existsSync(path.join(root, file)), `Missing required file: ${file}`);

check(read("CNAME").trim() === "parkloka.app", "CNAME must contain only parkloka.app");
check(
    read("app-ads.txt").trim() === "google.com, pub-9287466600239808, DIRECT, f08c47fec0942fa0",
    "app-ads.txt does not match the confirmed ParkLoka AdMob publisher record",
);

const robots = read("robots.txt");
check(robots.includes("User-agent: *") && robots.includes("Allow: /"), "robots.txt must allow public crawling");
check(robots.includes("Sitemap: https://parkloka.app/sitemap.xml"), "robots.txt must advertise the canonical sitemap");

const sitemap = read("sitemap.xml");
for (const page of pages.values()) check(sitemap.includes(`<loc>${page.canonical}</loc>`), `Sitemap missing ${page.canonical}`);
check(!sitemap.includes("404.html"), "The 404 page must not be indexed in sitemap.xml");

const allFiles = walk(root);
for (const absolute of allFiles) {
    if (!/\.(?:html|css|xml|txt|json|webmanifest|mjs|svg)$/i.test(absolute)) continue;
    const content = readFileSync(absolute, "utf8");
    check(!/ca-app-pub-\d+/i.test(content), `Application or ad-unit ID exposed in ${path.relative(root, absolute)}`);
}

const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
for (const absolute of htmlFiles) {
    const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
    const html = readFileSync(absolute, "utf8");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    check(ids.length === new Set(ids).size, `${relative} contains duplicate id values`);
    check((html.match(/<main\b/g) ?? []).length === 1, `${relative} must contain exactly one main landmark`);
    check((html.match(/<h1\b/g) ?? []).length === 1, `${relative} must contain exactly one h1`);
    check(/<html\s+lang="(?:en|de)"/.test(html), `${relative} must declare an English or German document language`);
    check(html.includes('class="skip-link" href="#main-content"'), `${relative} is missing the keyboard skip link`);
    check(ids.includes("main-content"), `${relative} is missing the skip-link target`);
    check(!/<img\b(?![^>]*\balt=)[^>]*>/i.test(html), `${relative} contains an image without alt text`);
    check(!/<script\b/i.test(html), `${relative} must remain script-free`);
    check(!/tabindex="-[1-9]/i.test(html), `${relative} removes content from the keyboard focus order`);
    check(!/\son(?:click|keydown|keyup)=/i.test(html), `${relative} uses inline interaction handlers`);

    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const raw = match[1];
        if (/^(?:https?:|mailto:|tel:|data:)/i.test(raw)) continue;
        const [localPath, fragment] = raw.split("#", 2);
        if (fragment && !localPath) check(ids.includes(fragment), `${relative} links to missing #${fragment}`);
        if (!localPath) continue;
        const clean = localPath.split("?")[0];
        let target = clean.startsWith("/") ? path.join(root, clean.slice(1)) : path.resolve(path.dirname(absolute), clean);
        if (clean.endsWith("/")) target = path.join(target, "index.html");
        if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, "index.html");
        check(existsSync(target), `${relative} links to missing local target ${raw}`);
    }

    if (pages.has(relative)) {
        const page = pages.get(relative);
        check(html.includes(`<link rel="canonical" href="${page.canonical}">`), `${relative} has an incorrect canonical URL`);
        check(html.includes(`<link rel="alternate" hreflang="en" href="${page.en}">`), `${relative} is missing its English alternate`);
        check(html.includes(`<link rel="alternate" hreflang="de" href="${page.de}">`), `${relative} is missing its German alternate`);
        check(html.includes(`<link rel="alternate" hreflang="x-default" href="${page.fallback}">`), `${relative} is missing its x-default alternate`);
        check(html.includes(`<meta property="og:url" content="${page.canonical}">`), `${relative} has an incorrect Open Graph URL`);
        check(html.includes("https://parkloka.app/assets/images/social-preview.png"), `${relative} is missing the canonical social preview`);
        check(html.includes("name=\"twitter:card\" content=\"summary_large_image\""), `${relative} is missing the Twitter card type`);
        check(html.includes("rel=\"icon\""), `${relative} is missing the favicon`);
        if (page.play) check(html.includes("https://play.google.com/store/apps/details?id=app.parkloka"), `${relative} is missing the Google Play listing link`);
    }
}

check(read("404.html").includes('name="robots" content="noindex"'), "404.html must be excluded from indexing");

const css = read("assets/css/site.css");
check(css.includes("@media (prefers-color-scheme: dark)"), "site.css must retain the system dark-theme media query");
check(css.includes("@media (prefers-reduced-motion: reduce)"), "site.css must honor reduced-motion preferences");
check(css.includes("scroll-behavior: auto"), "The reduced-motion treatment must disable smooth scrolling");
check(css.includes("animation-duration: 0.01ms !important"), "The reduced-motion treatment must minimize animation duration");
check(css.includes("transition-duration: 0.01ms !important"), "The reduced-motion treatment must minimize transition duration");
check(css.includes("a:focus-visible, .button:focus-visible"), "Interactive links and buttons must expose a visible focus treatment");

const landingLinks = new Map([
    ["index.html", ["privacy/index.html", "legal/index.html"]],
    ["de/index.html", ["datenschutz/index.html", "impressum/index.html"]],
]);
for (const [page, links] of landingLinks) {
    const html = read(page);
    for (const link of links) check(html.includes(`href="${link}"`), `${page} is missing legal link ${link}`);
}

const publicFiles = allFiles.filter((file) => {
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    return !relative.startsWith("scripts/") && relative !== "README.md";
});
const publicBytes = publicFiles.reduce((total, file) => total + statSync(file).size, 0);
for (const file of htmlFiles) check(statSync(file).size <= 64 * 1024, `${path.relative(root, file)} exceeds the 64 KiB HTML budget`);
check(statSync(path.join(root, "assets/css/site.css")).size <= 48 * 1024, "site.css exceeds the 48 KiB CSS budget");
check(publicBytes <= 512 * 1024, `Static release payload exceeds 512 KiB (${publicBytes} bytes)`);

if (issues.length) {
    console.error(`ParkLoka website checks failed (${issues.length}):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
}

console.log(`ParkLoka website checks passed: ${htmlFiles.length} HTML files, ${requiredFiles.length} required release files, ${pages.size} canonical routes, ${publicBytes} static bytes.`);
