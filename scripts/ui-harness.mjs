// Builds a single self-contained HTML file that runs the real client pages in a
// browser: React, react-dom and framer-motion come from node_modules, so
// AnimatePresence timing and ResizeObserver behave exactly as they do in the
// app. Only storage, routing and the PNG export are stubbed.
//
//   node scripts/ui-harness.mjs            -> .preview-tmp/harness.html
//
// PATCH_JSON can inject deliberate breakage to prove a check would catch it:
//   PATCH_JSON='[{"file":"app/quiz/page.tsx","from":"x","to":"y"}]' OUTNAME=harness-broken.html node scripts/ui-harness.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NM = path.join(ROOT, "node_modules");
const PATCHES = JSON.parse(process.env.PATCH_JSON || "[]");
const OUTNAME = process.env.OUTNAME || "harness.html";

const VIRTUAL = {
  "next/link": `const React = require("react");
module.exports = { __esModule: true, default: function Link({ href, children, ...rest }) {
  return React.createElement("a", { href: typeof href === "string" ? href : "#", ...rest }, children);
} };`,
  "next/navigation": `const calls = (globalThis.__routerCalls = []);
module.exports = {
  useRouter: () => ({ push: (u) => calls.push(["push", u]), replace: (u) => calls.push(["replace", u]), back: () => calls.push(["back"]), prefetch: () => {} }),
  usePathname: () => globalThis.__pathname || "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => { throw new Error("notFound"); },
};`,
  "html-to-image": `module.exports = { toPng: async () => { globalThis.__exported = true; return "data:image/png;base64,iVBORw0KGgo="; }, toBlob: async () => { globalThis.__exported = true; return new Blob(["x"], { type: "image/png" }); } };`,
  "@emotion/is-prop-valid": `module.exports = { __esModule: true, default: () => true };`,
  "@/lib/storage": `// Reads the fixture lazily so one harness can serve many test runs.
const F = () => globalThis.__fixture || {};
const noop = () => {};
module.exports = {
  useSelectedDistricts: () => [F().districts || {}, noop, true],
  useHomeAddress: () => [F().home || null, noop, true],
  useQuizAnswers: () => [F().quiz || {}, noop, true],
  usePriorities: () => [F().priorities || [], noop, true],
  useVotingPlan: () => [F().plan || { registered: false, knowsRaces: false, hasPlan: false }, noop, true],
  clearSavedData: noop,
};`,
};

const modules = new Map();
const EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

function tryFile(p) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  for (const e of EXT) if (fs.existsSync(p + e)) return p + e;
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    const pkg = path.join(p, "package.json");
    if (fs.existsSync(pkg)) {
      const j = JSON.parse(fs.readFileSync(pkg, "utf8"));
      const main = j.main || j.module;
      if (main) { const m = tryFile(path.join(p, main)); if (m) return m; }
    }
    for (const e of EXT) if (fs.existsSync(path.join(p, "index" + e))) return path.join(p, "index" + e);
  }
  return null;
}

function resolve(spec, fromFile) {
  if (VIRTUAL[spec]) return spec;
  if (spec.startsWith("@/")) return tryFile(path.join(ROOT, spec.slice(2)));
  if (spec.startsWith(".")) return tryFile(path.resolve(path.dirname(fromFile), spec));
  return tryFile(path.join(NM, spec));
}

const missing = new Set();
function scan(code, fromFile) {
  for (const m of code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    const target = resolve(m[1], fromFile);
    if (!target) { missing.add(`${m[1]} (from ${path.relative(ROOT, fromFile)})`); continue; }
    load(target);
  }
}

function load(id) {
  if (modules.has(id)) return;
  if (VIRTUAL[id]) { modules.set(id, VIRTUAL[id]); scan(VIRTUAL[id], id); return; }
  let src = fs.readFileSync(id, "utf8");
  for (const p of PATCHES) {
    if (id.endsWith(p.file)) {
      if (!src.includes(p.from)) throw new Error(`patch did not match in ${p.file}: ${p.from.slice(0, 60)}`);
      src = src.replace(p.from, p.to);
    }
  }
  let code;
  if (id.endsWith(".json")) code = "module.exports = " + src + ";";
  else if (/\.tsx?$/.test(id)) {
    code = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: id,
    }).outputText;
  } else code = src;
  modules.set(id, code);
  scan(code, id);
}

const ENTRIES = {
  results: path.join(ROOT, "app/quiz/results/page.tsx"),
  quiz: path.join(ROOT, "app/quiz/page.tsx"),
  priorities: path.join(ROOT, "app/quiz/priorities/page.tsx"),
  ballot: path.join(ROOT, "app/ballot/page.tsx"),
};
for (const f of Object.values(ENTRIES)) load(f);
load(path.join(NM, "react-dom/client.js"));
if (missing.size) { console.error("unresolved imports:\n  " + [...missing].join("\n  ")); process.exit(1); }

const key = (id) => (VIRTUAL[id] ? id : path.relative(ROOT, id));
const maps = {};
let defs = "";
for (const [id, code] of modules) {
  const k = key(id);
  maps[k] = {};
  for (const m of code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    const target = VIRTUAL[id] ? resolve(m[1], path.join(ROOT, "x.js")) : resolve(m[1], id);
    if (target) maps[k][m[1]] = key(target);
  }
  defs += `__defs[${JSON.stringify(k)}] = function(module, exports, require){\n${code}\n};\n`;
}

const bundle = `(function(){
var process = { env: { NODE_ENV: "development" }, browser: true, nextTick: function(f){ Promise.resolve().then(f); } };
var __defs = {}, __cache = {};
var __maps = ${JSON.stringify(maps)};
function __map(from, spec){
  var t = __maps[from] && __maps[from][spec];
  if (!t) throw new Error("unmapped " + spec + " from " + from);
  return t;
}
function __req(id){
  if (__cache[id]) return __cache[id].exports;
  var def = __defs[id];
  if (!def) throw new Error("module not bundled: " + id);
  var m = __cache[id] = { exports: {} };
  def(m, m.exports, function(spec){ return __req(__map(id, spec)); });
  return m.exports;
}
${defs}
window.__pages = {
${Object.entries(ENTRIES).map(([n, f]) => `  ${n}: function(){ return __req(${JSON.stringify(key(f))}).default; }`).join(",\n")}
};
window.__react = function(){ return __req("node_modules/react/index.js"); };
window.__reactDom = function(){ return __req("node_modules/react-dom/client.js"); };
})();`;

// The site's own fonts, self-hosted by the build, so text measures for real.
let fontCss = "";
const media = path.join(ROOT, ".next/static/media");
if (fs.existsSync(media)) {
  const css = fs.readdirSync(path.join(ROOT, ".next/static/css")).map((f) => fs.readFileSync(path.join(ROOT, ".next/static/css", f), "utf8")).join("");
  const latin = (family) => {
    const m = [...css.matchAll(/@font-face\{font-family:([^;]+);[^}]*src:url\(\/_next\/static\/media\/([^)]+)\)[^}]*unicode-range:u\+00\?\?/g)].find((x) => x[1].includes(family));
    return m && m[2];
  };
  for (const [family, varName] of [["Big Shoulders", "--font-display"], ["Space Grotesk", "--font-body"]]) {
    const file = latin(family);
    if (!file) continue;
    const b64 = fs.readFileSync(path.join(media, file)).toString("base64");
    fontCss += `@font-face{font-family:"${family}";font-style:normal;font-weight:400 900;font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2");}\n:root{${varName}:"${family}";}\n`;
  }
} else {
  console.warn("no .next/static/media — run `npm run build` first or text will measure in a fallback font");
}

const tw = path.join(ROOT, ".preview-tmp/tw.css");
if (!fs.existsSync(tw)) {
  console.error("missing .preview-tmp/tw.css — generate it with:\n  npx tailwindcss -c tailwind.config.ts -i app/globals.css -o .preview-tmp/tw.css --minify");
  process.exit(1);
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fs.readFileSync(tw, "utf8")}</style><style>${fontCss}</style></head>
<body class="min-h-dvh"><div id="root"></div>
<script>window.__fixture={};</script>
<script>${bundle}</script>
<script>
window.__mount = function(n, f){
  window.__fixture = f || {};
  var React = window.__react(), RD = window.__reactDom();
  var host = document.getElementById("root");
  if (window.__root) { window.__root.unmount(); host.innerHTML = ""; }
  window.__root = RD.createRoot(host);
  window.__root.render(React.createElement(window.__pages[n]()));
  return true;
};
<\/script>
</body></html>`;

fs.mkdirSync(path.join(ROOT, ".preview-tmp"), { recursive: true });
fs.writeFileSync(path.join(ROOT, ".preview-tmp", OUTNAME), html);
console.log(`${OUTNAME}: ${modules.size} modules, ${(html.length / 1e6).toFixed(1)}MB`);
