import { chromium } from "playwright";
import express from "express";

const app = express();
app.use(express.json());

// Boot one browser when the service starts — reuse it for all requests
// rather than spinning up a new Chromium per screenshot
let browser;
(async () => {
  browser = await chromium.launch();
  console.log("[playwright] Browser ready");
})();

app.post("/screenshot", async (req, res) => {
  const { url, fullPage = true, width = 1280, height = 900 } = req.body;

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  let page;
  try {
    page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const screenshot = await page.screenshot({ fullPage });
    res.json({ base64: screenshot.toString("base64") });
  } catch (err) {
    console.error(`[playwright] Screenshot failed for ${url}:`, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (page) await page.close();
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(3200, () => console.log("[playwright] Service running on :3200"));
