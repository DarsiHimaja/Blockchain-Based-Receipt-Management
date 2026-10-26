const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

async function capture() {
  console.log("Starting screenshot capture of all 4 pages...");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const outputDir = path.join(__dirname, "../screenshots");
  const brainDir = "C:\\Users\\himaj\\.gemini\\antigravity\\brain\\bf21da1c-bdd2-4423-879b-5ce22a76ff48";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 950 },
  });

  const page = await browser.newPage();

  // Helper to save to both project screenshots and brain artifacts directory
  const saveScreenshot = async (pageObj, filename) => {
    const localPath = path.join(outputDir, filename);
    const brainPath = path.join(brainDir, filename);
    await pageObj.screenshot({ path: localPath, fullPage: true });
    fs.copyFileSync(localPath, brainPath);
    console.log(`Saved screenshot: ${filename}`);
  };

  try {
    // 1. Home / Dashboard
    console.log("Capturing 1. Home / Dashboard...");
    await page.goto("http://localhost:3000/?tab=home", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot(page, "01_home_dashboard.png");

    // 2. Merchant Portal
    console.log("Capturing 2. Merchant Portal...");
    await page.goto("http://localhost:3000/?tab=merchant&mockRole=merchant", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot(page, "02_merchant_portal.png");

    // 3. Customer Purchase History
    console.log("Capturing 3. Customer Purchase History...");
    await page.goto("http://localhost:3000/?tab=customer&mockRole=customer", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot(page, "03_customer_purchase_history.png");

    // 4. Verifier Page
    console.log("Capturing 4. Verifier Page (with active verification result)...");
    await page.goto("http://localhost:3000/?tab=verifier", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));

    // Fill sample data and click verify
    try {
      const sampleBtn = await page.$('button[type="button"]');
      if (sampleBtn) {
        await sampleBtn.click();
        await new Promise((r) => setTimeout(r, 500));
      }
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) {
        await verifyBtn.click();
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (e) {
      console.warn("Could not trigger verification click, capturing static verifier form:", e);
    }

    await saveScreenshot(page, "04_verifier_page.png");

    console.log("All 4 screenshots captured successfully!");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
  } finally {
    await browser.close();
  }
}

capture();
