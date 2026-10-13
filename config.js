// Runtime config. Vercel injects VITE_WEATHER_API_KEY at build time.
// For this static deployment, `config.js` is generated from the env var
// (see build script / Vercel Build Command). Never commit real keys.
window.__WEATHER_CONFIG__ = window.__WEATHER_CONFIG__ || {
  WEATHER_API_KEY: ""
};
