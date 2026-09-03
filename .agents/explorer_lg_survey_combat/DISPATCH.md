## 2026-09-03T10:11:42Z
<USER_REQUEST>
You are an Explorer subagent for the Next.js "Water Invader" project.
Your working directory: /Users/user/src/water-invader/.agents/explorer_lg_survey_combat
Workspace root: /Users/user/src/water-invader
Authoritative Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md

Mission:
Investigate the Combat, Projectile, Bullet Physics, and Entity systems to formulate a complete technical design for Homing Missile mechanics:
"R1. Homing Missile Weapon Upgrade (유도탄):
- When equipped/fired, projectiles seek the closest enemy and deal significant damage.
- Designed to help players clear enemies spawning close to them after Wave 10."

Tasks:
1. Examine src/game/Bullet.ts, src/game/Entity.ts, src/game/GameManager.ts, src/game/Player.ts, and collision detection / CCD logic.
2. Analyze current projectile mechanics: types, velocities, lifetimes, swept-box CCD (DEFECT-C1), pierce mechanics (DEFECT-A1), trail/exhaust rendering, and damage application.
3. Design the homing steering physics:
   - Target acquisition algorithm (find nearest enemy within range/angle, Euclidean distance vs priority weighting).
   - Steering mechanics (angular velocity clamp / turn rate radians/sec, acceleration, max speed, smoke trail particles).
   - Retargeting if target dies mid-flight.
   - Damage scaling, impact radius/splash vs single-target burst, and visual rendering (missile body, propulsion flare/trail).
4. Analyze how close-spawning enemies after Wave 10 interact with homing missiles (instant target lock, minimum turning radius considerations so it can hit close enemies effectively).
5. Identify edge cases: empty target list, targets moving off-screen, performance impact with large swarms, canvas boundary behavior.
6. Document all affected files, interface changes, and test strategies.
7. Write your comprehensive report to /Users/user/src/water-invader/.agents/explorer_lg_survey_combat/handoff.md and report back.

Hard Constraints:
- Read-only exploration! DO NOT edit source code or run builds.
- Put your full report in your working directory at handoff.md.
</USER_REQUEST>
