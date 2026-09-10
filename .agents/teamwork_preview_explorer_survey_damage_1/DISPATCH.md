# Task Assignment: Survey Enemy Damage Formulas & Piercing Scaling (R2)

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

## Objective
Inspect `src/game/Enemy.ts`, `src/game/types.ts`, `src/game/GameManager.ts`, and `src/game/Bullet.ts`. Document all enemy damage calculations, collision damage, projectile damage, wave scaling, and design an enemy piercing attack scaling mechanic for common mobs in later waves.

## 2026-09-07T15:45:01Z
You are the Technical Explorer investigating Enemy Damage Formulas & Piercing Scaling for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1
Identity & Assignment: Read /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1/DISPATCH.md
Authoritative specifications:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md

Your Objective:
Investigate requirement R2 (Enemy Piercing Damage Scaling).
Specifically:
1. Inspect `src/game/Enemy.ts`, `src/game/types.ts`, `src/game/GameManager.ts`, and `src/game/Bullet.ts`.
2. Document all existing damage sources: enemy collision damage, enemy projectile damage, boss/elite attacks, saboteur gnaw damage, etc.
3. How does damage interact with player shields, armor, base HP, and barricades?
4. How does difficulty/wave level currently scale enemy stats (HP, speed, fire rate, damage)?
5. Design the piercing attack scaling formula for common mobs as waves increase. How should piercing damage scale with wave number (e.g. penetrating armor/shield or multiplying base damage) to give a tangible sense of late-game threat without causing instant unwinnable deaths?
6. Write a comprehensive technical report and formula specification to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1/handoff.md`.
