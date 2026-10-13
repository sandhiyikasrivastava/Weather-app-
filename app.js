/**
 * WeatherNow frontend
 * API: https://api.weatherapi.com/v1/current.json?key=API_KEY&q=CITY&aqi=no
 * Key passed as query param `key`. Loaded from env (VITE_WEATHER_API_KEY),
 * injected via window.__WEATHER_CONFIG__ / config.js — never hardcoded.
 */

const POPULAR_CITIES = [
  "Seoul", "New York", "London", "Tokyo", "Paris",
  "Sydney", "Mumbai", "Dubai", "Singapore", "Los Angeles",
];

const ENDPOINT = "https://api.weatherapi.com/v1/current.json";

const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("city-input"),
  btn: document.getElementById("search-btn"),
  chips: document.getElementById("city-chips"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
  locName: document.getElementById("location-name"),
  locMeta: document.getElementById("location-meta"),
  condText: document.getElementById("condition-text"),
  condIcon: document.getElementById("condition-icon"),
  temp: document.getElementById("m-temp"),
  tempSub: document.getElementById("m-temp-sub"),
  humidity: document.getElementById("m-humidity"),
  wind: document.getElementById("m-wind"),
  windSub: document.getElementById("m-wind-sub"),
  mood: document.getElementById("mood-badge"),
  moodReason: document.getElementById("mood-reason"),
  themePill: document.getElementById("theme-pill"),
  raw: document.getElementById("raw-json"),
  pretty: document.getElementById("pretty-json"),
  copyRaw: document.getElementById("copy-raw"),
};

function getApiKey() {
  // 1) Vercel / Vite injected config (generated config.js)
  const w = window.__WEATHER_CONFIG__ || {};
  if (w.WEATHER_API_KEY) return w.WEATHER_API_KEY;
  // 2) allow ?key= override for local testing (not recommended for prod)
  const qs = new URLSearchParams(location.search);
  if (qs.get("key")) return qs.get("key");
  return "";
}

function setStatus(msg, kind = "") {
  els.status.textContent = msg;
  els.status.className = "status " + kind;
}

function setLoading(isLoading, label = "Loading…") {
  els.btn.disabled = isLoading;
  els.btn.textContent = isLoading ? label : "Search";
  if (isLoading) setStatus(label, "loading");
}

/**
 * Weather mood — clearly defined thresholds, deterministic priority:
 *  1. Windy         — wind_kph >= 30
 *  2. Uncomfortable — humidity >= 80 AND temp_c >= 25
 *  3. Hot           — temp_c >= 30
 *  4. Cold          — temp_c <= 10
 *  5. Pleasant      — otherwise
 */
function getMood(tempC, humidity, windKph) {
  if (windKph >= 30)
    return { mood: "Windy", reason: `Wind ${windKph} kph ≥ 30 kph threshold.` };
  if (humidity >= 80 && tempC >= 25)
    return { mood: "Uncomfortable", reason: `Humidity ${humidity}% ≥ 80% with heat ${tempC}°C ≥ 25°C.` };
  if (tempC >= 30)
    return { mood: "Hot", reason: `Temperature ${tempC}°C ≥ 30°C threshold.` };
  if (tempC <= 10)
    return { mood: "Cold", reason: `Temperature ${tempC}°C ≤ 10°C threshold.` };
  return { mood: "Pleasant", reason: `Mild ${tempC}°C, humidity ${humidity}%, wind ${windKph} kph — within comfort range.` };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHighlighted(obj) {
  const json = JSON.stringify(obj, null, 2);
  let out = "";
  const re = /("(\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(\.\d+)?([eE][+-]?\d+)?/g;
  let last = 0, m;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  while ((m = re.exec(json)) !== null) {
    out += esc(json.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('"')) {
      out += m[3]
        ? `<span class="tok-key">${esc(tok.slice(0, tok.indexOf('"', 1) + 1))}</span>${esc(m[3])}`
        : `<span class="tok-str">${esc(tok)}</span>`;
    } else if (tok === "true" || tok === "false") {
      out += `<span class="tok-bool">${tok}</span>`;
    } else if (tok === "null") {
      out += `<span class="tok-null">${tok}</span>`;
    } else {
      out += `<span class="tok-num">${tok}</span>`;
    }
    last = m.index + m[0].length;
  }
  out += esc(json.slice(last));
  return out;
}

async function fetchWeather(city) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing API key. Set VITE_WEATHER_API_KEY in your .env (see .env.example) and rebuild, or pass ?key=YOUR_KEY for local testing."
    );
  }
  const url = `${ENDPOINT}?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(city)}&aqi=no`;
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error?.message) detail += ` — ${err.error.message}`;
    } catch { /* keep generic */ }
    if (res.status === 400 || res.status === 404) detail += " (check the city name)";
    if (res.status === 401 || res.status === 403) detail += " (invalid / missing API key)";
    throw new Error(`WeatherAPI request failed: ${detail}`);
  }
  return res.json();
}

/**
 * Dynamic weather theming — no reload, just a `data-theme` switch.
 * Mapping lives in themes.js (CODE_TO_THEME + KEYWORDS); this only applies it.
 */
function applyTheme(data) {
  const cur = data?.current || {};
  const code = cur.condition?.code;
  const text = cur.condition?.text || "";
  const theme = window.resolveWeatherTheme
    ? window.resolveWeatherTheme(code, text, cur.is_day)
    : "sunny";
  // Smooth switch: CSS transitions on body/cards handle the fade (see styles.css).
  document.body.dataset.theme = theme;
  const meta = (window.WEATHER_THEME_META || {})[theme] || { label: theme, emoji: "🌤️", decor: [] };
  if (els.themePill) els.themePill.textContent = `${meta.emoji} ${meta.label} UI`;
  const decor = document.querySelector(".bg-decor");
  if (decor && meta.decor?.length) {
    decor.innerHTML = meta.decor.map((e) => `<span>${e}</span>`).join("");
  }
  return theme;
}

function render(data) {
  const loc = data.location || {};
  const cur = data.current || {};
  const tempC = cur.temp_c, tempF = cur.temp_f;
  const humidity = cur.humidity;
  const windKph = cur.wind_kph, windMph = cur.wind_mph;

  els.locName.textContent = [loc.name, loc.country].filter(Boolean).join(", ") || "Unknown location";
  els.locMeta.textContent = [loc.region, loc.localtime].filter(Boolean).join(" · ") || "";
  els.condText.textContent = cur.condition?.text || "—";
  if (cur.condition?.icon) {
    els.condIcon.src = cur.condition.icon.startsWith("//") ? "https:" + cur.condition.icon : cur.condition.icon;
    els.condIcon.alt = cur.condition?.text || "condition";
    els.condIcon.style.display = "";
  } else {
    els.condIcon.style.display = "none";
  }

  els.temp.textContent = tempC != null ? `${tempC}°C` : "—";
  els.tempSub.textContent = tempF != null ? `= ${tempF}°F · feels ${cur.feelslike_c ?? "?"}°C` : "";
  els.humidity.textContent = humidity != null ? `${humidity}%` : "—";
  els.wind.textContent = windKph != null ? `${windKph} kph` : "—";
  els.windSub.textContent = windMph != null ? `= ${windMph} mph · ${cur.wind_dir ?? ""}` : "";

  const { mood, reason } = getMood(Number(tempC), Number(humidity), Number(windKph));
  els.mood.textContent = mood;
  els.mood.className = "mood " + mood;
  els.moodReason.textContent = reason;

  // Dynamic UI theme from live condition (no reload)
  const theme = applyTheme(data);

  // Raw JSON
  els.raw.textContent = JSON.stringify(data, null, 2);
  // Formatted / highlighted
  els.pretty.innerHTML = renderHighlighted(data);

  els.result.classList.remove("hidden");
}

function markActiveChip(city) {
  document.querySelectorAll(".chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.city.toLowerCase() === String(city).toLowerCase())
  );
}

async function search(city) {
  city = (city || "").trim();
  if (!city) return;
  markActiveChip(city);
  setLoading(true, `Loading weather for “${city}”…`);
  try {
    const data = await fetchWeather(city);
    render(data);
    const theme = document.body.dataset.theme || "sunny";
    setStatus(`Showing weather for “${data.location?.name || city}” · ${theme} UI.`, "");
  } catch (err) {
    els.result.classList.add("hidden");
    setStatus(err.message || "Something went wrong.", "error");
  } finally {
    setLoading(false);
  }
}

// Chips
POPULAR_CITIES.forEach((city) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = city;
  b.dataset.city = city;
  b.setAttribute("role", "listitem");
  b.addEventListener("click", () => {
    els.input.value = city;
    search(city);
  });
  els.chips.appendChild(b);
});

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  search(els.input.value);
});

els.copyRaw.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.raw.textContent);
    els.copyRaw.textContent = "💕 Copied!";
    setTimeout(() => (els.copyRaw.textContent = "💕 Copy"), 1500);
  } catch {
    els.copyRaw.textContent = "Select & copy manually";
  }
});

// Startup state
(function init() {
  if (!getApiKey()) {
    setStatus(
      "No API key detected. Add VITE_WEATHER_API_KEY to .env (see .env.example) or append ?key=YOUR_KEY to the URL for local testing.",
      "error"
    );
  } else {
    setStatus("Type a city or click a popular city chip to begin.");
  }
})();
