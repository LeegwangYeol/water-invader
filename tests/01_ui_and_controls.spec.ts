import { test, expect } from '@playwright/test';

test.describe('R1: UI & Controls Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page loads properly with Canvas and Menu Overlay', async ({ page }) => {
    // 1. Check title
    await expect(page).toHaveTitle(/Water Invader/i);

    // 2. Check Canvas element presence and size
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);

    const canvasWidth = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
    const canvasHeight = await canvas.evaluate((el: HTMLCanvasElement) => el.height);
    expect(canvasWidth).toBe(600);
    expect(canvasHeight).toBe(800);

    // 3. Menu elements (using first() to account for layout header + canvas overlay)
    const menuTitle = page.locator('h1', { hasText: 'Water Invader' }).first();
    await expect(menuTitle).toBeVisible();

    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible();

    const howToPlayBtn = page.locator('button', { hasText: 'HOW TO PLAY' });
    await expect(howToPlayBtn).toBeVisible();
  });

  test('HOW TO PLAY modal opens, shows controls/mechanics/cheats, and closes', async ({ page }) => {
    const howToPlayBtn = page.locator('button', { hasText: 'HOW TO PLAY' });
    await howToPlayBtn.click();

    // Verify modal header
    const modalHeader = page.locator('h2', { hasText: 'HOW TO PLAY' });
    await expect(modalHeader).toBeVisible();

    // Verify Controls section
    await expect(page.locator('text=Move: Left/Right Arrows or A/D keys')).toBeVisible();
    await expect(page.locator('text=Shoot: Spacebar')).toBeVisible();
    await expect(page.locator('text=Ultimate Skill (Heavy Rain): E or Shift key')).toBeVisible();

    // Verify Developer Tools Cheats section
    await expect(page.locator('text=Developer Tools (Cheats)')).toBeVisible();
    await expect(page.locator('text=F3: Toggle Debug Overlay')).toBeVisible();
    await expect(page.locator('text=F4: Toggle God Mode')).toBeVisible();
    await expect(page.locator('text=F5: Add 1000 💧 instantly')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button', { hasText: 'CLOSE' });
    await closeBtn.click();
    await expect(modalHeader).not.toBeVisible();
  });

  test('Starting game initializes window.gameManager and transitions HUD & In-Game Controls', async ({ page }) => {
    // Start game
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();

    // Verify window.gameManager exposure
    const hasGameManager = await page.evaluate(() => typeof (window as any).gameManager !== 'undefined');
    expect(hasGameManager).toBe(true);

    const gameState = await page.evaluate(() => (window as any).gameManager.state);
    expect(gameState).toBe('PLAYING'); // GameState.PLAYING = 'PLAYING'

    // HUD element verification
    const scoreText = page.locator('h2', { hasText: /Score:|점수:/i });
    await expect(scoreText).toBeVisible();

    const waterText = page.locator('p', { hasText: /Pure Water:|정수된 물:/i });
    await expect(waterText).toBeVisible();

    const waveText = page.locator('p', { hasText: /WAVE 1/i });
    await expect(waveText).toBeVisible();

    // Mobile / Screen controls in DOM
    const allyBtn = page.locator('button', { hasText: 'ALLY(Q)' });
    await expect(allyBtn).toBeVisible();

    const ultBtn = page.locator('button', { hasText: /ULT/i });
    await expect(ultBtn).toBeVisible();

    const fireBtn = page.locator('button', { hasText: 'FIRE!' });
    await expect(fireBtn).toBeVisible();
  });

  test('HUD reflect pure water currency changes and enables ALLY(Q) button', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Check ALLY(Q) active state with starter 150 pure water allowance (>= 50)
    const allyBtn = page.locator('button', { hasText: 'ALLY(Q)' });
    const initialClass = await allyBtn.getAttribute('class');
    expect(initialClass).toContain('bg-green-600');

    // Add currency via F5 cheat
    await page.keyboard.press('F5');

    // Verify currency updated in GameManager and HUD
    const currency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currency).toBe(1150);

    const waterText = page.locator('p', { hasText: /1150/ });
    await expect(waterText).toBeVisible();

    // ALLY(Q) remains active
    const updatedClass = await allyBtn.getAttribute('class');
    expect(updatedClass).toContain('bg-green-600');
  });
});
