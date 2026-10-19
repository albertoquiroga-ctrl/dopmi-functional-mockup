/**
 * Visita cada ruta del mockup con el hash de Figma html-to-design.
 * Uso: node scripts/figma-browser-capture.mjs scripts/figma-capture-run.json
 *
 * figma-capture-run.json: [{ "path", "captureId", "name", "persist"?: object }]
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.FIGMA_CAPTURE_BASE ?? "http://127.0.0.1:5174";
const DELAY_MS = Number(process.env.FIGMA_CAPTURE_DELAY ?? 3500);
const runFile = process.argv[2] ?? "scripts/figma-capture-run.json";

const items = JSON.parse(readFileSync(runFile, "utf8"));
const STORAGE_KEY = "dopmi-functional-prototype-v2";

function captureHash(captureId) {
  const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit?bindVariables=true`;
  const params = new URLSearchParams({
    figmacapture: captureId,
    figmaendpoint: endpoint,
    figmadelay: String(DELAY_MS),
    figmaselector: ".phone-frame",
  });
  return `#${params.toString()}`;
}

const browser = await chromium.launch({ headless: true });

async function visit(item) {
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
  });
  if (item.persist && typeof item.persist === "object") {
    await context.addInitScript(
      ({ key, patch }) => {
        try {
          const raw = localStorage.getItem(key);
          const base = raw ? JSON.parse(raw) : { state: {}, version: 42 };
          base.state = { ...(base.state ?? {}), ...patch };
          base.version = 42;
          localStorage.setItem(key, JSON.stringify(base));
        } catch {
          localStorage.setItem(key, JSON.stringify({ state: patch, version: 42 }));
        }
      },
      { key: STORAGE_KEY, patch: item.persist },
    );
  }
  const page = await context.newPage();
  const url = `${BASE}${item.path}${captureHash(item.captureId)}`;
  console.log(`Capturing: ${item.name ?? item.path}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(DELAY_MS + 2000);
  } catch (err) {
    console.error(`  FAIL ${item.path}:`, err.message);
  } finally {
    await context.close();
  }
}

const CONCURRENCY = Number(process.env.FIGMA_CAPTURE_CONCURRENCY ?? 5);
for (let i = 0; i < items.length; i += CONCURRENCY) {
  const chunk = items.slice(i, i + CONCURRENCY);
  await Promise.all(chunk.map(visit));
}

await browser.close();
console.log("Done visiting all capture URLs.");
