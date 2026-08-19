const pairs = [
    ["light background text", "#1b1d27", "#f7f7fb", 4.5],
    ["light surface text", "#1b1d27", "#ffffff", 4.5],
    ["light secondary text", "#505464", "#f7f7fb", 4.5],
    ["light primary action", "#ffffff", "#6554d9", 4.5],
    ["light primary container", "#21105f", "#e6e0ff", 4.5],
    ["light secondary container", "#211b36", "#e8e2ff", 4.5],
    ["light success container", "#002113", "#bff0d3", 4.5],
    ["light destructive container", "#410002", "#ffdad6", 4.5],
    ["light focus ring", "#6554d9", "#f7f7fb", 3],
    ["dark background text", "#f4f5f8", "#181a22", 4.5],
    ["dark surface text", "#f4f5f8", "#232633", 4.5],
    ["dark secondary text", "#b2b6c4", "#181a22", 4.5],
    ["dark primary action", "#16005c", "#8b7cff", 4.5],
    ["dark primary container", "#e8e2ff", "#3e2b75", 4.5],
    ["dark secondary container", "#e7e0ff", "#403a50", 4.5],
    ["dark success container", "#c3f4d8", "#15583d", 4.5],
    ["dark destructive container", "#ffdad8", "#681d24", 4.5],
    ["dark focus ring", "#8b7cff", "#181a22", 3],
];

function linearize(channel) {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16));
    const [red, green, blue] = rgb.map(linearize);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    return (lighter + 0.05) / (darker + 0.05);
}

const failures = [];
for (const [name, foreground, background, minimum] of pairs) {
    const ratio = contrast(foreground, background);
    console.log(`${name}: ${ratio.toFixed(2)}:1 (minimum ${minimum}:1)`);
    if (ratio < minimum) failures.push(`${name} is ${ratio.toFixed(2)}:1, below ${minimum}:1`);
}

if (failures.length) {
    console.error(`ParkLoka contrast checks failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}

console.log(`ParkLoka contrast checks passed: ${pairs.length} light/dark foreground pairs.`);
