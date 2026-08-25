# Milestone 1: Enemy Physics & Movement Fixes Handoff Report

## 1. Observation
1. **E-01 (Splitter Mini2 Wall Bounce)**:
   - `Enemy.ts:138`: 기존 벽 반사 조건문 `if (this.position.x <= 0 && this.direction < 0)` 은 `speedX` 가 음수인 경우(`-10`), `direction`이 1일 때 좌측으로 이동함에도 불구하고 `direction < 0` 조건이 거짓이 되어 방향이 반전되지 않고 x=0에 끼이는 현상이 발생함.
2. **E-02 (Diver Enemy Missing in spawnWave)**:
   - `GameManager.ts:215`: 일반 웨이브 특수 적 후보 배열이 `[EnemyType.SNIPER, EnemyType.SHIELDED, EnemyType.SPLITTER]` 로만 작성되어 있어 `EnemyType.DIVER` (Type 4)가 일반 웨이브에서 전혀 생성되지 않음.
3. **E-04 (Zigzag Enemy Vertical Descent)**:
   - `Enemy.ts:101`: `if (this.type !== EnemyType.ZIGZAG) { this.position.y += currentSpeedY * deltaTime; }` 로 지그재그 적의 Y축 하강이 완전히 차단되어 상단에 고정된 채 좌우 진동만 수행함.
4. **E-05 (Diver Dive Speed)**:
   - `Enemy.ts:97`: `this.position.y += currentSpeedY * 6 * deltaTime;` 로 48 px/s 에 불과하여 급강하 폭격기로서의 위협이 부족함.
5. **E-06 (Wave Grid Scaling Bounds)**:
   - `GameManager.ts:199-203`: cols와 rows에 상한이 없어 고레벨 웨이브 시 `offsetX`가 음수가 되어 적이 캔버스 바깥에 스폰되거나 바리케이드와 겹침.
6. **E-07 & G-03 (Stone Barricade Collision & Gnawing Throttle)**:
   - `GameManager.ts:559-579`: 파괴 불가능한 돌 바리케이드 충돌 시 적의 Y축 이동을 차단하는 로직이 없어 관통하며, 얼음 바리케이드를 갉아먹을 때 속도 감속이 없음.
7. **E-08 (Player Ramming Boss Exploit)**:
   - `GameManager.ts:329-330`: 플레이어와 적 충돌 시 무조건 `enemy.isDead = true` 를 호출하여 플레이어 HP 1 소모로 50~150 HP 보스가 즉사함.

## 2. Logic Chain
```
[Milestone 1 Implementation & Logic Tree]
├── 1. Enemy.ts (Physics & Movement Engine)
│   ├── [E-01 Wall Bounce Fix]
│   │   ├── Calculate: movingDir = (speedX >= 0 ? direction : -direction)
│   │   ├── At Left Wall (x <= 0 && movingDir < 0): direction = (speedX >= 0 ? 1 : -1)
│   │   └── At Right Wall (x + w >= canvasWidth && movingDir > 0): direction = (speedX >= 0 ? -1 : 1)
│   │       └── Smooth reflection guaranteed for both positive & negative speedX!
│   ├── [E-04 Zigzag Y Descent]
│   │   └── position.y += currentSpeedY * deltaTime (Removes conditional check)
│   ├── [E-05 Diver Dive Speed]
│   │   └── diveSpeed = Math.max(280, currentSpeedY * 35) (Menacing & dynamic speed)
│   └── [G-03 Barricade Gnawing Throttle]
│       └── gnawMultiplier = this.isGnawing ? 0.2 : 1.0 (Applied to currentSpeedX / Y)
│
└── 2. GameManager.ts (Game Loop & Collision Resolver)
    ├── [E-02 Diver in Normal Waves]
    │   └── specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER]
    ├── [E-06 Wave Grid Scaling Bounds]
    │   ├── rows = Math.min(5, 3 + Math.floor(level / 4))
    │   ├── cols = Math.min(8, 6 + Math.floor(level / 3))
    │   └── offsetX = Math.max(20, (logicalWidth - (cols - 1) * paddingX) / 2)
    ├── [E-07 Stone Barricade Rigid Halt]
    │   └── if (barricade.type === INDESTRUCTIBLE): enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height)
    └── [E-08 Boss Collision Damage Protection]
        ├── if (enemy.type === EnemyType.BOSS):
        │   ├── enemy.hp -= 10; soundManager.playEnemyHit(); hitFlashTimer = 0.08
        │   └── if (enemy.hp <= 0): isDead = true, explosion, victory sound
        └── else: enemy.isDead = true, explosion
```

## 3. Caveats
- No caveats. Milestone 1의 모든 7개 결함(E-01, E-02, E-04, E-05, E-06, E-07, E-08, G-03)이 완벽하게 해결되었으며 기존 회귀 테스트 및 종합 검증 테스트 29종이 모두 통과되었습니다.

## 4. Conclusion
- `src/game/Enemy.ts` 및 `src/game/GameManager.ts` 의 적 이동/물리/스폰/충돌 로직이 정확히 개선되었습니다.
- 분열체 미니 적의 벽 반사, 다이버의 일반 웨이브 등장 및 고속 급강하, 지그재그 적의 수직 하강, 웨이브 그리드 경계 제한, 돌 바리케이드 관통 방지 및 갉아먹기 속도 감속, 보스 몸통 박치기 즉사 방지가 모두 정상 작동합니다.

## 5. Verification Method
1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   - Result: 0 errors
2. **Playwright Test Suite**:
   ```bash
   npx playwright test tests/03_game_mechanics.spec.ts tests/04_multiwave_progression.spec.ts tests/stress/qa_harvest_verification.spec.ts tests/m1_verification.spec.ts tests/adversarial_m1_challenger.spec.ts --project=chromium
   ```
   - Result: 29 passed (39.9s)
3. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   - Result: Compiled successfully in 5.0s, Static page generation 5/5 complete.
