const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const fixturePath = path.resolve('tests', 'fixtures', 'sample-theme.json');
const fixtureBuffer = fs.readFileSync(fixturePath);

test.beforeEach(async ({ page }) => {
  // Force the download-based export path (no File System Access API) and start
  // each test with clean browser storage.
  await page.addInitScript(() => {
    try {
      Object.defineProperty(window, 'showSaveFilePicker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    } catch (_) { /* already absent */ }
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (_) { /* storage unavailable */ }
  });

  // Accept confirm() dialogs and answer prompt() with a variable name.
  page.on('dialog', async dialog => {
    if (dialog.type() === 'prompt') await dialog.accept('brand');
    else await dialog.accept();
  });

  await page.goto('/');
});

test('starts the standalone editor with the Dark preset and all tokens', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Pi Theme Builder' })).toBeVisible();
  await expect(page.locator('#themeName')).toHaveValue('my-theme');
  await expect(page.locator('.token')).toHaveCount(56);
  await expect(page.locator('#count')).toHaveText('56 tokens');
  await expect(page.locator('#previewTitle')).toHaveText('Full Session');
  await expect(page.locator('#preview')).toBeVisible();
});

test('switches between the Dark and Light presets', async ({ page }) => {
  await page.selectOption('#preset', 'light');
  await expect(page.locator('#themeName')).toHaveValue('light-theme');
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#0369a1');

  const rootAccent = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent').trim());
  expect(rootAccent).toBe('#0369a1');
});

test('edits a token value and updates the live preview', async ({ page }) => {
  const accent = page.locator('.value[data-value="accent"]');
  await accent.fill('#123456');
  await accent.blur();

  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#123456');
  const rootAccent = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent').trim());
  expect(rootAccent).toBe('#123456');
});

test('filters tokens by search and restores the full list', async ({ page }) => {
  await page.fill('#search', 'syntax');
  await expect(page.locator('#count')).toHaveText('9 of 56 tokens');
  await expect(page.locator('.token[data-token="syntaxComment"]')).toBeVisible();
  await expect(page.locator('.token[data-token="accent"]')).toHaveCount(0);

  await page.fill('#search', '');
  await expect(page.locator('#count')).toHaveText('56 tokens');
});

test('adds a variable and assigns it to a token', async ({ page }) => {
  await page.click('#addVarBtn');
  await expect(page.locator('.var-row')).toContainText('brand');

  await page.selectOption('.assign-var[data-value="accent"]', 'brand');
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('brand');
  await expect(page.locator('.token[data-token="accent"] .token-desc')).toContainText('#7dd3fc');
  await expect(page.locator('.var-row')).toContainText('1 reference');
});

test('imports a theme file and exports the same draft', async ({ page }) => {
  await page.setInputFiles('#fileInput', {
    name: 'sample-theme.json',
    mimeType: 'application/json',
    buffer: fixtureBuffer,
  });
  await expect(page.locator('#themeName')).toHaveValue('fixture-theme');
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#123456');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#exportBtn'),
  ]);
  expect(download.suggestedFilename()).toBe('fixture-theme.json');

  const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(exported.name).toBe('fixture-theme');
  expect(exported.colors.accent).toBe('#123456');
});

test('undo restores the previous edit and reset returns to the Dark preset', async ({ page }) => {
  const accent = page.locator('.value[data-value="accent"]');
  await accent.fill('#123456');
  await accent.blur();
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#123456');

  await page.click('#undoBtn');
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#7dd3fc');

  await page.locator('.value[data-value="accent"]').fill('#abcdef');
  await page.locator('.value[data-value="accent"]').blur();
  await page.click('#resetBtn');

  await expect(page.locator('#themeName')).toHaveValue('dark-theme');
  await expect(page.locator('.value[data-value="accent"]')).toHaveValue('#7dd3fc');
});

test('switches between every preview tab', async ({ page }) => {
  const tabs = [
    ['session', 'Full Session'],
    ['states', 'State gallery'],
    ['markdown', 'Syntax / Markdown'],
    ['thinking', 'Thinking / Bash'],
    ['html', 'HTML export'],
  ];

  for (const [mode, label] of tabs) {
    await page.click(`#previewTabs button[data-mode="${mode}"]`);
    await expect(page.locator('#previewTitle')).toHaveText(label);
    await expect(page.locator('#preview')).toHaveAttribute('data-mode', mode);
  }
});
