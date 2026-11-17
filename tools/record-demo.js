// Records an app's auto-play demo to MP4 (vertical for TikTok/Reels, or landscape with the code panel).
//
//   node tools/record-demo.js wigs vertical      -> out/wigs-vertical.mp4
//   node tools/record-demo.js app landscape      -> out/app-landscape.mp4
//   node tools/record-demo.js wigs vertical dark -> black theme
//
// Needs: npm i -D playwright && npx playwright install chromium, plus ffmpeg on PATH.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , appDir = 'wigs', shape = 'vertical', theme = ''] = process.argv;
const size = shape === 'landscape' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size } });
  const page = await ctx.newPage();
  const url = 'file://' + path.join(root, appDir, 'index.html') + '?demo&big' + (theme === 'dark' ? '&dark' : '');
  await page.goto(url);
  // the page sets body.demo-done when the scripted demo finishes
  await page.waitForFunction(() => document.body.classList.contains('demo-done'), null, { timeout: 180000 });
  await page.waitForTimeout(500);
  const video = page.video();
  await ctx.close();
  await browser.close();

  const name = `${appDir}-${shape}${theme ? '-' + theme : ''}`;
  const webm = path.join(outDir, name + '.webm');
  fs.renameSync(await video.path(), webm);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '0.8', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', path.join(outDir, name + '.mp4')]);
  fs.unlinkSync(webm);
  console.log('Saved', path.join('out', name + '.mp4'));
})();
