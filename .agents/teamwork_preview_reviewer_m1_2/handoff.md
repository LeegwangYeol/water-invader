# Milestone 1: Water Invader Endless Survival Stress Test — Reviewer 2 Independent Review & Adversarial Challenge Report

## Review Summary

**Verdict**: **APPROVE**  
**Integrity Audit**: **PASS (0 violations / genuine implementation)**  
**Target Code**: `tests/stress/swarm_bot_engine.ts`, `tests/stress/swarm_bot_engine.spec.ts`  
**Reviewer Role**: Reviewer 2 (Quality & Adversarial Critic)

---

## 1. Observation (직접 관찰 및 검증 팩트)

1. **봇 엔진 구현 파일 (`tests/stress/swarm_bot_engine.ts`) 정밀 검증**:
   - **Perception 정규화 (`extractBotPerception`, lines 179-286)**:
     - 실시간 `GameManager` 인스턴스 (`game.player.position.x`, `game.bullets`, `game.enemies`, `game.barricades`, `game.currency`) 및 순수 JSON 스냅샷 객체 양방향 정규화 지원.
     - `canvasWidth` (600), `canvasHeight` (800) 기본값 및 비정상/사망 엔티티(`isDead`, `hp <= 0`) 자동 필터링.
   - **1D Potential Field Raymarching Solver (`SwarmBotEngine.computeDecision`, lines 366-521)**:
     - `maxCandidateX = Math.max(0, canvasWidth - playerWidth)`로 계산되어 정확히 `[0, 550]` 범위 탐색.
     - `gridStep` (5px) 간격으로 총 111개의 후보 X 좌표(`cx = 0, 5, 10, ... 550`)를 평가.
     - 외곽 경계벽 반발 페널티(`edgePenalty`): `cx < 30` 또는 `cx > 520` 구간에서 `wallMarginWeight` (15.0) 가중치를 부과하여 벽 끼임 위험 사전 회피.
     - 관성 이동 비용(`moveDistanceCost = |cx - playerX| * 0.3`) 및 데드존(`deadZone = 6px`) 적용으로 불필요한 좌우 진동(Jitter) 원천 차단.
   - **위협도 계산 모델 (`calculateCandidateDanger`, lines 296-361)**:
     - 탄환 충돌 예측 시간: $TTI = \frac{playerY - bullet.y}{vy}$ ($0 \le TTI \le 2.0s$).
     - 가우스 공간 감쇄: $\exp\left(-\frac{\Delta X^2}{2 \cdot (32)^2}\right)$, 시간 긴급도: $\frac{1500}{TTI + 0.05}$.
     - 바리케이드 차폐 계수: 석재(Stone, type 1) 0.02x (98% 차폐), 빙하(Ice, type 0) 0.2x (80% 차폐).
     - 다이버 급강하 경보: $3000 \cdot \exp\left(-\frac{\Delta X_{diver}^2}{2 \cdot 45^2}\right)$ 페널티로 수직 돌진 궤적 즉각 이탈.
   - **경제 및 스킬 자동화 (`evaluateEconomy`, `applyDecision`, lines 529-641)**:
     - 스킬 발동 조건: 궁극기(E) 게이지 100% + (적 3기 이상 or 보스 출현), 지원군(Q) 재화 50💧 + (적 6기 이상 or 적 $Y > 450$).
     - 상점 업그레이드 우선순위: 1순위 연사력 (50💧, 0.1s 한계) $\rightarrow$ 2순위 멀티샷 (100💧, 5발 한계) $\rightarrow$ 3순위 관통력 (200💧).
     - 무한 루프 방지용 `maxIterations = 20` 안전 장치 적용.
   - **인페이지 주입 컨트롤러 (`injectSwarmBot`, lines 649-804)**:
     - `setInterval(..., 16)` 기반 60 FPS 제로 레이턴시 루프.
     - `stop()` 호출 시 `clearInterval` 및 플레이어 키 상태(`isMovingLeft=false`, `isMovingRight=false`, `isShooting=false`) 완벽 초기화.
     - `setOptions()` 동적 갱신 시 기존 타이머 정리 후 재기동하여 메모리 누수 원천 차단.
     - 텔레메트리 메모리 누수 방지: 틱 히스토리 배열을 누적하지 않고 O(1) 공간의 롤링 평균(`averageTickDurationMs`) 사용.

2. **유닛 & 시뮬레이션 테스트 스위트 (`tests/stress/swarm_bot_engine.spec.ts`)**:
   - Test 1 (탄환 회피), Test 2 (바리케이드 차폐 계수), Test 3 (다이버 돌진 경보), Test 4 (궁극기 E 조건), Test 5 (지원군 Q 조건), Test 6 (상점 경제 순차 구매), Test 7 (인페이지 주입 생명주기 및 텔레메트리) 총 7개 테스트 케이스 구현.

3. **빌드 및 테스트 자동 실행 결과**:
   - `npx tsc --noEmit` $\rightarrow$ **오류 0건 (성공, Code 0)**
   - `npx playwright test tests/stress/swarm_bot_engine.spec.ts --reporter=list` $\rightarrow$ **7 passed (701ms, Code 0)**
   - `npm run build` (Turbopack) $\rightarrow$ **100% 프로덕션 빌드 성공 (Code 0)**

---

## 2. Logic Chain & Code Tree Structure

```
tests/stress/swarm_bot_engine.ts (Milestone 1 Core Brain)
├── 1. Perception Layer (extractBotPerception)
│    ├── Canvas Dimension Normalizer (Default 600x800)
│    ├── Player Entity Vector (X, Y, Size, HP, FireRate, MultiShot, Piercing, UltGauge)
│    ├── Enemy Bullets Vector (Filter !isPlayerBullet & !isDead)
│    ├── Active Enemies Matrix (Filter !isDead & hp > 0, Diver/Boss/Sniper types)
│    ├── Barricades Geometry (Stone Type 1 vs Ice Type 0 with HP > 0)
│    └── Economy & Wave State (Pure Water Currency, Level, State)
│
├── 2. Tactical & 1D Potential Field Solver (SwarmBotEngine)
│    ├── A. Offensive Column Prioritization
│    │    └── Threat = Breach(Y>500: +1500) + Diver(+900) + Boss(+750) + Sniper(+600) + Y*0.8 - dX*0.4
│    ├── B. 1D Raymarching Spatial Grid (cx: 0 -> 550, step: 5)
│    │    ├── Danger Term: TTI Urgency (1500/(TTI+0.05)) * Gauss(dX) * BarricadeOcclusion(0.02 / 0.2)
│    │    ├── Diver Crash Term: 3000 * Gauss(dX_diver)
│    │    ├── Offensive Term: |cx - bestTargetX| * 1.2
│    │    ├── Inertia Damping Term: |cx - playerX| * 0.3
│    │    └── Margin Penalty Term: cx < 30 or cx > 520 -> (margin - cx) * 15.0
│    ├── C. Motor Command Dispatcher
│    │    └── playerX < bestCandidateX - 6 -> 'RIGHT' | playerX > bestCandidateX + 6 -> 'LEFT' | 'STAY'
│    ├── D. Strategic Skill Manager
│    │    ├── Ultimate (E): ultimateGauge >= 100 && (enemies >= 3 || hasBoss) -> triggerUltimate()
│    │    └── Ally (Q): currency >= 50 && (enemies >= 6 || enemies Y > 450) -> triggerSummonAlly()
│    └── E. In-Game Economy Auto-Buyer
│         ├── Priority 1: upgradeFireRate() (50 💧, fireRate > 0.1)
│         ├── Priority 2: upgradeMultiShot() (100 💧, multiShot < 5)
│         └── Priority 3: upgradePiercing() (200 💧, piercing < 99)
│
└── 3. In-Page Runtime Injection Controller (injectSwarmBot)
     ├── Interval Lifecycle: start(), stop() with full clearInterval and key-release
     ├── Option Mutator: setOptions() with safe timer recreation
     ├── O(1) Space Telemetry: ticks, decisions, skills, upgrades, rolling avg duration (<1ms)
     └── Safe Callback Dispatch: Error-trapped onDecision observer
```

### Logic Chain Step-by-Step Reasoning:
1. **[Obs 1] 후보 X 좌표 범위 및 경계 반발**: `maxCandidateX = 600 - 50 = 550`으로 계산되어 0~550 범위 내에서만 탐색하므로 플레이어 히트박스가 캔버스 화면 밖으로 벗어나는 오류가 불가능합니다.
2. **[Obs 2] 데드존 및 관성 제어**: `deadZone = 6px`와 `inertiaWeight = 0.3`의 이중 감쇄를 적용하여 16ms 주기에서 4.8px씩 이동하는 플레이어가 목표 위치 근처에서 좌우로 요동치는 지터 현상을 방지합니다.
3. **[Obs 3] 메모리 누수 방지**: `injectSwarmBot`은 무한 증가하는 배열 대신 롤링 평균 및 누적 카운터를 사용하여 장시간 엔듀런스 스트레스 테스트 중에도 브라우저 JS Heap 메모리 누수가 발생하지 않도록 설계되었습니다.
4. **[Obs 4] 엔진 API 정합성**: `GameManager.ts`의 `triggerUltimate`, `triggerSummonAlly`, `upgradeFireRate`, `upgradeMultiShot`, `upgradePiercing` 및 `player` 프로퍼티와 완벽히 일치합니다.

---

## 3. Caveats (제약 사항 및 가정)

1. **상점 동시 다중 구매**:
   - `evaluateEconomy`는 1회 틱 호출 시 보유 재화 한도 내에서 1순위(연사력)부터 잔여 재화를 차례로 소진하여 다중 업그레이드를 일괄 처리합니다 (`maxIterations = 20`).
2. **브라우저 타이머 오차**:
   - 헤드리스 브라우저 환경에서 `setInterval(..., 16)`의 실제 발화 주기는 15~18ms로 미세하게 변동될 수 있으며, 봇 내부 텔레메트리는 `performance.now()` 델타 시간을 측정하여 실제 실행 시간을 정확히 모니터링합니다.

---

## 4. Conclusion (최종 판정)

- **최종 판정 (Verdict)**: **APPROVE**
- **무결성 검증 (Integrity Mode)**: 치팅, 하드코딩된 더미 로직, 모의 테스트 우회 없음 (100% 정상 구현 확인).
- **요구사항 충족도**: Milestone 1의 탄막 회피, E/Q 스킬 발동, 상점 업그레이드 우선순위, 제로 레이턴시 인페이지 주입 및 텔레메트리가 완벽하게 구현되었습니다. 다음 마일스톤(M2 텔레메트리 수집기 및 M3 분산 테스트 하네스)으로 진행을 강력히 추천합니다.

---

## 5. Verification Method (독립 검증 방법)

1. **TypeScript 정적 타입 검사**:
   ```powershell
   npx tsc --noEmit
   ```
2. **Milestone 1 전용 유닛/시뮬레이션 테스트 실행**:
   ```powershell
   npx playwright test tests/stress/swarm_bot_engine.spec.ts --reporter=list
   ```
3. **Next.js 전체 프로덕션 빌드 검증**:
   ```powershell
   npm run build
   ```
