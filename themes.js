/**
 * Centralized weather → UI theme mapping.
 * 5 polished themes reused across all conditions: sunny, cloudy, rainy, storm, snowy.
 * Easy to modify: edit CODE_TO_THEME or KEYWORDS below — no other code changes needed.
 *
 * WeatherAPI condition codes reference (current.json → current.condition.code):
 *  1000 Sunny/Clear · 1003 Partly cloudy · 1006 Cloudy · 1009 Overcast · 1030 Mist
 *  1063 patchy rain · 1066 snow · 1069 sleet · 1072 freezing drizzle · 1087 thunder
 *  1114-1117 blizzard · 1135 fog · 1147 freezing fog · 1150-1201 drizzle/rain
 *  1204-1237 sleet/snow · 1240-1246 showers · 1249-1264 sleet/snow showers
 *  1273/1276 rain+thunder · 1279/1282 snow+thunder
 */
(function () {
  const THEMES = ["sunny", "cloudy", "rainy", "storm", "snowy"];

  const CODE_TO_THEME = {
    1000: "sunny",
    1003: "cloudy", 1006: "cloudy", 1009: "cloudy",
    1030: "cloudy", 1135: "cloudy", 1147: "cloudy",
    1063: "rainy", 1072: "rainy", 1150: "rainy", 1153: "rainy",
    1168: "rainy", 1171: "rainy", 1180: "rainy", 1183: "rainy",
    1186: "rainy", 1189: "rainy", 1192: "rainy", 1195: "rainy",
    1198: "rainy", 1201: "rainy", 1240: "rainy", 1243: "rainy", 1246: "rainy",
    1087: "storm", 1273: "storm", 1276: "storm", 1279: "storm", 1282: "storm",
    1066: "snowy", 1069: "snowy", 1114: "snowy", 1117: "snowy",
    1204: "snowy", 1205: "snowy", 1206: "snowy", 1207: "snowy",
    1210: "snowy", 1213: "snowy", 1216: "snowy", 1219: "snowy",
    1222: "snowy", 1225: "snowy", 1237: "snowy", 1249: "snowy",
    1252: "snowy", 1255: "snowy", 1258: "snowy", 1261: "snowy", 1264: "snowy",
  };

  // Fallback when code is missing/unknown — checked in order.
  const KEYWORDS = [
    ["storm", ["thunder", "lightning", "storm"]],
    ["snowy", ["snow", "blizzard", "sleet", "hail", "ice", "frost"]],
    ["rainy", ["rain", "drizzle", "shower", "wet"]],
    ["cloudy", ["cloud", "overcast", "mist", "fog", "haze", "smoke", "dust", "sand"]],
    ["sunny", ["sun", "clear", "fair"]],
  ];

  const META = {
    sunny:  { label: "Sunny",  emoji: "☀️", decor: ["☀️", "🌻", "🌷", "✨", "🦋", "🌈", "💛", "🍋"] },
    cloudy: { label: "Cloudy", emoji: "☁️", decor: ["☁️", "🌥️", "🤍", "✨", "🦋", "🌙", "💜", "🫧"] },
    rainy:  { label: "Rainy",  emoji: "🌧️", decor: ["🌧️", "💧", "☔", "🐸", "🌿", "✨", "💙", "🫧"] },
    storm:  { label: "Storm",  emoji: "⛈️", decor: ["⛈️", "⚡", "🌩️", "💜", "🌧️", "✨", "🖤", "💥"] },
    snowy:  { label: "Snowy",  emoji: "❄️", decor: ["❄️", "⛄", "🤍", "✨", "💎", "🌙", "🩵", "🧣"] },
  };

  function resolveWeatherTheme(code, text, isDay) {
    if (CODE_TO_THEME[code]) return CODE_TO_THEME[code];
    const t = String(text || "").toLowerCase();
    for (const [theme, words] of KEYWORDS) {
      if (words.some((w) => t.includes(w))) return theme;
    }
    // Sensible default: bright by day, calm gray-blue at night.
    return isDay === 0 ? "cloudy" : "sunny";
  }

  window.WEATHER_THEMES = THEMES;
  window.WEATHER_THEME_META = META;
  window.resolveWeatherTheme = resolveWeatherTheme;
})();
