# WeatherNow — Responsive Weather App (frontend only)

Search any city, or click one of 10 popular-city chips. Shows temperature,
humidity, wind speed, a computed **weather mood**, plus **raw JSON** and
**syntax-highlighted formatted JSON**.

## API

- Endpoint: `https://api.weatherapi.com/v1/current.json?key=API_KEY&q=CITY&aqi=no`
  (spec gave `http://…?key=api_key&q=city_name`; production uses `https://` to avoid mixed-content blocks)
- Method: `GET`, query params: `key` (API key), `q` (city name), `aqi=no`
- Expected response: `{ location: { name, region, country, localtime, … }, current: { temp_c, temp_f, humidity, wind_kph, wind_mph, wind_dir, condition: { text, icon }, feelslike_c, … } }`
- Loading state: button disabled + “Loading weather for …” status.
- Errors: missing key, HTTP 400/404 (bad city), 401/403 (bad key), network failure — all shown in the status bar.

## Dynamic weather themes (5 designs, auto-switched)

`themes.js` is the centralized config: `CODE_TO_THEME` (WeatherAPI condition
codes) + `KEYWORDS` (text fallback) + `META` (label/emoji/decor). `app.js`
`applyTheme()` sets `body[data-theme]` on every fetch — no reload; CSS
transitions smooth the change. Unknown codes fall back to keywords, then
day ? sunny : cloudy.

| Theme | Trigger examples |
|---|---|
| ☀️ sunny | 1000 Sunny/Clear |
| ☁️ cloudy | 1003/1006/1009 clouds, 1030 mist, 1135/1147 fog, haze/smoke |
| 🌧️ rainy | drizzle/showers/rain codes (1063, 1150–1201, 1240–1246…) |
| ⛈️ storm | thunder codes (1087, 1273/1276/1279/1282) |
| ❄️ snowy | snow/sleet/blizzard codes (1066–1264…) |

FX layer (`#fx` in `index.html`, pure CSS in `styles.css`): rotating sun,
drifting clouds, rain streaks, lightning flash, snowfall. Respects
`prefers-reduced-motion`, scaled down on mobile.

## Weather mood thresholds

| Mood | Rule (evaluated in order) |
|---|---|
| Windy | `wind_kph >= 30` |
| Uncomfortable | `humidity >= 80 AND temp_c >= 25` |
| Hot | `temp_c >= 30` |
| Cold | `temp_c <= 10` |
| Pleasant | otherwise |

## Env / secrets

Env vars (see `.env.example`):

- `VITE_WEATHER_API_KEY` — WeatherAPI key, injected at build time into `config.js`.
- `VERCEL_TOKEN` — Vercel deployment token, **local deploy use only, never committed**.

Both live in local `.env` (gitignored). The frontend never hardcodes the key;
`scripts/inject-config.js` generates `config.js` from the env var during
`vercel-build`. Note: a pure-frontend direct call still exposes the key in the
browser — for production, proxy through a serverless function.

## Run locally

```bash
cp .env.example .env   # then fill VITE_WEATHER_API_KEY
node scripts/inject-config.js
npx serve .
```

Or open with `?key=YOUR_KEY` for a quick test without rebuilding.

## Deploy on Vercel

1. Vercel Dashboard → Project Settings → Environment Variables: add
   `VITE_WEATHER_API_KEY` (Production/Preview/Development).
2. Build Command: `node scripts/inject-config.js`, Output Directory: `.`
   (static, no framework — see `vercel.json`).
3. CLI deploy from this folder:
   ```bash
   vercel --prod --token $VERCEL_TOKEN
   ```
