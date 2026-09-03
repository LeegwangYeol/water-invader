# DISPATCH — 2026-09-04T01:13:22+09:00

You are the Worker Subagent implementing Milestone M1: Dynamic Backgrounds & Threat Signifiers (Requirement R1).

Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/
Project Root: /Users/user/src/water-invader/
Orchestrator ID: 03251405-283f-4dac-a410-75a04069ddc9

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Architecture
Read the following authoritative reference files:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md

## Scope & File Ownership
You exclusively own and modify:
- `src/game/types.ts`
- `src/game/Enemy.ts`
- `src/game/GameManager.ts`

## Specific Implementation Requirements
1. `src/game/types.ts`:
   - Add and export:
     ```typescript
     export interface BiomeTheme {
       id: string;
       nameKo: string;
       nameEn: string;
       tier: number; // 0 for Waves 1-9, 1 for Waves 10-19, etc.
       gradientTop: string;
       gradientBottom: string;
       particleColor: string;
       particleSpeedMult: number;
       particleDirection: 'UP' | 'DOWN' | 'FLOAT';
       accentGlow: string;
     }

     export type ThreatLevel = 'NONE' | 'ELITE' | 'BOSS' | 'CRISIS';

     export interface ThreatState {
       level: ThreatLevel;
       hasBoss: boolean;
       hasElite: boolean;
       hasCrisis: boolean;
       threatColor: string;
       threatIntensity: number; // 0.0 to 1.0 (smoothly interpolated)
       description?: string;
     }
     ```

2. `src/game/Enemy.ts`:
   - Add public getters for threat assessment:
     ```typescript
     public get isBoss(): boolean {
       return this.type === EnemyType.BOSS;
     }

     public get isElite(): boolean {
       return (
         this.isMidTier ||
         this.type === EnemyType.SNIPER ||
         this.type === EnemyType.ROGUE_STALKER ||
         this.type === EnemyType.ROGUE_MECH ||
         this.type === EnemyType.ROGUE_GOLIATH ||
         this.type === EnemyType.ROGUE_PHANTOM ||
         this.type === EnemyType.ROGUE_CARRIER
       );
     }
     ```

3. `src/game/GameManager.ts`:
   - Add static `BIOMES` array with 5 biomes (Surface Aquifer, Abyssal Trench, Bioluminescent Reef, Toxic Seabed, Cosmic Void) per `survey.md` Section 5.3.
   - Add public fields `threatIntensity: number = 0;` and `activeThreatLevel: ThreatLevel = 'NONE';`.
   - Add `public getCurrentBiome(): BiomeTheme`:
     ```typescript
     public getCurrentBiome(): BiomeTheme {
       const tier = Math.floor((Math.max(1, this.level) - 1) / 10);
       const index = tier % GameManager.BIOMES.length;
       return GameManager.BIOMES[index];
     }
     ```
   - Add `public getThreatState(): ThreatState` that detects active Boss, Crisis, or Elite presence.
   - In `update(deltaTime)`: smoothly lerp `this.threatIntensity`: if threat level !== 'NONE', lerp towards 1.0 (at rate `deltaTime * 2.5`); if 'NONE', lerp towards 0.0 (at rate `deltaTime * 2.5`).
   - In `draw()` Layer 1 (Static Background Layer):
     - Replace static `#0f172a` fill with vertical linear gradient from `biome.gradientTop` to `biome.gradientBottom`.
     - When `threatIntensity > 0.01`, draw a radial threat vignette (pulsing smoothly, crimson for Boss, green/amber for Crisis, magenta for Elite) around the perimeter, keeping the central area clear to preserve $\ge 7:1$ projectile contrast.
     - Draw 32 ambient particles using `biome.particleColor`, respecting `biome.particleDirection`, speed multiplier, and deterministic sinusoidal calculations with ZERO GC allocation.

## Verification & Pre-Commit Build Rules
- Run `npx tsc --noEmit` and confirm 0 TypeScript errors.
- Run `npm run build` and confirm build passes.
- Run existing regression tests: `npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts`.
- Write your completion report in `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/handoff.md`.
- Use `send_message` to notify the orchestrator when finished.
