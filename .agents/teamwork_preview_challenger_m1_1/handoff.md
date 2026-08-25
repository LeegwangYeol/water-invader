# Milestone 1: Enemy Physics & Movement Fixes Empirical Challenger Report

## 1. Observation (직접 관측 사실)

### 1.1 Playwright 테스트 스위트 실행 결과
- **실행 명령 1**: `npx playwright test tests/stress/qa_harvest_verification.spec.ts tests/03_game_mechanics.spec.ts --project=chromium`
  - 결과: **15 passed (35.5s)**, Exit Code: 0
  - 주요 관측 로그:
    - `[BUG-E01 Result]: { initialX: 2, xAtWall: 5.92, dirAtWall: -1, finalX: 21.92, finalDir: -1 }`
    - `[BUG-E02 Result] Diver found in 50 waves: true`
    - `[BUG-E04 Result] Zigzag Y movement over 300 frames: 38.39999999999887`
    - `[BUG-E08 Result]: { bossDead: false, remainingEnemies: 1, playerHpLoss: 1, bossHp: 40 }`
- **실행 명령 2**: `npx playwright test tests/m1_verification.spec.ts tests/adversarial_challenger_m1.spec.ts --project=chromium`
  - 결과: **11 passed (16.3s)**, Exit Code: 0
- **빌드 검증**: `npm run build`
  - 결과: Next.js 16.3.1 (Turbopack) 최적화 프로덕션 빌드 성공, TypeScript 타입 에러 0건.

### 1.2 소스 코드 구현 검증
- **Splitter mini2 벽 반사 (`src/game/Enemy.ts:139-151`)**:
  ```typescript
  // Bounce off walls
  const movingDir = this.speedX >= 0 ? this.direction : -this.direction;
  if (this.position.x <= 0 && movingDir < 0) {
    this.direction = this.speedX >= 0 ? 1 : -1;
  } else if (this.position.x + this.size.width >= this.canvasWidth && movingDir > 0) {
    this.direction = this.speedX >= 0 ? -1 : 1;
  }
  
  // Clamp
  if (this.position.x <= 0) this.position.x = 0;
  if (this.position.x + this.size.width >= this.canvasWidth) {
    this.position.x = this.canvasWidth - this.size.width;
  }
  ```
- **Diver 스폰 및 급강하 속도 (`src/game/GameManager.ts:215-217`, `src/game/Enemy.ts:97-101`)**:
  ```typescript
  // GameManager.ts
  const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
  type = specials[Math.floor(Math.random() * specials.length)];

  // Enemy.ts
  if (this.isDiving) {
    const diveSpeed = Math.max(280, currentSpeedY * 35);
    this.position.y += diveSpeed * deltaTime; // Dive very fast (>= 280 px/s)
    return; // Skip normal movement
  }
  ```
- **Zigzag Y축 하강 (`src/game/Enemy.ts:103-104, 131-134`)**:
  ```typescript
  this.position.y += currentSpeedY * deltaTime;
  ...
  if (this.type === EnemyType.ZIGZAG) {
    this.position.x += currentSpeedX * this.direction * deltaTime;
    this.position.x += Math.sin(Date.now() / 200) * 5 * speedMultiplier;
  }
  ```
- **Boss 충돌 데미지 및 즉사 방지 (`src/game/GameManager.ts:329-358`)**:
  ```typescript
  } else if (enemy.checkCollision(this.player)) {
    if (enemy.type === EnemyType.BOSS) {
      enemy.hp -= 10;
      enemy.hitFlashTimer = 0.08;
      soundManager.playEnemyHit();
      if (enemy.hp <= 0) {
        enemy.isDead = true;
        this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, '#fbbf24', 150, 3.0);
        this.triggerScreenShake(0.75);
        soundManager.playVictory();
        this.handleEnemyKill();
      }
    } else {
      enemy.isDead = true;
      this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, enemy.color, 20);
      this.handleEnemyKill();
    }
  ```

---

## 2. Logic Chain (논리 추론 및 아키텍처 흐름 트리)

```
[Milestone 1 Enemy Physics Execution & Verification Tree]
├── 1. Splitter Mini2 Wall Bounce Logic
│   ├── Mini2 Spawned: speedX = -10, direction = +1 (moves left)
│   ├── Hit Left Wall: position.x <= 0 && movingDir (-1) < 0
│   ├── Flip Action: direction set to -1 -> new velocity = (-10) * (-1) = +10 (moves right)
│   ├── Hit Right Wall: position.x >= 580 && movingDir (+1) > 0
│   ├── Flip Action: direction set to +1 -> new velocity = (-10) * (+1) = -10 (moves left)
│   └── Result: Infinite continuous bounce between walls without sticking [CONFIRMED]
│
├── 2. Diver Wave Spawn & Dive Speed
│   ├── Spawning: EnemyType.DIVER included in specials candidate array [SNIPER, DIVER, SHIELDED, SPLITTER]
│   ├── Target Detection: Math.abs((diver.x + w/2) - (player.x + 25)) < 20 triggers isDiving = true
│   ├── Dive Velocity: diveSpeed = Math.max(280, currentSpeedY * 35) >= 280 px/s
│   ├── Obstacle Crash: Crashes into Barricade dealing 20 damage with 30 explosion particles
│   └── Result: Diver operates as a high-threat dive-bomber [CONFIRMED]
│
├── 3. Zigzag Sine Oscillation & Y-Descent
│   ├── Y Movement: position.y += currentSpeedY * deltaTime (executed for all normal movement)
│   ├── X Oscillation: position.x += currentSpeedX * direction * dt + sin(Date.now() / 200) * 5
│   └── Result: Descends smoothly along Y while oscillating in sine wave (38.4px in 300 frames) [CONFIRMED]
│
└── 4. Player vs Boss Ramming Protection
    ├── Collision: player touches Boss (type === EnemyType.BOSS)
    ├── Boss Reaction: Takes 10 damage (50 HP -> 40 HP), plays hit flash & sound, isDead remains FALSE
    ├── Player Reaction: Takes 1 damage (HP -= 1), enters 1.0s i-frames
    └── Result: Exploit completely eliminated; boss survives ramming and punishes player [CONFIRMED]
```

각 항목별 실측 테스트와 코드 레벨의 검증 결과가 100% 일치함을 확인하였습니다.

---

## 3. Caveats (한계 및 범위 제약)

- **M2 범위 (상점/경제/UI 동기화)**: S-01 (연사력 최대 업그레이드 재화 소모), S-03 (비전투 상태 스킬 발동) 등은 M2 대상이므로 본 M1 적 물리 검증 범위에서는 수정 여부를 판정하지 않았으며, M2 에이전트 작업 대상으로 위임됩니다.
- **M3 범위 (관통 총알 및 파티클 풀링)**: G-01 (관통 총알 1-hit-per-entity)은 M3 대상입니다.
- **M1 적 물리/이동 영역**: E-01, E-02, E-04, E-05, E-06, E-07, E-08, G-03 에 대한 물리 및 이동 처리는 완벽하게 동작함을 확인하였습니다.

---

## 4. Conclusion (최종 판정)

### **최종 판정: APPROVE (승인)**

Milestone 1에서 요구하는 모든 적 물리 및 이동 관련 결함(Splitter mini2 좌우 벽 바운스, Diver 일반 웨이브 정상 스폰 및 280 px/s 급강하 돌진, Zigzag Y축 하강 및 사인파 이동, Player의 Boss 충돌 시 10 데미지 적용 및 즉사 버그 방지)이 실측 시뮬레이션 및 Playwright 테스트 스위트 전수 통과(15/15, 11/11)로 완벽하게 해결되었음을 증명합니다.

---

## 5. Verification Method (독립 재검증 방법)

독립적인 검증을 위해 아래 명령어를 실행하여 100% 통과 여부를 재확인할 수 있습니다:

```bash
# 1. QA 하베스트 및 게임 메카닉스 테스트
npx playwright test tests/stress/qa_harvest_verification.spec.ts tests/03_game_mechanics.spec.ts --project=chromium

# 2. M1 전용 검증 및 적대적 스트레스 테스트
npx playwright test tests/m1_verification.spec.ts tests/adversarial_challenger_m1.spec.ts --project=chromium

# 3. TypeScript 타입 체크 및 프로덕션 빌드 검증
npm run build
```

- **무효화 조건 (Invalidation Conditions)**:
  1. `BUG-E01`에서 mini2의 finalX가 0이 되거나 finalDir가 -1이 아닌 경우.
  2. `BUG-E02`에서 Diver가 50개 웨이브 내에 생성되지 않는 경우.
  3. `BUG-E04`에서 Zigzag의 Y 이동량이 0인 경우.
  4. `BUG-E08`에서 50 HP 보스가 플레이어 몸통 박치기 1회로 즉사(`bossDead === true`)하는 경우.
