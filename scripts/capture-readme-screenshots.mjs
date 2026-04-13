import { access, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(rootDir, 'docs', 'screenshots');
const editorUrl = process.env.CANVASCRAFT_EDITOR_URL ?? 'http://127.0.0.1:4177/#/edit/slide-1';

await mkdir(screenshotDir, { recursive: true });

const executablePath = await resolveChromiumExecutable();
const browser = await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: 2,
});

await page.goto(editorUrl, { waitUntil: 'networkidle' });
await page.locator('.editor-shell').waitFor();
await page.addStyleTag({
  content: `
    * {
      caret-color: transparent !important;
    }
  `,
});

await page.screenshot({
  path: path.join(screenshotDir, 'overview.png'),
  fullPage: false,
});

await page.getByRole('button', { name: /Properties/ }).click();
await page.getByRole('button', { name: /AI Chat/ }).click();
const chatPanel = page.locator('.chat-panel');
await page.getByRole('button', { name: 'Suggest a stronger headline' }).click();
await page.getByText(/I rewrote the lead copy|I added a headline block/).waitFor();
await chatPanel.screenshot({
  path: path.join(screenshotDir, 'local-assistant.png'),
});

await page.getByLabel('Close panel').click();
await page.getByRole('button', { name: 'Redact' }).click();
const redactionCard = page.locator('.redaction-card');
await redactionCard.waitFor();
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

async function resolveChromiumExecutable() {
  const explicitPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (explicitPath && (await fileExists(explicitPath))) {
    return explicitPath;
  }

  const systemCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const candidate of systemCandidates) {
    if (await fileExists(candidate)) return candidate;
  }

  const browserRoots = [
    path.join(rootDir, 'node_modules', 'playwright-core', '.local-browsers'),
    path.join(rootDir, '..', 'node_modules', 'playwright-core', '.local-browsers'),
  ];
  for (const browserRoot of browserRoots) {
    const chromiumExecutable = await resolveBundledChromium(browserRoot);
    if (chromiumExecutable) return chromiumExecutable;
  }

  return null;
}

async function resolveBundledChromium(baseDirectory) {
  try {
    const entries = await readdir(baseDirectory);
    const chromiumDirectory = entries
      .filter((entry) => entry.startsWith('chromium-'))
      .sort()
      .at(-1);

    if (!chromiumDirectory) return null;

    return path.join(baseDirectory, chromiumDirectory, 'chrome-linux', 'chrome');
  } catch {
    return null;
  }
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
