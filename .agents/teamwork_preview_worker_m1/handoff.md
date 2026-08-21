# Milestone 1: Water Invader Deep Survival & Combat Bot Brain Engine Handoff Report

## 1. Observation (직접 관찰 및 구현 팩트)

1. **봇 엔진 구현 파일 (	ests/stress/swarm_bot_engine.ts)**:
   - extractBotPerception(game): 브라우저 실시간 GameManager 인스턴스 또는 스냅샷 객체에서 플레이어, 탄환, 적, 바리케이드, 재화 상태를 추출하여 정규화.
   - SwarmBotEngine.calculateCandidateDanger(...):
     - 적 탄환 Time-To-Impact (TTI): 	ti = (playerY - bullet.y) / vy 계산.
     - 가우스 공간 감쇄: exp(-(distX^2) / (2 * (dangerRadius * 0.8)^2)).
     - 시간 긴급도: 1500 / (tti + 0.05).
     - 바리케이드 차폐 (Barricade Shadowing):
       - 무적 석재 바리케이드 (Stone, type 1) 차폐 시 위협도 **0.02x** (98% 차폐)
       - 파괴 가능 빙하 바리케이드 (Ice, type 0) 차폐 시 위협도 **0.2x** (80% 차폐)
     - 다이버 (Diver, type 4 / isDiving) 수직 돌진 위협: 3000 * exp(-(diverDistX^2) / (2 * 45^2)) 페널티 부과.
   - SwarmBotEngine.computeDecision(...):
     - 0부터 550까지 5px 간격(110개 후보 지점)의 1차원 잠재력장(Potential Field) 비용 최소화 탐색.
     - 최적 목표 선정 (Y > 500 돌파 위험군, 다이버, 보스 타이탄, 스나이퍼 우선 타겟팅).
     - 공격 정렬 비용(offensiveCost = |cx - targetX| * 1.2), 이동 관성 비용(moveDistanceCost = |cx - playerX| * 0.3), 경계벽 회피 비용 계산.
     - 데드존(6px) 기반 좌/우/정지(LEFT / RIGHT / STAY) 커맨드 결정.
   - SwarmBotEngine.evaluateEconomy(game, options):
     - 실시간 게임플레이 중 재화 자동 소비:
       * Priority 1: upgradeFireRate() (50 💧, 연사 0.1s 한계까지)
       * Priority 2: upgradeMultiShot() (100 💧, 5-Spread Lv 5 한계까지)
       * Priority 3: upgradePiercing() (200 💧)
   - SwarmBotEngine.applyDecision(game, decision, options):
     - player.isShooting = true 상시 사격 유지.
     - 궁극기: player.ultimateGauge >= 100 및 (적 수 >= 3 또는 보스 출현 시) game.triggerUltimate() 즉각 발동.
     - 지원군 소환: currency >= 50 및 (적 수 >= 6 또는 적 Y > 450 도달 시) game.triggerSummonAlly() 즉각 발동.
   - injectSwarmBot(gameManager, options):
     - 브라우저 인페이지 제로 레이턴시 주입 컨트롤러 (start, stop, 	ick, getTelemetry, isRunning, setOptions, esetTelemetry).
     - 16ms(~60 FPS) 주기 실행 및 텔레메트리(	icksExecuted, ultimatesCast, lliesSummoned, upgradesBought, verageTickDurationMs, lastDangerScore) 실시간 집계.

2. **유닛 & 시뮬레이션 테스트 스위트 (	ests/stress/swarm_bot_engine.spec.ts)**:
   - Test 1: 1D Potential Field 탄막 회피 시뮬레이션 (수직 낙하 탄환 즉시 회피) -> **PASS**
   - Test 2: 바리케이드 차폐 (석재 0.02x, 빙하 0.2x 감쇄 계수 정밀 검증) -> **PASS**
   - Test 3: 다이버 수직 돌진 경보 및 회피 -> **PASS**
   - Test 4: 궁극기(E) 전략적 시전 조건 검증 (게이지 100 + 적 3기 이상 또는 보스) -> **PASS**
   - Test 5: 지원군(Q) 전략적 소환 조건 검증 (50💧 + 적 6기 이상 또는 Y > 450) -> **PASS**
   - Test 6: 상점 경제 자동 구매 우선순위 (FireRate -> MultiShot -> Piercing) -> **PASS**
   - Test 7: 인페이지 주입 컨트롤러 생명주기 및 텔레메트리 모니터링 -> **PASS**

3. **빌드 및 타입체크 검증 결과**:
   - 
px tsc --noEmit: 오류 0건 (성공)
   - 
pm run build: Turbopack 프로덕션 빌드 2.0초 만에 100% 성공
   - 
px playwright test tests/stress/swarm_bot_engine.spec.ts: 7개 테스트 전체 통과 (0.6s)

---

## 2. Logic Chain & Code Tree Structure

### 2.1 Swarm Bot Engine Architecture Tree

`
tests/stress/swarm_bot_engine.ts
├── 1. Perception Layer (extractBotPerception)
│    ├── Player Vector (X, Y, Speed, FireRate, MultiShot, Piercing, UltimateGauge, Stress)
│    ├── Active Bullets Vector (Filter !isDead & !isPlayerBullet, Vx, Vy, TTI)
│    ├── Active Enemies Matrix (Filter !isDead, Diver Flag, Boss Flag, Low-Y Threat)
│    ├── Barricades Geometry (Stone 98% Occlusion vs Ice 80% Occlusion)
│    └── Economy State (Pure Water Currency 💧, Level, Wave)
│
├── 2. Tactical & Evasion Solver Layer (SwarmBotEngine)
│    ├── A. Offensive Target Selector
│    │    └── Threat Priority = BottomBreach(Y>500) + Diver(900) + Boss(750) + Sniper(600) + LowY(0.8*Y) - Dist(0.4*dX)
│    ├── B. 1D Potential Field Raymarching (0 ~ 550px at 5px steps)
│    │    ├── Projectile TTI Raycaster: Danger = (1500 / (TTI + 0.05)) * Exp(-dx^2 / 2s^2) * ShadowMultiplier
│    │    ├── Diver Crash Predictor: 3000 * Exp(-diverDistX^2 / 2s^2)
│    │    ├── Offensive Distance Cost: |cx - targetX| * 1.2
│    │    ├── Movement Inertia Cost: |cx - playerX| * 0.3
│    │    └── Boundary Repulsion: Edge penalty within 30px
│    ├── C. Movement Action Dispatcher
│    │    └── playerX < bestCandidateX - 6 -> 'RIGHT' | playerX > bestCandidateX + 6 -> 'LEFT' | 'STAY'
│    ├── D. Strategic Skill Manager
│    │    ├── Ultimate (E): ultimateGauge >= 100 && (enemies >= 3 || hasBoss) -> triggerUltimate()
│    │    └── Ally (Q): currency >= 50 && (enemies >= 6 || enemies Y > 450) -> triggerSummonAlly()
│    └── E. Economy Auto-Buyer
│         ├── Priority 1: upgradeFireRate() (50 💧, fireRate > 0.1)
│         ├── Priority 2: upgradeMultiShot() (100 💧, multiShot < 5)
│         └── Priority 3: upgradePiercing() (200 💧)
│
└── 3. In-Page Runtime Injection Controller (injectSwarmBot)
     ├── start() / stop() / tick()
     ├── Dynamic Option Mutator: setOptions(newOptions)
     └── Real-Time Telemetry: ticks, decisions, skills, upgrades, avgTickDuration (<1ms)
`

---

## 3. Caveats (제약 사항 및 가정)

1. **상점 업그레이드 순차 루프**:
   - evaluateEconomy는 1회 틱 호출 시 보유 재화 한도 내에서 1순위(연사력)부터 잔여 재화를 차례로 소진하여 다중 업그레이드를 일괄 처리합니다.
2. **헤드리스 브라우저 타이머 정밀도**:
   - Playwright 헤드리스 브라우저 환경에서 setInterval(..., 16)은 시스템 CPU 상태에 따라 15~18ms 주기로 트리거될 수 있으며, 봇 내부 텔레메트리 타이머는 performance.now()를 기준으로 델타 시간을 정밀 측정합니다.

---

## 4. Conclusion (결론)

Milestone 1의 모든 요구사항(1D Potential Field 회피, 상시 사격 및 타겟 정렬, E/Q 스킬 자동화, 상점 3단계 우선순위 구매, 제로 레이턴시 인페이지 주입 및 텔레메트리 추적기)이 완벽하게 구현되고 7종의 검증 테스트를 통해 100% 동작이 검증되었습니다.

---

## 5. Verification Method (독립 검증 방법)

1. **TypeScript 타입 검사**:
   `powershell
   npx tsc --noEmit
   `
2. **Milestone 1 전용 유닛/시뮬레이션 테스트 실행**:
   `powershell
   npx playwright test tests/stress/swarm_bot_engine.spec.ts --reporter=list
   `
3. **Next.js 전체 프로덕션 빌드 검증**:
   `powershell
   npm run build
   `
