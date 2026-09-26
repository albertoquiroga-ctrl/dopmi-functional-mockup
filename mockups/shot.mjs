import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 950 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(dir, "publicar-caso-intro.html")).href);
await page.waitForTimeout(1200);
await page.locator(".phone-frame").screenshot({ path: path.join(dir, "publicar-caso-intro.png") });
await browser.close();
console.log("ok");
