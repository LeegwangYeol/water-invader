# Milestone 1 Review & Adversarial Challenge Report: Swarm Bot Brain Engine

**Verdict**: **APPROVE**  
**Reviewer Role**: Reviewer 1 (Quality Reviewer & Adversarial Critic)  
**Target Files**: 	ests/stress/swarm_bot_engine.ts, 	ests/stress/swarm_bot_engine.spec.ts  
**Timestamp**: 2026-08-21T20:44:30+09:00

---

## 1. Observation (직접 관찰 및 검증 팩트)

1. **무결성 및 치팅 점검 (Integrity & Anti-Cheat Audit)**:
   - 	ests/stress/swarm_bot_engine.ts 소스 코드 내에 하드코딩된 기대값, 더미(Dummy) 함수, 또는 파사드(Facade)가 전혀 존재하지 않음을 확인.
   - 1D Potential Field Solver, 레이마칭 TTI 계산, 가우스 공간 감쇄, 바리케이드 차폐 계수, 다이버 위험도 예측, 상점 3단계 우선순위 구매 루프가 수학적/알고리즘적으로 100% 온전하게 구현됨.

2. **수학적 모델링 및 계산식 검증 (Math & Danger Calculations)**:
   - **탄환 TTI (Time-To-Impact)**:  = \frac{playerY - bullet.y}{vy}$ (vy > 0 및  \le TTI \le 2.0$ 범위에 대해 유효 위협 판정).
   - **가우스 공간 감쇄 (Gaussian Spatial Decay)**:  = \frac{1500}{TTI + 0.05} \times \exp\left(-\frac{distX^2}{2 \times (40 \times 0.8)^2}\right) \times ShadowMultiplier$.
   - **바리케이드 차폐 (Barricade Shadowing)**:
     - 석재 바리케이드 (Stone, type 1, 무적): 위협도 **0.02x** (98% 차폐 감소).
     - 빙하 바리케이드 (Ice, type 0, 파괴 가능, hp > 0): 위협도 **0.2x** (80% 차폐 감소).
   - **다이버 급강하 위협 (Diver Intercept)**: 수직 거리 500px 이내 접근 시  \times \exp\left(-\frac{diverDistX^2}{2 \times 45^2}\right)$ 페널티 부과.

3. **스킬 트리거 임계값 검증 (E/Q Skill Thresholds)**:
   - **궁극기 (E, Heavy Rain)**: ultimateGauge >= 100 AND (ctiveEnemies.length >= 3 OR hasBoss) 조건 충족 시 game.triggerUltimate() 호출.
   - **지원군 소환 (Q, Ally Support)**: currency >= 50 AND (ctiveEnemies.length >= 6 OR ctiveEnemies.some(e => e.y > 450)) 조건 충족 시 game.triggerSummonAlly() 호출.

4. **상점 경제 자동 구매 우선순위 검증 (Shop Economy Priority)**:
   - Priority 1: upgradeFireRate() (50 💧, fireRate > 0.1s 한계까지)
   - Priority 2: upgradeMultiShot() (100 💧, multiShot < 5 Lv 한계까지)
   - Priority 3: upgradePiercing() (200 💧, piercing < 99 한계까지)
   - 무한 루프 방지 가드: maxIterations = 20 안전장치 적용 확인.

5. **실행 및 컴파일 검증 결과**:
   - 
px tsc --noEmit: TypeScript 컴파일 오류 0건 (성공).
   - 
pm run build: Turbopack 프로덕션 빌드 성공 (Next.js 16.3.1).
   - 
px playwright test tests/stress/swarm_bot_engine.spec.ts: 7개 테스트 케이스 100% 통과 (1.0s).

---

## 2. Logic Chain & Code Tree Structure

### 2.1 Engine Architecture & Data Flow Tree

`
tests/stress/swarm_bot_engine.ts
├── 1. Perception Normalization (extractBotPerception)
│    ├── Input: Live GameManager or Test Snapshot (window.gameManager)
│    ├── Output: SwarmBotPerception Object
│    │    ├── Player Vector (x, y, speed, fireRate, multiShot, piercing, ultimateGauge, stress)
│    │    ├── Bullets Vector (Filter !isPlayerBullet & !isDead & vy > 0)
│    │    ├── Enemies Matrix (Filter !isDead & hp > 0, Diver flag, Boss flag, Y-depth)
│    │    ├── Barricades Vector (Filter !isDead, Stone vs Ice HP status)
│    │    └── Economy State (currency 💧, level, gameState)
│    │
├── 2. Algorithmic Solver (SwarmBotEngine)
│    ├── A. Offensive Alignment & Target Selector
│    │    ├── High Threat Selection: Bottom Breach (Y>500) > Diver (900) > Boss (750) > Sniper (600)
│    │    └── BestTargetX = Clamped(SelectedEnemy.centerX - playerWidth / 2)
│    │
│    ├── B. 1D Potential Field Raymarching (0 ~ 550px, step 5px -> 111 Candidates)
│    │    ├── calculateCandidateDanger(cx)
│    │    │    ├── Bullet Raycast: TTI = (playerY - by) / vy, ImpactX = bx + vx*TTI
│    │    │    ├── Barricade Shadow: Stone (0.02x) / Ice (0.2x) occlusion
│    │    │    ├── Diver Dive Danger: 3000 * Exp(-diverDistX^2 / (2*45^2))
│    │    │    └── Gaussian Bullet Danger: (1500 / (TTI + 0.05)) * Exp(-distX^2 / (2*32^2)) * Shadow
│    │    ├── Offensive Cost = |cx - bestTargetX| * 1.2
│    │    ├── Inertia Cost = |cx - playerX| * 0.3
│    │    ├── Boundary Margin Cost = EdgePenalty * 15.0
│    │    └── Total Cost = Danger * 10.0 + Offensive + Inertia + Margin
│    │
│    ├── C. Movement Command Generator
│    │    └── playerX < BestCandidateX - 6 -> 'RIGHT' | playerX > BestCandidateX + 6 -> 'LEFT' | 'STAY'
│    │
│    ├── D. Strategic Skill Manager
│    │    ├── Ultimate (E): ultimateGauge >= 100 && (enemies >= 3 || hasBoss)
│    │    └── Ally (Q): currency >= 50 && (enemies >= 6 || enemies Y > 450)
│    │
│    └── E. Economy Auto-Buyer (evaluateEconomy)
│         ├── Loop (max 20 iterations):
│         │    ├── Priority 1: currency >= 50 && fireRate > 0.1 -> upgradeFireRate()
│         │    ├── Priority 2: currency >= 100 && multiShot < 5 -> upgradeMultiShot()
│         │    └── Priority 3: currency >= 200 && piercing < 99 -> upgradePiercing()
│         └── Return purchases & totalSpent
│
└── 3. In-Page Runtime Injection Controller (injectSwarmBot)
     ├── Lifecycle: start(), stop(), tick(), isRunning(), setOptions()
     ├── State Guard: Only executes tick when gameManager.state === 1 (PLAYING)
     ├── Telemetry: Ticks, Casts, Summons, Upgrades, avgTickDuration (<1ms overhead)
     └── Safe Callback: onDecision isolated in try/catch block
`

---

## 3. Adversarial Challenge & Stress-Test Analysis (공격적 검증)

| Challenge Target | Stress Scenario / Attack Vector | Blast Radius | Defense / Mitigation in Code | Status |
|---|---|---|---|---|
| **C1. Bullet Division by Zero** | 탄환의 수직 속도  \le 0$ 또는 상향 이동 탄환 수신 시  = \frac{\Delta y}{0} \to \infty$ 또는 음수 | 봇 크래시 또는 비정상적인 NaN Danger score 유발 | if (bulletVy <= 0) continue; 및 if (tti < 0 || tti > 2.0) continue; 필터링으로 완전 차단 | **PASS (안전)** |
| **C2. Economy Infinite Loop** | 모의 객체 또는 실시간 게임에서 통화 차감이 실패하거나 업그레이드 함수가 no-op인 경우 | 틱당 무한 루프 발생으로 브라우저 탭 프리징 | iterations++ < maxIterations (20) 가드 및 prevCurrency 실질 감소 조건 확인 후 루프 재진입 | **PASS (안전)** |
| **C3. Destroyed Barricade Ghost Shadowing** | 파괴된 빙하 바리케이드( \le 0$) 뒤에 숨으려는 오작동 | 투명 바리케이드 뒤에서 미회피 피격 발생 | ar.type === 0 && bar.hp > 0 조건으로 파괴된 빙하 바리케이드는 차폐 목록에서 배제 | **PASS (안전)** |
| **C4. Frame Budget Overhead** | 111개 후보지점 $\times$ 다수 탄환/적군에 대한 16ms 주기 연산 병목 | 프레임 드랍(Jank) 및 봇 조작 랙 유발 | 1회 틱당 순수 연산 시간 평균 **0.05ms ~ 0.2ms** (허용치 5.0ms 대비 1/25 이하) | **PASS (초고속)** |
| **C5. Menu/GameOver State Polling** | 게임 오버 또는 일시정지 상태에서 봇이 불필요한 키 입력 및 연산 수행 | 백그라운드 리소스 낭비 및 오동작 | if (gameManager && gameManager.state === 1) 가드로 PLAYING 상태에서만 틱 실행 | **PASS (안전)** |

---

## 4. Verified Claims Matrix

| Claim from Worker Handoff | Verification Method | Result | Evidence |
|---|---|---|---|
| 1D Potential Field 회피 동작 | swarm_bot_engine.spec.ts:12 | **VERIFIED** | 탄환 X=295 낙하 시 후보 X 좌표가 즉시 275에서 15px 이상 회피 이동 |
| 바리케이드 석재 0.02x, 빙하 0.2x 감쇄 | swarm_bot_engine.spec.ts:72 | **VERIFIED** | Stone: 0.02x (위협도 98% 억제), Ice: 0.2x (위협도 80% 억제) 오차 < 0.1 일치 |
| 다이버 급강하 회피 페널티 | swarm_bot_engine.spec.ts:127 | **VERIFIED** | 다이버 X=305 급강하 시 플레이어 후보 지점이 25px 이상 즉각 회피 |
| 궁극기 (E) 100% 및 적군/보스 조건 | swarm_bot_engine.spec.ts:172 | **VERIFIED** | 게이지 100 + 적 3기 이상 또는 보스 시에만 발동, 1기 일반 적 대상 낭비 방지 |
| 지원군 (Q) 50💧 및 적군/돌파 조건 | swarm_bot_engine.spec.ts:231 | **VERIFIED** | 50💧 + 적 6기 또는 Y > 450 도달 시 정확히 트리거, 49💧 시 미발동 |
| 상점 우선순위 구매 (연사->멀티->관통) | swarm_bot_engine.spec.ts:286 | **VERIFIED** | 350💧 -> 연사 4회(200) + 멀티 1회(100), 잔여 50💧로 관통(200) 보류 정확 동작 |
| 텔레메트리 및 인페이지 수명주기 | swarm_bot_engine.spec.ts:367 | **VERIFIED** | start/stop 시 키 해제, 틱당 0.05ms 미만, 텔레메트리 정상 누적 |

---

## 5. Caveats (제약 사항 및 안내)

1. **상점 연동**: evaluateEconomy는 보유 재화 내에서 틱당 즉시 1순위(연사력)부터 잔여액을 순차 소진하므로, 실시간 게임에서 물을 획득하는 즉시 최고 효율로 무기가 자동 강화됩니다.
2. **후속 마일스톤 연계**: Milestone 2(텔레메트리 수집기) 및 Milestone 3(Playwright 다중 워커 스펙)에서 본 SwarmBotEngine 및 injectSwarmBot을 직접 주입하여 장기 생존 스트레스 테스트를 수행하게 됩니다.

---

## 6. Conclusion (최종 판정)

- **최종 판정**: **APPROVE** (승인)
- **판정 근거**:
  1. 요구사항(R1, R2)에 명시된 모든 생존/전투 휴리스틱, E/Q 스킬 발동, 상점 3단계 우선순위 구매가 누락 없이 완전하게 구현되었습니다.
  2. 치팅이나 하드코딩 등의 무결성 위반 요소가 전혀 없으며 순수 수학적 잠재력장 알고리즘으로 구현되었습니다.
  3. 
px tsc --noEmit, 
pm run build, 
px playwright test tests/stress/swarm_bot_engine.spec.ts 전 과정이 100% 통과되었습니다.
  4. 틱당 연산 오버헤드가 극히 미미(<0.2ms)하여 60FPS 실시간 인페이지 주입 시 게임 렌더링에 일체의 부하를 주지 않습니다.

---

## 7. Verification Method (독립 검증 재현 명령)

`powershell
# 1. TypeScript 타입 무결성 검증
npx tsc --noEmit

# 2. Next.js 빌드 검증
npm run build

# 3. Swarm Bot Engine 유닛 및 시뮬레이션 테스트 실행
npx playwright test tests/stress/swarm_bot_engine.spec.ts --reporter=list
`
