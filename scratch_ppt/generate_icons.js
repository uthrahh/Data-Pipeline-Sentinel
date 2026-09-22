const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Lu = require('react-icons/lu');

const OUT_DIR = path.join(__dirname, 'icons');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// name -> [iconComponentKey, color]
const ICONS = {
  eye: ['LuEye', 'FFFFFF'],
  search: ['LuSearch', 'FFFFFF'],
  wrench: ['LuWrench', 'FFFFFF'],
  workflow: ['LuWorkflow', 'FFFFFF'],
  bot: ['LuBot', 'FFFFFF'],
  trendingUp: ['LuTrendingUp', 'FFFFFF'],
  shieldCheck: ['LuShieldCheck', 'FFFFFF'],
  listChecks: ['LuListChecks', 'FFFFFF'],
  clock: ['LuClock', 'FFFFFF'],
  network: ['LuNetwork', 'FFFFFF'],
  userCheck: ['LuUserCheck', 'FFFFFF'],
  circleArrowUp: ['LuCircleArrowUp', 'FFFFFF'],
  circleCheckBig: ['LuCircleCheckBig', 'FFFFFF'],
  triangleAlert: ['LuTriangleAlert', 'FFFFFF'],
  database: ['LuDatabase', 'FFFFFF'],
  sparkles: ['LuSparkles', 'FFFFFF'],
  gauge: ['LuGauge', 'FFFFFF'],
  users: ['LuUsers', 'FFFFFF'],
  fileWarning: ['LuFileWarning', 'FFFFFF'],
  rotateCcw: ['LuRotateCcw', 'FFFFFF'],
  messageSquare: ['LuMessageSquare', 'FFFFFF'],
  // dark-red variants for use on white backgrounds
  eyeRed: ['LuEye', '7A121B'],
  searchRed: ['LuSearch', '7A121B'],
  wrenchRed: ['LuWrench', '7A121B'],
};

async function run() {
  for (const [name, [key, color]] of Object.entries(ICONS)) {
    const Comp = Lu[key];
    if (!Comp) {
      console.error('MISSING ICON', key);
      continue;
    }
    const svgMarkup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { color: `#${color}`, size: 256, strokeWidth: 1.75 })
    );
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24">${svgMarkup.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`;
    const pngPath = path.join(OUT_DIR, `${name}.png`);
    await sharp(Buffer.from(fullSvg)).resize(256, 256).png().toFile(pngPath);
    console.log('wrote', pngPath);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
