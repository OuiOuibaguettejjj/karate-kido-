const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = path.join(root, pathname === "/" ? "index.html" : pathname.slice(1));
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      Math.random = () => 0.9;
      localStorage.setItem("kk2-profile", JSON.stringify({
        coins: 100, best: 0, xp: 0, breath: 0, focus: 0, skin: "red", games: 0
      }));
    });
    await page.goto("http://127.0.0.1:4173", { waitUntil: "load" });
    assert.equal(await page.locator("#home-screen").evaluate(el => el.classList.contains("active")), true);
    assert.equal(await page.locator("#game").evaluate(el => el.width === 240 && el.height === 360), true);
    await page.locator("#play-button").click();
    await page.locator("#left-button").click();
    assert.equal(await page.locator("#score").textContent(), "10");
    await page.locator("#right-button").click();
    assert.equal(await page.locator("#over-screen").evaluate(el => el.classList.contains("active")), true);
    let profile = await page.evaluate(() => JSON.parse(localStorage.getItem("kk2-profile")));
    assert.equal(profile.best, 10);
    assert.equal(profile.coins, 102);
    await page.locator('[data-screen="dojo-screen"]').click();
    await page.locator("#buy-breath").click();
    profile = await page.evaluate(() => JSON.parse(localStorage.getItem("kk2-profile")));
    assert.equal(profile.breath, 1);
    assert.equal(profile.coins, 52);
    await page.locator('[data-screen="profile-screen"]').click();
    await page.locator('.skin[data-skin="blue"]').click();
    profile = await page.evaluate(() => JSON.parse(localStorage.getItem("kk2-profile")));
    assert.equal(profile.skin, "blue");
    assert.deepEqual(errors, []);
    console.log("Browser smoke test passed: render, mobile controls, score, collision, persistence, dojo and skin selection.");
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
