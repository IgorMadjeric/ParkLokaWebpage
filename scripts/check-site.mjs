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

if (issues.length) {
    console.error(`ParkLoka website checks failed (${issues.length}):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
}

console.log(`ParkLoka website checks passed: ${htmlFiles.length} HTML files, ${requiredFiles.length} required release files, ${pages.size} canonical routes.`);
