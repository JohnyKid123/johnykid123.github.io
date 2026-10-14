import { strict as assert } from "node:assert";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const html = resolve("index.html");
assert(existsSync(html), "index.html must exist");
assert(existsSync("styles.css"), "styles.css must exist");
assert(existsSync("app.js"), "app.js must exist");
assert(existsSync("favicon.svg"), "favicon.svg must exist");

const executablePath = process.env.CHROME_PATH
  || ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"]
    .find(existsSync);
assert(executablePath, "Chrome/Chromium must be installed on the runner");

const browser = await chromium.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
mkdirSync("test-results", { recursive: true });
const failures = [];

try {
  for (const width of [1440, 900, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    page.on("pageerror", error => failures.push(`${width}px: ${error.message}`));
    await page.goto(pathToFileURL(html).href, { waitUntil: "load" });

    assert.match(await page.title(), /Alex Venkov/);
    assert.equal(await page.locator(".project-card:visible").count(), 5, `${width}px: initial projects`);
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    assert(overflow.scroll <= overflow.viewport + 2,
      `${width}px: horizontal overflow (${overflow.scroll} > ${overflow.viewport})`);

    await page.getByRole("button", { name: /open source/i }).click();
    assert.equal(await page.locator(".project-card:visible").count(), 3, `${width}px: open-source filter`);
    await page.getByRole("button", { name: /my projects/i }).click();
    assert.equal(await page.locator(".project-card:visible").count(), 2, `${width}px: personal-project filter`);
    await page.getByRole("button", { name: /all work/i }).click();
    assert.equal(await page.locator(".project-card:visible").count(), 5, `${width}px: reset filter`);

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    assert.equal(await page.locator("body").getAttribute("data-theme"), "light", `${width}px: theme switching`);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    assert.equal(await page.locator("body").getAttribute("data-theme"), null, `${width}px: restoring dark theme`);

    if (width <= 700) {
      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      assert.equal(await page.locator("#main-nav").getAttribute("class"), "main-nav is-open");
      await page.locator("#main-nav a[href='#about']").click();
      assert.equal(await page.locator("#main-nav").getAttribute("class"), "main-nav");
    }

    const anchors = await page.locator("a[href^='#']").evaluateAll(links =>
      links.map(link => link.getAttribute("href"))
        .filter(href => href !== "#" && !document.getElementById(href.slice(1))));
    assert.equal(anchors.length, 0, `${width}px: broken local anchor links: ${anchors.join(", ")}`);

    await page.screenshot({ path: `test-results/portfolio-${width}.png`, fullPage: true });
    console.log(`PASS ${width}px viewport: rendering, filters, theme, links, no horizontal overflow`);
    await page.close();
  }
  assert.deepEqual(failures, [], `JavaScript page errors: ${failures.join("; ")}`);
  console.log("PASS all portfolio browser checks");
} finally {
  await browser.close();
}
