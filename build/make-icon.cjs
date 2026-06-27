// Rasterise the branded SVG to a 1024×1024 PNG that electron-builder turns into
// the Linux icon set and the Windows .ico.
const { Resvg } = require('@resvg/resvg-js');
const fs = require('node:fs');
const path = require('node:path');

const src = path.join(__dirname, 'icon-src.svg');
const out = path.join(__dirname, 'icon.png');

const resvg = new Resvg(fs.readFileSync(src), { fitTo: { mode: 'width', value: 1024 } });
fs.writeFileSync(out, resvg.render().asPng());
console.log('wrote', out);
