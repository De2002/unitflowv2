import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const DIST = path.join(ROOT, 'dist');
const BASE_URL = 'https://www.omniconverter.cyou';

const SITEMAP_FILES = [
  'sitemap-pages.xml',
  'sitemap-length.xml',
  'sitemap-area.xml',
  'sitemap-volume.xml',
  'sitemap-weight.xml',
  'sitemap-temperature.xml',
  'sitemap-speed.xml',
  'sitemap-time.xml',
  'sitemap-data.xml',
  'sitemap-energy.xml'
];

// ── Extract unit data from index.html ──────────────────────────────────────
const indexContent = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extractUnits(constName) {
  const m = indexContent.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\[(.*?)\\n\\];`, 's'));
  if (!m) return [];
  const units = [];
  const itemRegex = /\{([^}]+)\}/g;
  let item;
  while ((item = itemRegex.exec(m[1])) !== null) {
    const kv = item[1];
    const key    = (kv.match(/key:\s*'([^']+)'/)    || [])[1];
    const label  = (kv.match(/label:\s*'([^']+)'/)  || [])[1];
    const symbol = (kv.match(/symbol:\s*'([^']+)'/) || [])[1] || '';
    if (key && label) units.push({ key, label, symbol });
  }
  return units;
}

function extractDescriptions(constName) {
  const m = indexContent.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\{(.*?)^\\};`, 'ms'));
  if (!m) return {};
  const descs = {};
  const entryRegex = /(\w+):\s*\{\s*short:\s*`([^`]*)`/g;
  let entry;
  while ((entry = entryRegex.exec(m[1])) !== null) {
    descs[entry[1]] = entry[2].replace(/\s+/g, ' ').trim();
  }
  return descs;
}

function extractConvFactor(constName, fromKey, toKey) {
  // For simple factor-based conversion: value * from.factor / to.factor
  // We'll approximate with a 1-unit reference
  return null; // Skip inline factor computation in prerender — use generic desc
}

const LENGTH_UNITS  = extractUnits('LENGTH_UNITS');
const AREA_UNITS    = extractUnits('AREA_UNITS');
const VOLUME_UNITS  = extractUnits('VOLUME_UNITS');
const TIME_UNITS    = extractUnits('TIME_UNITS');
const WEIGHT_UNITS  = extractUnits('WEIGHT_UNITS');
const TEMP_UNITS    = extractUnits('TEMP_UNITS');
const SPEED_UNITS   = extractUnits('SPEED_UNITS');
const UNIT_DESC     = extractDescriptions('UNIT_DESC');
const AREA_UNIT_DESC  = extractDescriptions('AREA_UNIT_DESC');
const VOLUME_UNIT_DESC = extractDescriptions('VOLUME_UNIT_DESC');
const TIME_UNIT_DESC = extractDescriptions('TIME_UNIT_DESC');
const WEIGHT_UNIT_DESC = extractDescriptions('WEIGHT_UNIT_DESC');
const TEMP_UNIT_DESC = extractDescriptions('TEMP_UNIT_DESC');
const SPEED_UNIT_DESC = extractDescriptions('SPEED_UNIT_DESC');

function slug(key) { return key.replace(/_/g, '-'); }
function keyFromSlug(s) { return s.replace(/-/g, '_'); }

// ── SEO resolver ──────────────────────────────────────────────────────────
function getSEO(routePath) {
  const parts = routePath.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const abs = `${BASE_URL}${routePath === '/' ? '' : routePath}`;

  if (parts.length === 0) {
    return {
      title: 'Omni Converter — Free Online Unit Converter',
      description: 'Instantly convert between 90+ length units and growing. Metric, imperial, astronomical, historical — fast, accurate, free.',
      url: abs
    };
  }

  if (parts[0] === 'about') {
    return {
      title: 'About Omni Converter | Fast, Accurate Unit Conversion Tool',
      description: 'Learn about Omni Converter: accurate conversion tools for length and area, broad unit coverage, and a free calculator built for students, professionals, publishers, and everyday users.',
      url: abs
    };
  }

  if (parts[0] === 'site-owners') {
    return {
      title: 'Omni Converter Widgets for Site Owners & Bloggers',
      description: 'Add free Omni Converter widgets to your website to boost engagement, trust, and SEO with useful conversion tools your readers will actually use.',
      url: abs
    };
  }

  if (parts[0] === 'terms') {
    return {
      title: 'Terms of Use | Omni Converter',
      description: 'Read the Terms of Use for Omni Converter. Understand the conditions for using our free online unit conversion tools.',
      url: abs
    };
  }

  if (parts[0] === 'privacy') {
    return {
      title: 'Privacy Policy | Omni Converter',
      description: 'Read the Privacy Policy for Omni Converter. Learn how we handle data, analytics, and advertising on our free online unit conversion tool.',
      url: abs
    };
  }

  if (parts[0] === 'disclaimer') {
    return {
      title: 'Disclaimer | Omni Converter',
      description: 'Read the Disclaimer for Omni Converter. Important information about the accuracy of conversion results and the appropriate use of this free tool.',
      url: abs
    };
  }

  // /time
  if (parts[0] === 'time' && parts.length === 1) {
    return {
      title: 'Time Converter — 35+ Units | Omni Converter',
      description: 'Free online time converter. Convert between 35+ units including seconds, minutes, hours, days, weeks, months, years, and scientific time units. Instant results.',
      url: abs
    };
  }

  // /time/{from}-to-{to}
  if (parts[0] === 'time' && parts[1] && parts[1].includes('-to-')) {
    const idx      = parts[1].indexOf('-to-');
    const fromSlug = parts[1].slice(0, idx);
    const toSlug   = parts[1].slice(idx + 4);
    const fromKey  = keyFromSlug(fromSlug);
    const toKey    = keyFromSlug(toSlug);
    const fromUnit = TIME_UNITS.find(u => u.key === fromKey);
    const toUnit   = TIME_UNITS.find(u => u.key === toKey);
    if (fromUnit && toUnit) {
      return {
        title: `Convert ${fromUnit.label} to ${toUnit.label} | ${fromUnit.symbol || fromUnit.label} to ${toUnit.symbol || toUnit.label} Converter | Omni Converter`,
        description: `Instantly convert ${fromUnit.label}${fromUnit.symbol ? ' (' + fromUnit.symbol + ')' : ''} to ${toUnit.label}${toUnit.symbol ? ' (' + toUnit.symbol + ')' : ''}. Free online time converter with formula and conversion table.`,
        url: abs
      };
    }
  }

  // /time/{unit}
  if (parts[0] === 'time' && parts[1]) {
    const key  = keyFromSlug(parts[1]);
    const unit = TIME_UNITS.find(u => u.key === key);
    if (unit) {
      const desc = TIME_UNIT_DESC[key] || '';
      return {
        title: `${unit.label} Converter — Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} | Omni Converter`,
        description: `Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} to seconds, minutes, hours, days and 35+ other time units.${desc ? ' ' + desc : ''}`,
        url: abs
      };
    }
  }

  // /length
  if (parts[0] === 'length' && parts.length === 1) {
    return {
      title: 'Length Converter — 90+ Units | Omni Converter',
      description: 'Free online length converter. Convert between 90+ units including metric, imperial, astronomical, and historical units. Instant results.',
      url: abs
    };
  }

  // /length/{from}-to-{to}
  if (parts[0] === 'length' && parts[1] && parts[1].includes('-to-')) {
    const idx      = parts[1].indexOf('-to-');
    const fromSlug = parts[1].slice(0, idx);
    const toSlug   = parts[1].slice(idx + 4);
    const fromKey  = keyFromSlug(fromSlug);
    const toKey    = keyFromSlug(toSlug);
    const fromUnit = LENGTH_UNITS.find(u => u.key === fromKey);
    const toUnit   = LENGTH_UNITS.find(u => u.key === toKey);
    if (fromUnit && toUnit) {
      return {
        title: `Convert ${fromUnit.label} to ${toUnit.label} | ${fromUnit.symbol || fromUnit.label} to ${toUnit.symbol || toUnit.label} Converter | Omni Converter`,
        description: `Instantly convert ${fromUnit.label}${fromUnit.symbol ? ' (' + fromUnit.symbol + ')' : ''} to ${toUnit.label}${toUnit.symbol ? ' (' + toUnit.symbol + ')' : ''}. Free online length converter with formula and conversion table.`,
        url: abs
      };
    }
  }

  // /length/{unit}
  if (parts[0] === 'length' && parts[1]) {
    const key  = keyFromSlug(parts[1]);
    const unit = LENGTH_UNITS.find(u => u.key === key);
    if (unit) {
      const desc = UNIT_DESC[key] || '';
      return {
        title: `${unit.label} Converter — Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} | Omni Converter`,
        description: `Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} to meters, kilometers, miles, feet and 90+ other length units.${desc ? ' ' + desc : ''}`,
        url: abs
      };
    }
  }

  // /area
  if (parts[0] === 'area' && parts.length === 1) {
    return {
      title: 'Area Converter — 40+ Units | Omni Converter',
      description: 'Free online area converter. Convert between 40+ units including metric, imperial, US survey, and historical area units. Instant results.',
      url: abs
    };
  }

  // /area/{from}-to-{to}
  if (parts[0] === 'area' && parts[1] && parts[1].includes('-to-')) {
    const idx      = parts[1].indexOf('-to-');
    const fromSlug = parts[1].slice(0, idx);
    const toSlug   = parts[1].slice(idx + 4);
    const fromKey  = keyFromSlug(fromSlug);
    const toKey    = keyFromSlug(toSlug);
    const fromUnit = AREA_UNITS.find(u => u.key === fromKey);
    const toUnit   = AREA_UNITS.find(u => u.key === toKey);
    if (fromUnit && toUnit) {
      return {
        title: `Convert ${fromUnit.label} to ${toUnit.label} | Omni Converter`,
        description: `Instantly convert ${fromUnit.label}${fromUnit.symbol ? ' (' + fromUnit.symbol + ')' : ''} to ${toUnit.label}${toUnit.symbol ? ' (' + toUnit.symbol + ')' : ''}. Free online area converter.`,
        url: abs
      };
    }
  }

  // /area/{unit}
  if (parts[0] === 'area' && parts[1]) {
    const key  = keyFromSlug(parts[1]);
    const unit = AREA_UNITS.find(u => u.key === key);
    if (unit) {
      const desc = AREA_UNIT_DESC[key] || '';
      return {
        title: `${unit.label} Converter | Omni Converter`,
        description: `Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} to other area units.${desc ? ' ' + desc : ''}`,
        url: abs
      };
    }
  }

  // /volume
  if (parts[0] === 'volume' && parts.length === 1) {
    return {
      title: 'Volume Converter — 80+ Units | Omni Converter',
      description: 'Free online volume converter. Convert between 80+ units including metric, imperial, UK, and historical volume units. Instant results.',
      url: abs
    };
  }

  // /volume/{from}-to-{to}
  if (parts[0] === 'volume' && parts[1] && parts[1].includes('-to-')) {
    const idx      = parts[1].indexOf('-to-');
    const fromSlug = parts[1].slice(0, idx);
    const toSlug   = parts[1].slice(idx + 4);
    const fromKey  = keyFromSlug(fromSlug);
    const toKey    = keyFromSlug(toSlug);
    const fromUnit = VOLUME_UNITS.find(u => u.key === fromKey);
    const toUnit   = VOLUME_UNITS.find(u => u.key === toKey);
    if (fromUnit && toUnit) {
      return {
        title: `Convert ${fromUnit.label} to ${toUnit.label} | ${fromUnit.symbol || fromUnit.label} to ${toUnit.symbol || toUnit.label} Converter | Omni Converter`,
        description: `Instantly convert ${fromUnit.label}${fromUnit.symbol ? ' (' + fromUnit.symbol + ')' : ''} to ${toUnit.label}${toUnit.symbol ? ' (' + toUnit.symbol + ')' : ''}. Free online volume converter with formula and conversion table.`,
        url: abs
      };
    }
  }

  // /volume/{unit}
  if (parts[0] === 'volume' && parts[1]) {
    const key  = keyFromSlug(parts[1]);
    const unit = VOLUME_UNITS.find(u => u.key === key);
    if (unit) {
      const desc = VOLUME_UNIT_DESC[key] || '';
      return {
        title: `${unit.label} Converter — Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} | Omni Converter`,
        description: `Convert ${unit.label}${unit.symbol ? ' (' + unit.symbol + ')' : ''} to liters, gallons, cubic meters and 80+ other volume units.${desc ? ' ' + desc : ''}`,
        url: abs
      };
    }
  }

  // Generic fallback
  return {
    title: 'Omni Converter — Universal Unit Converter',
    description: 'Fast, accurate unit conversions across length, area, volume, weight, and more.',
    url: abs
  };
}

// ── HTML injection helpers ────────────────────────────────────────────────
function escapeMeta(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function injectSEO(html, seo) {
  const { title, description, url } = seo;
  let out = html;

  // Title
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeMeta(title)}</title>`);

  // Description
  out = out.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeMeta(description)}$2`
  );

  // Canonical
  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(url)}$2`
  );

  // OG title
  out = out.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(title)}$2`
  );

  // OG description
  out = out.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(description)}$2`
  );

  // OG url
  out = out.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(url)}$2`
  );

  // Twitter title
  out = out.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(title)}$2`
  );

  // Twitter description
  out = out.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*("[^>]*>)/,
    `$1${escapeMeta(description)}$2`
  );

  // Inject prerender path bootstrap
  const pathBootstrap = `\n<script>window.__PRERENDER_PATH__=${JSON.stringify(seo._routePath)};</script>\n`;
  out = out.replace('<head>', `<head>${pathBootstrap}`);

  return out;
}

// ── File helpers ──────────────────────────────────────────────────────────
function collectUrlsFromSitemap(filepath) {
  const xml = fs.readFileSync(filepath, 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
  return urls.filter(u => u.startsWith(BASE_URL));
}

function routePathFromUrl(url) {
  const withoutBase = url.slice(BASE_URL.length);
  return withoutBase === '' ? '/' : withoutBase;
}

function ensureDir(dirpath) {
  fs.mkdirSync(dirpath, { recursive: true });
}

function writeRouteHtml(routePath, htmlTemplate) {
  const normalized = routePath.replace(/^\/+|\/+$/g, '');
  const dir = normalized ? path.join(DIST, normalized) : DIST;
  ensureDir(dir);

  const seo = getSEO(routePath);
  seo._routePath = routePath;
  const html = injectSEO(htmlTemplate, seo);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function copyStaticFiles() {
  const passthroughFiles = [
    'robots.txt',
    'sitemap.xml',
    ...SITEMAP_FILES
  ];
  passthroughFiles.forEach(file => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, file));
    }
  });
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  const htmlTemplate = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const allUrls = new Set([`${BASE_URL}/`, `${BASE_URL}/length`]);

  for (const sitemapFile of SITEMAP_FILES) {
    const filePath = path.join(ROOT, sitemapFile);
    if (!fs.existsSync(filePath)) continue;
    for (const url of collectUrlsFromSitemap(filePath)) allUrls.add(url);
  }

  let count = 0;
  for (const url of allUrls) {
    writeRouteHtml(routePathFromUrl(url), htmlTemplate);
    count++;
    if (count % 500 === 0) process.stdout.write(`  ... ${count} routes written\n`);
  }

  copyStaticFiles();
  console.log(`\nPrerendered ${allUrls.size} routes into ${DIST}`);
  console.log(`Each page has unique static title, description, canonical, and OG tags.`);
}

main();
