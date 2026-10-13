// Generates config.js from environment at build/deploy time.
// Reads VITE_WEATHER_API_KEY (Vercel env var) or local .env file.
// Never prints the full key to logs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnv() {
  const out = {};
  for (const f of [".env", ".env.local"]) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  }
  return out;
}

const dotenv = loadDotEnv();
let key = process.env.VITE_WEATHER_API_KEY || dotenv.VITE_WEATHER_API_KEY || "";
const dest = path.join(root, "config.js");
// Preserve a previously injected key (e.g. prebuilt static deploy) when no env is set,
// so a Vercel build without the env var configured doesn't blank out the site.
if (!key && fs.existsSync(dest)) {
  const m = fs.readFileSync(dest, "utf8").match(/WEATHER_API_KEY:\s*"([^"]*)"/);
  if (m && m[1]) key = m[1];
}
fs.writeFileSync(
  dest,
  `// AUTO-GENERATED at build time from VITE_WEATHER_API_KEY. Do not edit manually.\nwindow.__WEATHER_CONFIG__ = { WEATHER_API_KEY: ${JSON.stringify(key)} };\n`
);
console.log(`config.js written (key ${key ? "present, length " + key.length : "MISSING"}).`);
