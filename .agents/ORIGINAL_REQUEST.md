# Original User Request

## 2026-08-26T02:38:26Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Fix mobile touch X-axis mapping and provide cross-device screenshot verification
> Requested team: Small, focused team

The mobile touch controls are misaligned; moving left and right doesn't seem to track correctly from the center of the screen on devices with various aspect ratios (like Samsung S25+ and iPhones). The team must fix this mapping and provide visual proof via screenshots.

Working directory: ~/teamwork_projects/water_invader_mobile_centering_fix
Integrity mode: development

## Requirements

### R1. Fix Touch Coordinate Alignment
Analyze the touch and pointer event logic in src/components/game-canvas.tsx. Fix the coordinate mapping so that the player character tracks the touch delta exactly 1:1, perfectly centered and scaled, regardless of the device's CSS aspect ratio, viewport size, or device pixel ratio. 

### R2. Cross-Device Emulator Verification
Configure automated tests (e.g., Playwright) or use Chrome DevTools to emulate the viewports of a Samsung Galaxy S25+ and a modern iPhone (e.g., iPhone 15/16). Execute touch-drag actions in these emulated environments.

## Acceptance Criteria

### Verification
- [ ] Code inspection confirms that touch clientX is properly mapped to the game's internal logical resolution using the canvas bounding client rect.
- [ ] Playwright test scripts execute touch dragging on both a Samsung and an iPhone viewport profile.
- [ ] The agent explicitly generates and saves screenshot artifacts showing the player perfectly aligned during a touch drag on these specific devices, fulfilling the user's request for visual proof.
