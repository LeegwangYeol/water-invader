# Handoff Report: Specialist 4.3 — Deep Trench Apex Predators (Stealth Camouflage & Ambush Stalkers)

## 1. Observation
- **Directives & Constraints**:
  - `ORIGINAL_REQUEST.md:347`: "사용자가 프롬프트 상에서 '바로 시작'이라고 명시적으로 묻지 말고 진행하라고 허가(Approval)를 내렸습니다. 또한 **'개발은 하지마'**라는 추가 지시가 있었습니다. 따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고 사전 승인된 것으로 간주하되, **절대 코드를 수정하거나 기능을 구현하지 말고 오직 브레인스토밍 아이디어 산출 및 문서화(IDEAS_PITCH.md 등) 작업만 원스톱으로 진행하십시오.**"
  - `COLLABORATION.md:19`: "- **STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE**: This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git."
- **Codebase Architecture & Existing Patterns**:
  - `src/game/types.ts:31-46`: `EnemyType` enum enumerates existing regular and rogue types (`NORMAL = 0`, `ZIGZAG = 1`, `BOSS = 2`, `SNIPER = 3`, `DIVER = 4`, `SHIELDED = 5`, `SPLITTER = 6`, `ROGUE_DRONE = 7`, `ROGUE_STALKER = 8`, `ROGUE_MECH = 9`, `ROGUE_GOLIATH = 10`, `ROGUE_PHANTOM = 11`, `ROGUE_CARRIER = 12`, `SABOTEUR = 13`).
  - `src/game/Enemy.ts:24-46`: Logical canvas dimensions are fixed at `canvasWidth = 720` and `canvasHeight = 960`. Piercing and elite status properties (`isElite`, `getPiercingMultiplier()`, `getPiercingCount()`) scale with wave tier.
  - `src/game/crisis/types.ts:171-341`: 12 distinct Crisis Archetypes exist, with `ThreatLevel` states (`NONE`, `ELITE`, `BOSS`, `CRISIS`).
  - `src/game/SoundManager.ts:1-100`: Sound effects are synthesized procedurally via HTML5 Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`) with zero external audio asset loading.

## 2. Logic Chain
1. *From Observation (Constraints)*: The user and orchestrator mandates strictly prohibit code edits (.ts, .tsx, .css), test runs, or git commands. Therefore, this deliverable must be a pure, exhaustive feature specification and pitch component (`report.md`) designed to be integrated into the overarching pitch document (`IDEAS_PITCH.md`).
2. *From Observation (`Enemy.ts` & `types.ts`)*: Existing enemies spawn in descending top-of-screen grids or downward dive trajectories. Introducing an Apex Predator with perimeter-stalking and border-incursion mechanics provides a radical gameplay contrast without perturbing the rigid $720 \times 960$ coordinate system.
3. *From Observation (`SoundManager.ts`)*: Procedural audio synthesis is already established for laser fire, explosions, and powerups. Deep-sea hydrophone roars and cavitation whooshes can be created purely through Web Audio API sub-bass oscillators ($25\text{Hz}-45\text{Hz}$) and swept biquad filters, guaranteeing zero asset bundle impact and instant latency-free playback.
4. *From Observation (`report.md` Deliverable)*: Synthesizing the 6 core pillars (Atmospheric Hook, Refractive Cloaking & Ambush, 3-Stage Multi-sensory Telegraphing & Parry Window, Procedural Audio & Canvas FX, Dynamic UI Reticle Clamping, and Crisis Synergy) yields a complete, production-ready specification that can be implemented cleanly into `water-invader` once coding approval is granted.

## 3. Caveats
- **No Implementation Performed**: In strict adherence to user instructions ("개발은 하지마"), no source code in `src/` was modified.
- **Assumptions on Future Weaponry**: The proposed "Hydrodynamic Stagger Parry" assumes player projectile hitboxes can interact with off-screen/border-clamped collision boxes during the $300\text{ms}$ telegraph window; if strict canvas boundary clipping is active on bullets, a tiny padding margin ($+20\text{px}$) will need to be permitted for the parry detection window.
- **Alternative Interpretations**: An alternative was to make the Apex Predator an End-Game Crisis Sovereign; however, designing it as an autonomous Solitary Elite / Stalker entity that can spawn either independently in Hadal Trench waves or as a sub-boss during crises creates far superior emergent variety and dread.

## 4. Conclusion
The feature proposal for **Deep Trench Apex Predators (Stealth Camouflage & Ambush Stalkers)** has been fully formulated and saved to `/Users/user/src/water-invader/.agents/swarm_d4_apexpredator_3/report.md`. It provides a comprehensive, mathematically grounded, and aesthetically compelling design featuring:
- 3 Distinct Archetypes (*The Phantom Architeuthis*, *The Hadal Megalodon*, *The Abyssal Viper-Morph*).
- Snell's Law caustic refraction cloaking and perimeter-prowling ambush vectors.
- 3-Stage telegraph sequence with a high-skill $300\text{ms}$ counterplay / stagger parry window.
- Procedural Web Audio API sound architecture (sub-bass hydrophone roar and acoustic vacuum ducking).
- Dynamic border-clamped Sonar Anomaly Reticle with 3 distance warning states.
- Seamless synergy with EMP Disruption, Acid Storm, and End-Game Crises, adhering strictly to existing game constraints (0 code changes, 0 build runs, invariant $720 \times 960$ logical canvas).

## 5. Verification Method
- **File Existence & Integrity Check**:
  - View `/Users/user/src/water-invader/.agents/swarm_d4_apexpredator_3/report.md` and confirm it contains all 6 required sections with exhaustive depth, mathematical formulas, and architectural blueprints.
  - View `/Users/user/src/water-invader/.agents/swarm_d4_apexpredator_3/progress.md` and `BRIEFING.md` to confirm task completion and adherence to append-only constraints.
- **Source Code Verification**:
  - Run `git status` or inspect `git diff --stat` (by parent/evaluator) to verify that zero files in `src/` or any other tracked project directories were modified.
- **Invalidation Condition**:
  - If any source code in `.ts`, `.tsx`, or `.css` is modified, this report is invalidated.
