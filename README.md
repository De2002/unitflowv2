From Idea to Profit with OnSpace

## Sitemap

- Generate or refresh the sitemap index and all category sitemap files:
  - `node scripts/generate-sitemap.mjs`
- Output files:
  - `sitemap.xml` (sitemap index)
  - `sitemap-length.xml`, `sitemap-area.xml`, `sitemap-volume.xml`, `sitemap-weight.xml`, `sitemap-temperature.xml`, `sitemap-speed.xml`, `sitemap-time.xml`, `sitemap-data.xml`, `sitemap-energy.xml`
- Each category sitemap uses full URLs and includes `<lastmod>`, `<changefreq>`, and `<priority>` for every URL.
- `length` URLs are generated dynamically from `LENGTH_UNITS` in `index.html`.

## Static generation / prerendering

- Generate real HTML pages for every URL in the sitemaps:
  - `node scripts/prerender-pages.mjs`
- Output directory:
  - `dist/`
- Every route is emitted as a physical `index.html` file (for example, `dist/length/meter/to/foot/index.html`) so navigation uses real page loads.

## Google Search Console sitemap troubleshooting

If Search Console still reports **Couldn't fetch** after deploy, validate these checks in order:

1. Open `https://www.omniconverter.cyou/sitemap.xml` and `https://www.omniconverter.cyou/sitemap-length.xml` in an incognito window. They must return raw XML (not app HTML).
2. Verify with curl from an external machine:
   - `curl -I https://www.omniconverter.cyou/sitemap.xml`
   - `curl -I https://www.omniconverter.cyou/sitemap-length.xml`
   Expect HTTP 200 and `content-type: application/xml`.
3. In Vercel project settings, ensure **Deployment Protection / Password Protection** is disabled for production, or explicitly allow crawler access.
4. Confirm DNS/SSL is healthy for `www.omniconverter.cyou` (the exact host used in sitemap URLs).
5. In Search Console, remove and re-submit `/sitemap.xml`, then use **Inspect URL** on `https://www.omniconverter.cyou/sitemap.xml`.

Search Console statuses can lag by several hours after fixes are deployed.
