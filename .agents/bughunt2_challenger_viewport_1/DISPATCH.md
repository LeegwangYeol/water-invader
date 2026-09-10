## 2026-09-09T03:07:06Z
You are a Challenger agent for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/bughunt2_challenger_viewport_1

CRITICAL MANDATORY INSTRUCTION:
Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md before starting work.
Also read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

YOUR TASK:
Perform adversarial empirical challenge testing on Pre-Continue Shop state persistence and Mobile Viewport UI:
1. Challenge Game Over Tank Repair Economy:
   - Simulate player death.
   - Buy Repair Tank in `GameOverModal` (deducting 75 currency).
   - Click Continue -> Verify that HP in Pre-Continue Shop is 4/5 (or higher), NOT clamped back to 3!
   - Verify that currency spent is properly deducted and player receives full benefit of the purchase.
2. Challenge Emergency Allies Reset:
   - Trigger emergency reinforcements on low HP (<=1 HP).
   - Die and Continue wave.
   - Lower HP to <= 1 HP again on resumed wave.
   - Verify that `emergencyAlliesTriggeredThisWave` allows emergency reinforcements to trigger again on the continued wave.
3. Challenge Mobile Viewport Touch & Layout:
   - Check that mobile touch controls (`ALLY`, `ULT`, `FIRE`) maintain at least 44px height across screen heights from 500px to 900px.
   - Check that modal action buttons (Continue / Restart) in `GameOverModal` and `ShopModal` remain accessible and clickable on small viewports (e.g. 375x667 Mobile SE).
   - Check that TopHUD cards do not occlude enemy spawns at logical y in [50, 90].
4. Author and execute an adversarial test (e.g. in `tests/bughunt2_viewport_persistence_adversarial.spec.ts` or run via Playwright).

OUTPUT REQUIREMENTS:
Write your challenge report to /Users/user/src/water-invader/.agents/bughunt2_challenger_viewport_1/handoff.md.
State your verdict: CONFIRMED or REJECTED. Send a message to parent when done.
