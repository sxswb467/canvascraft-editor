import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(rootDir, 'docs', 'screenshots');
const browserRoot = path.join(rootDir, 'node_modules', 'playwright-core', '.local-browsers');

await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: await resolveChromiumExecutable(browserRoot),
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1400 },
  deviceScaleFactor: 2,
});

await page.goto('http://127.0.0.1:4177/', { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `
    * {
      caret-color: transparent !important;
    }
  `,
});

await page.screenshot({
  path: path.join(screenshotDir, 'overview.png'),
  fullPage: true,
});

const chatPanel = page.locator('.chat-panel');
await page.getByRole('button', { name: 'Suggest a stronger headline' }).click();
await page.getByText(/I rewrote the lead copy|I added a headline block/).waitFor();
await chatPanel.screenshot({
  path: path.join(screenshotDir, 'local-assistant.png'),
});

const redactionCard = page.locator('.redaction-card');
await redactionCard.scrollIntoViewIfNeeded();
const canvas = redactionCard.locator('canvas');
const box = await canvas.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.38);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.68, box.y + box.height * 0.52, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}
await redactionCard.screenshot({
  path: path.join(screenshotDir, 'redaction-lab.png'),
});

await browser.close();

async function resolveChromiumExecutable(baseDirectory) {
  const entries = await readdir(baseDirectory);
  const chromiumDirectory = entries
    .filter((entry) => entry.startsWith('chromium-'))
    .sort()
    .at(-1);

  if (!chromiumDirectory) {
    throw new Error('No Chromium build found in Playwright local browsers.');
  }

  return path.join(baseDirectory, chromiumDirectory, 'chrome-linux', 'chrome');
}
