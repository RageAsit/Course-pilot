import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');

async function capture() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('[Screenshots] Capturing Login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

  console.log('[Screenshots] Capturing Register page...');
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_register_page.png') });

  // Register a fresh demo account
  const timestamp = Date.now();
  const email = `auditor.${timestamp}@university.edu`;
  console.log(`[Screenshots] Registering ${email}...`);
  await page.fill('input[placeholder="Alex Rivera"]', 'Evelyn Reed');
  await page.fill('input[placeholder="student@university.edu"]', email);
  await page.locator('input[type="password"]').first().fill('DemoPass123!');
  await page.locator('input[placeholder="Repeat your password"]').fill('DemoPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/', { timeout: 10000 });

  // Create Assignment 1 (Distributed Systems - Urgent)
  console.log('[Screenshots] Creating Assignment 1...');
  await page.click('button:has-text("New Assignment")');
  await page.waitForSelector('text=Create New Assignment');
  await page.fill('input[placeholder*="Distributed Systems"]', 'Distributed Database Consensus Engine');
  await page.fill('input[placeholder*="CS450"]', 'CS 452');
  const d1 = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await page.fill('input[type="date"]', d1);
  await page.fill('input[type="number"][min="1"]', '240');
  await page.click('button[type="submit"]:has-text("Create Assignment")');
  await page.waitForTimeout(1000);

  // Create Assignment 2 (Econometrics Paper - Medium)
  console.log('[Screenshots] Creating Assignment 2...');
  await page.click('button:has-text("New Assignment")');
  await page.waitForSelector('text=Create New Assignment');
  await page.fill('input[placeholder*="Distributed Systems"]', 'Microeconomic Empirical Policy Analysis');
  await page.fill('input[placeholder*="CS450"]', 'ECON 310');
  const d2 = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  await page.fill('input[type="date"]', d2);
  await page.fill('input[type="number"][min="1"]', '180');
  await page.click('button[type="submit"]:has-text("Create Assignment")');
  await page.waitForTimeout(1500);

  // Capture Dashboard with live assignments
  console.log('[Screenshots] Capturing Dashboard with live data...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_desktop.png') });

  // Mobile Dashboard
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_mobile.png') });
  await page.setViewportSize({ width: 1440, height: 900 });

  // Navigate to Study Planner & Generate Plan
  console.log('[Screenshots] Generating Study Plan...');
  await page.click('a[href="/schedule"]');
  await page.waitForURL('**/schedule');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Generate Study Schedule")');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_planner_desktop.png') });

  // Navigate to Analytics
  console.log('[Screenshots] Capturing Analytics...');
  await page.click('a[href="/analytics"]');
  await page.waitForURL('**/analytics');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_analytics_desktop.png') });

  await browser.close();
  console.log('[Screenshots] All rich screenshots captured successfully in docs/screenshots!');
}

capture().catch((err) => {
  console.error('[Screenshots Error]', err);
  process.exit(1);
});
