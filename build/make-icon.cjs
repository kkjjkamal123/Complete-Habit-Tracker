// Rasterise the branded SVG into the icons electron-builder needs:
//   build/icon.png          — 1024×1024, source for the Windows .ico
//   build/icons/<n>x<n>.png  — full size set for the Linux icon theme
//
// Why the set: electron-builder installs each Linux size into
// /usr/share/icons/hicolor/<n>x<n>/apps. A lone 1024×1024 icon isn't a standard
// menu-icon size, so desktop launchers can't find a usable icon and fall back to
// a generic one. Shipping 16–512 fixes the app-list icon.
const { Resvg } = require('@resvg/resvg-js');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, 'icon-src.svg'));
const iconsDir = path.join(__dirname, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const render = (size) =>
  new Resvg(src, { fitTo: { mode: 'width', value: size } }).render().asPng();

// Linux icon-theme set.
const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
for (const s of sizes) {
  fs.writeFileSync(path.join(iconsDir, `${s}x${s}.png`), render(s));
}

// Single 1024 PNG for the Windows .ico.
fs.writeFileSync(path.join(__dirname, 'icon.png'), render(1024));

console.log(`wrote build/icon.png + build/icons/{${sizes.join(',')}}`);
