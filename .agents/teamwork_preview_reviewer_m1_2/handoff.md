# Milestone 1: Enemy Physics & Movement Fixes — Independent Review & Adversarial Challenge Report

- **Reviewer Agent**: `teamwork_preview_reviewer_m1_2`
- **Role**: Reviewer & Adversarial Critic
- **Target Files**: `src/game/Enemy.ts`, `src/game/GameManager.ts`
- **Verdict**: **APPROVE** (승인)

---

## 1. Observation (직접 관측 및 실측 데이터)

1. **E-01 (분열체 미니 적 벽 반사 및 끼임 수정)**:
   - `src/game/Enemy.ts:140-145`:
     ```typescript
     const movingDir = this.speedX >= 0 ? this.direction : -this.direction;
     if (this.position.x <= 0 && movingDir < 0) {
       this.direction = this.speedX >= 0 ? 1 : -1;
     } else if (this.position.x + this.size.width >= this.canvasWidth && movingDir > 0) {
       this.direction = this.speedX >= 0 ? -1 : 1;
     }
     ```
   - 관측: `speedX`가 음수(-10)인 미니 분열체 적(`mini2`)의 실제 진행 방향(`movingDir`)을 정확히 산출하여 좌측 벽(`x <= 0`) 도달 시 `direction`을 `-1`로 전환, 결과적으로 `speedX * direction = (-10) * (-1) = +10`이 되어 우측으로 정상 반사됨.
   - 실측 결과 (`tests/stress/qa_harvest_verification.spec.ts:10`): 150프레임 후 `finalX: 21.92`, `finalDir: -1`로 벽 고착 없이 완벽 탈출 확인.

2. **E-02 (다이버 적 일반 웨이브 스폰 복구)**:
   - `src/game/GameManager.ts:215`:
     ```typescript
     const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
     ```
   - 관측: `EnemyType.DIVER`가 특수 적 배열에 포함되어 일반 웨이브에서 25% 확률로 정상 생성됨.
   - 실측 결과 (`tests/stress/qa_harvest_verification.spec.ts:49`): 50개 웨이브 시뮬레이션 결과 `Diver found in 50 waves: true` 확인.

3. **E-04 (지그재그 적 Y축 수직 하강 정상화)**:
   - `src/game/Enemy.ts:103`:
     ```typescript
     this.position.y += currentSpeedY * deltaTime;
     ```
   - 관측: 기존 `if (this.type !== EnemyType.ZIGZAG)` 예외 차단 조건이 제거되어 지그재그 적이 수평 진동과 함께 Y축으로 하강함.
   - 실측 결과 (`tests/stress/qa_harvest_verification.spec.ts:70`): 300프레임 동안 Y축 이동량 `38.4px` 실측 이동 확인.

4. **E-05 (다이버 급강하 속도 상향)**:
   - `src/game/Enemy.ts:98-99`:
     ```typescript
     const diveSpeed = Math.max(280, currentSpeedY * 35);
     this.position.y += diveSpeed * deltaTime;
     ```
   - 관측: 급강하 속도가 기존 48 px/s에서 최소 280 px/s(후반 웨이브 504 px/s)로 증가하여 급강하 위협 구현.

5. **E-06 (웨이브 그리드 확장 범위 상한 제한)**:
   - `src/game/GameManager.ts:199-203`:
     ```typescript
     const rows = Math.min(5, 3 + Math.floor(this.level / 4));
     const cols = Math.min(8, 6 + Math.floor(this.level / 3));
     const paddingX = 60;
     const paddingY = 50;
     const offsetX = Math.max(20, (this.logicalWidth - ((cols - 1) * paddingX)) / 2);
     ```
   - 관측: 웨이브 50 이상에서도 열(cols) 최대 8, 행(rows) 최대 5, 좌측 여백(`offsetX`) 최소 20px로 제한되어 캔버스 이탈 및 바리케이드 중첩 스폰 방지.

6. **E-07 & G-03 (돌 바리케이드 관통 차단 및 갉아먹기 감속)**:
   - `src/game/Enemy.ts:85-87`: `gnawMultiplier = this.isGnawing ? 0.2 : 1.0;`
   - `src/game/GameManager.ts:594-596`:
     ```typescript
     // Indestructible stone barricade: block vertical penetration
     enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height);
     ```
   - 관측: 돌 바리케이드 충돌 시 적의 Y 좌표가 바리케이드 상단으로 강제 클램핑되어 관통이 원천 차단되고, 바리케이드 갉아먹기 중 이동 속도가 0.2배로 감속됨.

7. **E-08 (플레이어 보스 몸통 박치기 즉사 익스플로잇 방지)**:
   - `src/game/GameManager.ts:330-346`:
     ```typescript
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
   - 관측: 보스와 플레이어 충돌 시 보스가 즉사하지 않고 10 HP 피해만 입으며, HP 소진 시에만 정상 격파 및 클리어 시퀀스가 발동함.

---

## 2. Logic Chain (논리 추론 및 아키텍처 트리)

```
[Milestone 1 Code Architecture & Logic Flow Tree]
├── 1. Enemy Physics Engine (src/game/Enemy.ts)
│   ├── Vector Speed Calculation
│   │   ├── gnawMultiplier = isGnawing ? 0.2 : 1.0
│   │   ├── currentSpeedX = speedX * speedMultiplier * gnawMultiplier
│   │   └── currentSpeedY = speedY * speedMultiplier * gnawMultiplier
│   ├── Diver Dive Bomber Mechanics
│   │   ├── Detection: Math.abs(enemy.centerX - player.centerX) < 20px
│   │   ├── Dive Trigger: isDiving = true
│   │   └── Dive Movement: diveSpeed = Math.max(280, currentSpeedY * 35) (280~504 px/s)
│   ├── Universal Vertical Descent
│   │   └── position.y += currentSpeedY * deltaTime (All enemies descend steadily)
│   └── Vector-Aware Wall Bouncing & Clamping
│       ├── movingDir = (speedX >= 0 ? direction : -direction)
│       ├── Left Wall (x <= 0 && movingDir < 0) -> direction = (speedX >= 0 ? 1 : -1)
│       ├── Right Wall (x + w >= canvasWidth && movingDir > 0) -> direction = (speedX >= 0 ? -1 : 1)
│       └── Hard Clamping: 0 <= position.x <= canvasWidth - width
│
└── 2. Game Collision & Wave Engine (src/game/GameManager.ts)
    ├── Bounded Wave Spawning
    │   ├── Max Bounds: rows <= 5, cols <= 8, offsetX >= 20px
    │   ├── Vertical Span: Y=80 to Y=280 (Safe clearance above Barricades at Y=460)
    │   └── Special Enemy Pool: [SNIPER, DIVER, SHIELDED, SPLITTER] (Uniform 25% distribution)
    ├── Barricade Interaction & Obstacle Resolution
    │   ├── Diver Collision -> Crash & Explode (enemy.isDead = true, 20 damage or stone spark)
    │   ├── Destructible Barricade -> Gnaw damage (0.1 HP/frame) + Slowdown (0.2x speed)
    │   └── Indestructible Stone Barricade -> Rigid Y-Halt (position.y = barricade.y - enemy.height)
    └── Ramming Damage Resolution
        ├── Normal Enemy -> Instant kill, explosion, player takes 1 damage (1.0s i-frame)
        └── Boss Enemy -> Boss takes 10 damage, player takes 1 damage (1.0s i-frame), no exploit instakill
```

### 무결성 검증 (Integrity & Adversarial Audit)
1. **하드코딩 / 페이크 구현 점검**: 테스트 결과를 우회하기 위한 하드코딩이나 더미 구현 없음. 순수 물리/좌표 수학 및 명확한 상태 기반 로직으로 구현됨.
2. **타입 안전성 점검**: TypeScript 타입 불일치 및 `any` 캐스팅 없음. `npx tsc --noEmit` 무결성 통과 (0 errors).
3. **회귀 영향 점검**: 기존 핵심 메커니즘(UI, 총알 발사, 콤보, 스킬, 웨이브 진행) 16종 전 항목 정상 통과 확인.

---

## 3. Caveats (주의 사항 및 경계 조건)

- **M2/M3 잔여 영역 분리**:
  - 상점 재화 무한 소모(S-01), 리액트 UI 상태 동기화(S-02), 비전투 Q/E 스킬 입력 차단(S-03)은 M2 작업 범위에 속하며 M1 작업에 의해 악영향을 받지 않음.
  - 관통탄 다중 틱 고갈(G-01), 파티클 풀링(G-04)은 M3 작업 범위로 정상 격리되어 있음.
- 기타 미조사 영역 없음.

---

## 4. Conclusion (최종 평가 및 승인)

- **Verdict: APPROVE (승인)**
- 사유:
  1. M1의 모든 요구사항(E-01, E-02, E-04, E-05, E-06, E-07, E-08, G-03)이 정확하고 견고하게 구현되었습니다.
  2. 분열체 미니 적 벽 고착 현상이 완전히 해소되었습니다.
  3. 다이버가 일반 웨이브에 정상 스폰되며 고속 급강하를 수행합니다.
  4. 지그재그 적의 수직 하강이 정상 작동합니다.
  5. 고레벨 웨이브 시 화면 밖 스폰 및 바리케이드 겹침이 방지되었습니다.
  6. 돌 바리케이드 통과가 차단되고 얼음 바리케이드 갉아먹기 감속이 적용되었습니다.
  7. 보스 몸통 박치기 0-Dmg 즉사 버그가 해결되어 정상적인 보스 전투 밸런스가 유지됩니다.

---

## 5. Verification Method (독립 재검증 절차)

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   - 결과: 0 errors

2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   - 결과: Compiled successfully in 3.8s, 5/5 static pages generated.

3. **Core Playwright Regression Test Suite**:
   ```bash
   npx playwright test tests/01_ui_and_controls.spec.ts tests/03_game_mechanics.spec.ts tests/04_multiwave_progression.spec.ts --project=chromium
   ```
   - 결과: 16 passed (31.0s)

4. **M1 Specific & Adversarial Test Suites**:
   ```bash
   npx playwright test tests/m1_verification.spec.ts tests/adversarial_m1_challenger.spec.ts tests/adversarial_challenger_m1.spec.ts tests/adversarial_challenger_m1_2.spec.ts tests/stress/qa_harvest_verification.spec.ts --project=chromium
   ```
   - 결과: 24 passed (33.6s)
