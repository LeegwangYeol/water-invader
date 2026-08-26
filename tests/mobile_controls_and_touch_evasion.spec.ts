import { test, expect } from '@playwright/test';

test.describe('Mobile Touch & Drag Evasion Controls Suite', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Start game
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
  });

  test('R1: Pointer drag horizontally moves player with 1:1 delta calculation', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Get initial player position
    const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(initialPos).toBe(275); // (600 / 2) - 25

    // Start drag at center of canvas, move right by 60px in CSS coordinates
    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Drag right
    await page.mouse.move(startX + 60, startY, { steps: 5 });

    // Check player moved right
    const posAfterMoveRight = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterMoveRight).toBeGreaterThan(initialPos);

    // Drag left past start position
    await page.mouse.move(startX - 60, startY, { steps: 10 });

    const posAfterMoveLeft = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterMoveLeft).toBeLessThan(initialPos);

    await page.mouse.up();

    // After pointer up, movement flags are reset
    const movementFlags = await page.evaluate(() => ({
      isMovingLeft: (window as any).gameManager.player.isMovingLeft,
      isMovingRight: (window as any).gameManager.player.isMovingRight,
    }));
    expect(movementFlags.isMovingLeft).toBe(false);
    expect(movementFlags.isMovingRight).toBe(false);
  });

  test('R1: Extreme horizontal drag respects boundary clamping at 0 and max logical width', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Drag far to the left (beyond left screen edge)
    await page.mouse.move(startX - 1000, startY, { steps: 10 });
    const leftClampPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(leftClampPos).toBe(0);

    // Drag far to the right (beyond right screen edge)
    await page.mouse.move(startX + 2000, startY, { steps: 20 });
    const rightClampPos = await page.evaluate(() => ({
      x: (window as any).gameManager.player.position.x,
      maxX: (window as any).gameManager.logicalWidth - (window as any).gameManager.player.size.width,
    }));
    expect(rightClampPos.x).toBe(rightClampPos.maxX); // 600 - 50 = 550

    await page.mouse.up();
  });

  test('R1: Pointer drag event triggers shooting while active and releases on pointer up', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    // Initially not shooting
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // During pointer down on canvas, shooting is activated
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);

    await page.mouse.up();

    // After pointer up, shooting is deactivated
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  });

  test('R2: Mobile button controls (ALLY, ULT, FIRE) operate without breaking or moving player position', async ({ page }) => {
    // Check initial player position
    const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);

    // Give player currency and full ult
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 100;
      gm.player.ultimateGauge = 100;
      gm.updateScoreUI();
    });

    const allyBtn = page.locator('button', { hasText: 'ALLY(Q)' });
    const ultBtn = page.locator('button', { hasText: /ULT/i });
    const fireBtn = page.locator('button', { hasText: 'FIRE!' });

    await expect(allyBtn).toBeVisible();
    await expect(ultBtn).toBeVisible();
    await expect(fireBtn).toBeVisible();

    // Tap ALLY button
    await allyBtn.click();
    const currencyAfterAlly = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currencyAfterAlly).toBe(50);

    // Tap ULT button
    await ultBtn.click();
    const ultAfterUse = await page.evaluate(() => (window as any).gameManager.player.ultimateGauge);
    expect(ultAfterUse).toBe(0);

    // Player position should NOT have moved from button clicks
    const posAfterButtons = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterButtons).toBe(initialPos);

    // Press FIRE! button
    await fireBtn.dispatchEvent('pointerdown');
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);
    await fireBtn.dispatchEvent('pointerup');
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  });

  test('R2: Top HUD buttons (MUTE) are clickable without interfering with canvas or dragging', async ({ page }) => {
    const muteBtn = page.locator('button', { hasText: /MUTE|SOUND/i });
    await expect(muteBtn).toBeVisible();

    const initialText = await muteBtn.innerText();
    await muteBtn.click();
    const updatedText = await muteBtn.innerText();
    expect(updatedText).not.toBe(initialText);

    // Clicking mute should not move player
    const playerX = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(playerX).toBe(275);
  });

  test('R1 & R2 Adversarial: Multi-touch secondary pointer down does not cause position teleportation or hijack active drag', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);

    // 1. Primary finger down (pointerId 1)
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      const down1 = new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: sx,
        clientY: sy,
        bubbles: true,
      });
      canvasEl.dispatchEvent(down1);
    }, { sx: startX, sy: startY });

    // 2. Drag primary finger right by 30px
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      const move1 = new PointerEvent('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: sx + 30,
        clientY: sy,
        bubbles: true,
      });
      canvasEl.dispatchEvent(move1);
    }, { sx: startX, sy: startY });

    const posAfterFirstDrag = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterFirstDrag).toBeGreaterThan(initialPos);

    // 3. Secondary finger touches on opposite side (pointerId 2 at startX - 100)
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      const down2 = new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: sx - 100,
        clientY: sy,
        bubbles: true,
      });
      canvasEl.dispatchEvent(down2);
    }, { sx: startX, sy: startY });

    // 4. Primary finger continues moving right by another 20px (total +50px from start)
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      const move1_2 = new PointerEvent('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: sx + 50,
        clientY: sy,
        bubbles: true,
      });
      canvasEl.dispatchEvent(move1_2);
    }, { sx: startX, sy: startY });

    const posAfterSecondDrag = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterSecondDrag).toBeGreaterThan(posAfterFirstDrag);

    // Secondary finger move should NOT move player or jump position
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      const move2 = new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: sx - 120,
        clientY: sy,
        bubbles: true,
      });
      canvasEl.dispatchEvent(move2);
    }, { sx: startX, sy: startY });

    const posAfterSecondaryMove = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterSecondaryMove).toBe(posAfterSecondDrag);

    // 5. Release secondary pointer -> primary drag still intact
    await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas')!;
      const up2 = new PointerEvent('pointerup', {
        pointerId: 2,
        pointerType: 'touch',
        bubbles: true,
      });
      canvasEl.dispatchEvent(up2);
    });

    // 6. Release primary pointer
    await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas')!;
      const up1 = new PointerEvent('pointerup', {
        pointerId: 1,
        pointerType: 'touch',
        bubbles: true,
      });
      canvasEl.dispatchEvent(up1);
    });

    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  });

  test('R1 Adversarial: Stationary touch hold does not autonomously drift or jitter player position', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Initial position
    const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(initialPos).toBe(275);

    // Touch down at right edge of canvas (e.g. clientX = startX + 120)
    const touchX = canvasBox!.x + canvasBox!.width * 0.85;
    const touchY = canvasBox!.y + canvasBox!.height * 0.7;

    await page.mouse.move(touchX, touchY);
    await page.mouse.down();

    // Auto-firing should be on
    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);

    // Wait 300ms while holding pointer stationary
    await page.waitForTimeout(300);

    // Position must NOT have drifted autonomously towards touchX
    const posAfterHold = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterHold).toBe(initialPos);

    // Directional velocity flags must remain false during drag hold
    const flags = await page.evaluate(() => ({
      left: (window as any).gameManager.player.isMovingLeft,
      right: (window as any).gameManager.player.isMovingRight,
    }));
    expect(flags.left).toBe(false);
    expect(flags.right).toBe(false);

    await page.mouse.up();
  });

  test('R1 & R2 Adversarial: Simultaneous canvas drag and button tap (Ally/Ult) does not cancel drag or drop player position', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Prepare currency for ALLY summon
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 100;
      gm.updateScoreUI();
    });

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    // 1. Primary finger drags on canvas
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: sx,
        clientY: sy,
        bubbles: true,
      }));
      canvasEl.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: sx + 40,
        clientY: sy,
        bubbles: true,
      }));
    }, { sx: startX, sy: startY });

    const posAfterFirstDrag = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterFirstDrag).toBeGreaterThan(275);

    // 2. Secondary finger taps ALLY button
    const allyBtn = page.locator('button', { hasText: 'ALLY(Q)' });
    await allyBtn.dispatchEvent('pointerdown');
    await allyBtn.dispatchEvent('pointerup');

    // Verify currency spent
    const currencyAfterAlly = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currencyAfterAlly).toBe(50);

    // 3. Primary finger continues dragging without interruption
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: sx + 80,
        clientY: sy,
        bubbles: true,
      }));
    }, { sx: startX, sy: startY });

    const posAfterContinuedDrag = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posAfterContinuedDrag).toBeGreaterThan(posAfterFirstDrag);

    // Release canvas drag
    await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 10,
        pointerType: 'touch',
        bubbles: true,
      }));
    });
  });

  test('R1 Adversarial: PointerCancel event cleanly resets drag state, shooting state, and movement flags', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    // Start drag
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 20,
        pointerType: 'touch',
        clientX: sx,
        clientY: sy,
        bubbles: true,
      }));
      canvasEl.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 20,
        pointerType: 'touch',
        clientX: sx + 30,
        clientY: sy,
        bubbles: true,
      }));
    }, { sx: startX, sy: startY });

    expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);

    // Trigger pointercancel (e.g. system gesture / notification banner)
    await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointercancel', {
        pointerId: 20,
        pointerType: 'touch',
        bubbles: true,
      }));
    });

    const stateAfterCancel = await page.evaluate(() => ({
      isShooting: (window as any).gameManager.player.isShooting,
      isMovingLeft: (window as any).gameManager.player.isMovingLeft,
      isMovingRight: (window as any).gameManager.player.isMovingRight,
    }));

    expect(stateAfterCancel.isShooting).toBe(false);
    expect(stateAfterCancel.isMovingLeft).toBe(false);
    expect(stateAfterCancel.isMovingRight).toBe(false);
  });

  test('R1 Adversarial: Window blur during active pointer drag cleanly resets all dragging and movement flags', async ({ page }) => {
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = canvasBox!.x + canvasBox!.width / 2;
    const startY = canvasBox!.y + canvasBox!.height * 0.7;

    // Start drag
    await page.evaluate(({ sx, sy }) => {
      const canvasEl = document.querySelector('canvas')!;
      canvasEl.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 30,
        pointerType: 'touch',
        clientX: sx,
        clientY: sy,
        bubbles: true,
      }));
      canvasEl.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 30,
        pointerType: 'touch',
        clientX: sx + 30,
        clientY: sy,
        bubbles: true,
      }));
    }, { sx: startX, sy: startY });

    // Trigger blur event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });

    const stateAfterBlur = await page.evaluate(() => ({
      keysPressed: (window as any).gameManager.keysPressed,
      isShooting: (window as any).gameManager.player.isShooting,
      isMovingLeft: (window as any).gameManager.player.isMovingLeft,
      isMovingRight: (window as any).gameManager.player.isMovingRight,
    }));

    expect(Object.keys(stateAfterBlur.keysPressed).length).toBe(0);
    expect(stateAfterBlur.isShooting).toBe(false);
    expect(stateAfterBlur.isMovingLeft).toBe(false);
    expect(stateAfterBlur.isMovingRight).toBe(false);
  });
});
