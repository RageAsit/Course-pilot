const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function runDemo() {
  const demoDir = path.resolve(__dirname, '../docs/demo');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  console.log('[Demo] 🎬 Launching Chromium with video capture (1280x720)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: demoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const timestamp = Date.now();
  const demoUser = {
    name: 'Sarah Chen (Honor Student)',
    email: `sarah.chen.${timestamp}@stanford.edu`,
    password: 'DemoPassword123!',
  };

  try {
    // 0-4s: Welcome / Login Page
    console.log('[Demo] 0–4s: Navigating to CoursePilot Login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Register a new academic student account
    console.log('[Demo] Registering new student account for realistic MongoDB isolation...');
    await page.click('text=Create an account');
    await page.waitForURL('**/register');
    await page.fill('input[placeholder="Alex Rivera"]', demoUser.name);
    await page.fill('input[placeholder="student@university.edu"]', demoUser.email);
    await page.fill('input[placeholder="Minimum 6 characters"]', demoUser.password);
    await page.fill('input[placeholder="Repeat your password"]', demoUser.password);
    await page.waitForTimeout(600);
    await page.click('button[type="submit"]');

    // Arrive at Dashboard
    await page.waitForURL('http://localhost:5173/');
    console.log('[Demo] Arrived at authenticated Dashboard.');
    await page.waitForTimeout(2000);

    // 4-10s: Create realistic assignments
    console.log('[Demo] 4–10s: Creating Assignment 1 (Distributed Systems)...');
    await page.click('button:has-text("New Assignment")');
    await page.waitForSelector('text=Create New Assignment');
    await page.fill('input[placeholder*="Distributed Systems"]', 'Raft Consensus Protocol Implementation');
    await page.fill('input[placeholder*="CS450"]', 'CS 452');
    
    const due1 = new Date();
    due1.setDate(due1.getDate() + 2);
    await page.fill('input[type="date"]', due1.toISOString().split('T')[0]);
    await page.fill('input[type="number"][min="1"]', '180');
    await page.selectOption('select', '5'); // Critical / Exam
    await page.waitForTimeout(500);
    await page.click('button:has-text("Create Assignment")');
    await page.waitForTimeout(1500);

    console.log('[Demo] Creating Assignment 2 (Econometrics)...');
    await page.click('button:has-text("New Assignment")');
    await page.waitForSelector('text=Create New Assignment');
    await page.fill('input[placeholder*="Distributed Systems"]', 'Econometrics Empirical Research Paper');
    await page.fill('input[placeholder*="CS450"]', 'ECON 312');
    
    const due2 = new Date();
    due2.setDate(due2.getDate() + 4);
    await page.fill('input[type="date"]', due2.toISOString().split('T')[0]);
    await page.fill('input[type="number"][min="1"]', '120');
    await page.selectOption('select', '4'); // High
    await page.waitForTimeout(500);
    await page.click('button:has-text("Create Assignment")');
    await page.waitForTimeout(1500);

    // Switch to Priority Queue Tab
    console.log('[Demo] Inspecting Priority Queue deterministic scoring breakdown...');
    await page.click('button:has-text("Priority Queue")');
    await page.waitForTimeout(3500);

    // 10-18s: Navigate to Study Planner
    console.log('[Demo] 10–18s: Opening Study Planner and setting parameters...');
    await page.click('a[href="/schedule"]');
    await page.waitForURL('**/schedule');
    await page.waitForTimeout(1500);

    // Click Generate Study Schedule
    console.log('[Demo] Generating optimized study schedule...');
    await page.click('button:has-text("Generate Study Schedule")');
    await page.waitForTimeout(3500);

    // 18-25s: Navigate to Analytics
    console.log('[Demo] 18–25s: Inspecting Analytics charts & real metrics...');
    await page.click('a[href="/analytics"]');
    await page.waitForURL('**/analytics');
    await page.waitForTimeout(4000);

    // 25-30s: Return to Dashboard, complete an assignment, and logout
    console.log('[Demo] 25–30s: Returning to Dashboard to demonstrate completion...');
    await page.click('a[href="/"]');
    await page.waitForURL('http://localhost:5173/');
    await page.waitForTimeout(1500);

    // Toggle complete
    const completeBtn = page.locator('button[title*="Mark as complete"]').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      console.log('[Demo] Successfully marked assignment as completed.');
      await page.waitForTimeout(2000);
    }

    // Logout
    console.log('[Demo] Logging out...');
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');
    console.log('[Demo] Successfully returned to login screen.');
    await page.waitForTimeout(1500);

  } catch (err) {
    console.error('[Demo Error]:', err);
    throw err;
  } finally {
    await page.close();
    const video = page.video();
    let videoPath = null;
    if (video) {
      videoPath = await video.path();
      console.log('[Demo] Raw video saved by browser at:', videoPath);
    }
    await context.close();
    await browser.close();

    if (videoPath && fs.existsSync(videoPath)) {
      const targetWebm = path.join(demoDir, 'coursepilot-demo.webm');
      const targetMp4 = path.join(demoDir, 'coursepilot-demo.mp4');
      fs.copyFileSync(videoPath, targetWebm);
      console.log(`[Demo Success] WebM saved: ${targetWebm} (${fs.statSync(targetWebm).size} bytes)`);

      // Attempt conversion to MP4 using Playwright's bundled ffmpeg
      const ffmpegPath = path.join(
        process.env.LOCALAPPDATA || 'C:\\Users\\asito\\AppData\\Local',
        'ms-playwright\\ffmpeg-1013\\ffmpeg.exe'
      );
      if (fs.existsSync(ffmpegPath)) {
        try {
          console.log('[Demo] Converting WebM to MP4 using bundled FFmpeg...');
          execSync(`"${ffmpegPath}" -y -i "${targetWebm}" -c:v libx264 -pix_fmt yuv420p "${targetMp4}"`, {
            stdio: 'inherit',
          });
          console.log(`[Demo Success] MP4 created: ${targetMp4} (${fs.statSync(targetMp4).size} bytes)`);
        } catch (convErr) {
          console.warn('[Demo] FFmpeg conversion warning:', convErr.message);
        }
      }
    }
  }
}

runDemo().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
