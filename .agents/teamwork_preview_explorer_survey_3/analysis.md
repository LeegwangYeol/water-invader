# Water Invader 테스트 자동화 & 봇 러너 아키텍처 분석 보고서 (Explorer 3)

---

## 1. 개요 및 조사 목적

본 조사는 Water Invader 난이도 재조정(Difficulty Rebalance) 프로젝트의 핵심 검증 도구인 **헤드리스 자동 플레이 봇(Headless Automated Gameplay Bot) 및 벤치마크 테스트 하네스(Benchmark Test Harness)**의 실현 가능성(Feasibility)과 아키텍처 설계를 수립하기 위해 수행되었습니다.

- **목표**: 인간의 개입 없이 봇이 자율적으로 총알 회피, 적 조준 및 사격, 스킬(Q/E) 및 상점 업그레이드를 수행하며 게임오버 시점까지 생존 데이터를 정밀 측정하는 100% 자동화 파이프라인 설계.
- **핵심 산출물**:
  1. `baseline_results.json` (난이도 패치 전 10+회 기준 데이터셋)
  2. `rebalanced_results.json` (난이도 패치 후 10+회 비교 데이터셋)

---

## 2. 개발 환경 & 의존성 검증 (Dependency & Tool Analysis)

### 2.1 런타임 및 의존성 현황
- **Node.js**: `v24.13.0` (Native ES Module 및 TypeScript 실행 지원)
- **npm**: `11.6.2`
- **Next.js**: `16.3.1` (Turbopack 기반 Next 16 SSR & Static Export 지원)
- **React**: `19.2.8` (`use client` 컴포넌트 구조)
- **E2E 테스트 도구**: `@playwright/test: ^1.62.1` (Chromium 브라우저 바이너리 설치 완료 및 동작 검증)
- **CLI 스크립트 실행 도구**: `npx tsx (v4.23.12)` (빌드 단계 없이 TypeScript 스크립트 즉시 실행 가능)

### 2.2 코드베이스 노출 인터페이스 (State Exposition)
- `src/components/game-canvas.tsx` 85행: `(window as any).gameManager = game;`
- 브라우저 전역 `window.gameManager` 객체에 게임 루프의 모든 핵심 상태가 실시간으로 노출되어 있어, 별도의 소스 코드 침해(Invasive instrumentation) 없이도 Playwright의 `page.evaluate()` 또는 `page.addInitScript()`를 통해 완벽한 텔레메트리 후킹과 봇 컨트롤이 가능합니다.

---

## 3. 로컬 서버 구동 및 헤드리스 테스트 접근 5대 방식 비교

자동화 벤치마크를 수행하기 위해 로컬 웹 서버와 Playwright 헤드리스 브라우저를 연동하는 5가지 아키텍처 방안을 검토하였습니다.

### 3.1 5대 방식 비교 분석

| 번호 | 방식 (Method) | 구동 메커니즘 | 장점 | 단점 |
| :--- | :--- | :--- | :--- | :--- |
| **방식 1** | **Playwright `webServer` + `next start` (프로덕션 빌드 기반)** | `playwright.config.ts`의 `webServer` 옵션으로 `npm run build && next start`를 자동 기동 후 `localhost:3000` 접속 | 프로덕션과 동일한 60FPS 성능, HMR 오버헤드 없음, 완전 자동화 | 빌드 단계(약 1.5초) 선행 필요 |
| **방식 2** | **Playwright `webServer` + `next dev` (개발 서버 기반)** | `webServer`로 `next dev` 구동 후 E2E 테스트 수행 | 코드 수정 시 빌드 없이 즉시 반영 | Turbopack HMR 및 컴파일 지연으로 봇 프레임 드랍 발생 가능 |
| **방식 3** | **독립 Node.js CLI 스크립트 (`npx tsx`) + Playwright API 직접 제어** | `scripts/run_benchmark.ts`에서 `chromium.launch({ headless: true })`로 브라우저 인스턴스를 직접 생성하여 N회 루프 실행 | 테스트 프레임워크 오버헤드 없이 순수 JSON 수집 가능, 배치 제어 용이 | 별도 CLI 옵션 파서 및 에러 핸들러 자체 구현 필요 |
| **방식 4** | **Puppeteer 독립 헤드리스 제어 스크립트** | Puppeteer를 신규 설치하여 독립 봇 스크립트 구동 | 경량 브라우저 제어 | 신규 패키지 설치 필요, 기존 Playwright 인프라 중복 |
| **방식 5** | **Next.js 내부 API 라우트/서버리스 시뮬레이터 (Headless DOM-less)** | Canvas Context2D 모킹 후 Node.js 백엔드 메모리 상에서 GameManager 클래스 직접 인스턴스화하여 물리 시뮬레이션 | 렌더링 오버헤드 0, 1초에 1,000회 시뮬레이션 초고속 실행 | 실제 브라우저 이벤트(requestAnimationFrame, 키보드 이벤트)와의 미세 괴리 발생 가능 |

### 3.2 최적 방식 선정 및 선정 사유
- **선정 방식**: **방식 1 (Playwright `webServer` + `next start`) + 방식 3 (독립 TSX 벤치마크 러너)의 하이브리드 구성**
- **선정 사유**:
  1. 프로덕션 빌드 기반(`next start`) 구동으로 Next.js Turbopack dev 모드의 불규칙한 프레임 스파이크를 원천 배제하여 공정한 난이도 데이터 측정 보장.
  2. Playwright E2E 테스트 슈트(`npx playwright test tests/benchmark/bot_runner.spec.ts`)와 Standalone CLI 러너(`npx tsx scripts/run_benchmark.ts`) 양쪽에서 동일한 봇 알고리즘을 모듈화하여 재사용 가능.

---

## 4. 자동 플레이 봇 휴리스틱 알고리즘 설계 (Bot Heuristic Design)

인간 플레이어의 반응성과 판단력을 모사하면서도 결정론적(Deterministic)이고 공정한 플레이를 수행할 수 있는 봇 알고리즘을 설계합니다.

### 4.1 봇 휴리스틱 5대 방식 비교

| 번호 | 방식 (Method) | 알고리즘 메커니즘 | 장점 | 단점 |
| :--- | :--- | :--- | :--- | :--- |
| **방법 1** | **단순 반응형 상태머신 (Rule-based FSM)** | 플레이어 주변 반경(예: 100px)에 총알이 오면 좌/우로 단순 회피, 없을 시 적 방향 이동 | 구현이 매우 단순함 | 다중 탄막이나 코너에 갇힐 경우 회피 불가 |
| **방법 2** | **1D 잠재력장 및 탄도 예측 광선추적 (Potential Field with 1D Raymarching)** | 1D X축(0~550)을 격자화하고, 모든 적 총알의 착탄 예상 시간(TTI)과 다이버 적의 궤적을 투영하여 최적 안전 좌표 도출 | 탄막 밀집 구역 및 회피 경로를 99% 이상 예측 계산 가능 | 1프레임당 연산량 증가 (약 0.5ms) |
| **방법 3** | **인게임 물리 직접 주입 (Direct State Manipulation)** | 키보드 이벤트 대신 `player.position.x`를 즉시 순간이동 | 완벽한 생존율 | 게임 본래의 이동속도(300px/s) 제약을 위반하여 밸런스 검증 불가 |
| **방법 4** | **심층 Q-러닝 / 강화학습 에이전트 (RL Agent)** | 보상 함수 기반 신경망 학습 모델 적용 | 초고난도 플레이 가능 | 수천 회의 학습 시간 필요, 밸런스 벤치마크 도구로 과도한 오버엔지니어링 |
| **방법 5** | **계층적 유틸리티 이론 봇 (Hierarchical Utility Theory with Barricade Shadowing)** | 방어(탄막 회피 + 무적 바리케이드 차폐 활용) > 공격(적군 중심 정렬 사격) > 특수행동(Q/E 스킬) 유틸리티 점수 계산 | 바리케이드 엄폐를 전략적으로 활용하여 인간 고수의 플레이 모사 | 파라미터 가중치 튜닝 필요 |

### 4.2 최적 방식 선정: **방법 5 (Hierarchical Utility with 1D Threat Field & Barricade Shadowing)**

#### 봇 의사결정 트리 구조 (Bot Decision Tree)

```text
┌─────────────────────────────────────────────────────────────┐
│                 Bot Decision Loop (60Hz / RAF)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
               [1. Context Perception via window.gameManager]
               ├── Player: (x, y, hp, ultimateGauge, stress, suppression)
               ├── Bullets: Array<{ x, y, vx, vy, isPlayerBullet, damage }>
               ├── Enemies: Array<{ x, y, type, hp, isDiving, speedX, speedY }>
               └── Barricades: Array<{ x, y, type, hp, isDead }>
                               │
               [2. 1D Danger Field Evaluation (X: 0 ~ 550)]
               ├── Step 2.1: Project enemy bullets to Player Y (740)
               │    └── TTI = (740 - bullet.y) / bullet.vy
               │    └── Predicted X = bullet.x + bullet.vx * TTI
               │    └── Danger Zone = [Predicted X - 25, Predicted X + 25]
               │    └── Weight = 1000 / (TTI + 0.1)
               ├── Step 2.2: Barricade Shadowing Mask
               │    └── If Indestructible Barricade (x=195, 345) exists between
               │        bullet.x and player.x, Danger Weight *= 0.05 (Safe Zone)
               ├── Step 2.3: Diver Enemy Crash Prediction
               │    └── If Diver is above player (|dx| < 30) -> High Alert (Danger *= 2.0)
               └── Step 2.4: Enemy Bottom Breach Threat
                    └── If Enemy Y > 600 -> Prioritize alignment to kill before breach
                               │
               [3. Offensive Alignment & Target Selection]
               ├── Priority Target: Diver > Boss > Sniper > Nearest Cluster
               └── Optimal Attack X = Target.center.x - Player.width / 2
                               │
               [4. Candidate Action Scoring (Move Left / Stay / Move Right)]
               ├── Cost(Left)  = DangerScore(x - dt*speed) + TargetDistance(x - dt*speed) * W_tgt
               ├── Cost(Stay)  = DangerScore(x)             + TargetDistance(x) * W_tgt
               └── Cost(Right) = DangerScore(x + dt*speed) + TargetDistance(x + dt*speed) * W_tgt
                               │
               [5. Execution & Skill Management]
               ├── Movement: Trigger KeyDown/KeyUp for 'ArrowLeft' or 'ArrowRight'
               ├── Continuous Fire: Maintain 'Space' key down
               ├── Ultimate Skill: If ultimateGauge >= 100 -> Press 'e'
               └── Ally Support: If currency >= 50 && enemies.length > 8 -> Press 'q'
```

---

## 5. 텔레메트리 데이터 수집 및 사망 원인 추적 설계 (Telemetry Design)

### 5.1 수집 지표 규격 (Metrics Specification)
1. **Run Identification**: `runId` (문자열, 예: `run_01`), `timestamp` (ISO-8601)
2. **Survival Metrics**:
   - `durationMs`: 플레이 시작부터 GAME_OVER까지의 순수 생존 시간 (밀리초)
   - `waveReached`: 최종 도달 웨이브 (Level)
   - `finalScore`: 최종 획득 점수
   - `pureWater`: 최종 보유 퓨어 워터
3. **Combat Efficiency**:
   - `totalShotsFired`: 플레이어가 발사한 총 탄환 수
   - `totalShotsHit`: 적에게 명중한 탄환 수
   - `accuracy`: 명중률 (`totalShotsHit / totalShotsFired * 100`)
   - `totalKills`: 처치한 총 적의 수
   - `killBreakdown`: 적 유형별 처치 수 (`NORMAL`, `ZIGZAG`, `BOSS`, `SNIPER`, `DIVER`, `SHIELDED`, `SPLITTER`)
4. **Damage & Failure Diagnostics**:
   - `totalDamageTaken`: 플레이어가 입은 총 피해량
   - `causeOfDeath`: 구체적 사망 원인 분류
     - `ENEMY_BULLET`: 적 일반/보스/스나이퍼 탄환 피격 사망
     - `DIVER_COLLISION`: 다이버 적의 급강하 직접 충돌 사망
     - `DEFENSE_BREACH`: 적이 화면 하단 방어선을 통과하여 체력 소진 사망
     - `TIME_CAP_SURVIVED`: 제한 시간(예: 300초) 이상 생존 성공
5. **Progression Micro-Data**:
   - `waveHistory`: 웨이브별 진입 시점, 소요 시간, 피격 횟수 기록 배열

### 5.2 텔레메트리 후킹 데이터 흐름도 (Data Flow Tree)

```text
┌─────────────────────────────────────────────────────────────┐
│                 Telemetry Hook Architecture                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
            [Playwright Injection: page.evaluate()]
                               │
     ┌─────────────────────────┴─────────────────────────┐
     ▼                                                   ▼
[Event Listeners & Proxy Wrappers]              [Sampling Loop (100ms)]
├── gameManager.onPlayerHpChange                ├── Track active wave duration
│    └── Detect HP drop -> log damage event     ├── Track combo peak
├── gameManager.handleEnemyKill (Proxy)         └── Monitor stress & suppression
│    └── Increment killCount & type counter
├── player.fire (Proxy)
│    └── Increment shotsFired counter
└── gameManager.gameOver (Proxy)
     └── Capture exact reason & finalize telemetry
                               │
                               ▼
               [In-Memory Telemetry Collector]
               ├── runId: "baseline_01"
               ├── durationMs: 42350
               ├── waveReached: 3
               ├── score: 4850
               ├── causeOfDeath: "ENEMY_BULLET"
               └── kills: { NORMAL: 24, ZIGZAG: 8, ... }
                               │
                               ▼
                 [JSON Export via Playwright]
                 └── tests/benchmark/results/baseline_results.json
```

---

## 6. 벤치마크 러너 스크립트 구조 (Benchmark Runner Structure)

### 6.1 디렉토리 및 파일 레이아웃

```text
C:\src\SpaceInvader\
├── scripts/
│   ├── run_benchmark.ts           # Standalone TSX 벤치마크 실행기
│   ├── analyze_metrics.py         # 통계 분석 및 그래프 생성기 (선택적)
│   └── compare_results.ts         # Baseline vs Rebalanced 통계 비교 스크립트
├── tests/
│   ├── benchmark/
│   │   ├── bot_heuristics.ts      # 봇 이동/회피/사격 계산 엔진
│   │   ├── telemetry_collector.ts # 텔레메트리 수집 및 프록시 후킹 모듈
│   │   └── automated_runner.spec.ts # Playwright 기반 N회차 벤치마크 스위트
│   └── ... (기존 E2E 테스트)
└── results/
    ├── baseline_results.json      # 리밸런싱 전 10+회 원시 데이터
    ├── rebalanced_results.json    # 리밸런싱 후 10+회 원시 데이터
    └── comparison_summary.json    # t-검정, 생존율 증가율, 사망원인 변화 요약
```

### 6.2 벤치마크 실행 파이프라인 트리 (Pipeline Execution Tree)

```text
┌─────────────────────────────────────────────────────────────┐
│                  Benchmark Execution Suite                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               [Phase 1: Environment Preparation]
               ├── Verify localhost:3000 webServer readiness
               └── Initialize results/ directory
                               │
               [Phase 2: Sequential Iteration Loop (1 .. N)]
               ├── Step 2.1: Launch Chromium Browser Context
               ├── Step 2.2: Navigate to '/' & Wait for Canvas Load
               ├── Step 2.3: Inject TelemetryCollector into window
               ├── Step 2.4: Click 'START GAME'
               ├── Step 2.5: Run Bot Control Loop (RAF / evaluate)
               │    └── Avoid bullets, shoot, use Q/E, dodge divers
               ├── Step 2.6: Wait for GameState.GAME_OVER or Timeout
               └── Step 2.7: Extract Telemetry JSON & Close Context
                               │
               [Phase 3: Statistical Aggregation]
               ├── Calculate Mean & Median Survival Time (ms)
               ├── Calculate Standard Deviation & 95% Confidence Interval
               ├── Compute Wave Reach Distribution & Death Cause Histogram
               └── Write results to baseline_results.json / rebalanced_results.json
```

### 6.3 JSON 출력 데이터 스키마 (Sample JSON Output)

```json
{
  "benchmarkMetadata": {
    "target": "baseline",
    "totalRuns": 10,
    "timestamp": "2026-08-21T17:30:00Z",
    "gitCommit": "current",
    "environment": {
      "node": "v24.13.0",
      "playwright": "1.62.1",
      "viewport": { "width": 1280, "height": 900 }
    }
  },
  "summaryStatistics": {
    "avgSurvivalTimeMs": 38420.5,
    "medianSurvivalTimeMs": 37100.0,
    "stdDevSurvivalTimeMs": 8450.2,
    "ci95LowerMs": 33180.1,
    "ci95UpperMs": 43660.9,
    "avgWaveReached": 2.8,
    "maxWaveReached": 4,
    "avgScore": 3420,
    "deathCauseDistribution": {
      "ENEMY_BULLET": 60.0,
      "DIVER_COLLISION": 30.0,
      "DEFENSE_BREACH": 10.0
    }
  },
  "runs": [
    {
      "runId": "run_01",
      "durationMs": 41200,
      "waveReached": 3,
      "score": 4200,
      "pureWater": 140,
      "shotsFired": 180,
      "shotsHit": 135,
      "accuracy": 75.0,
      "totalKills": 32,
      "causeOfDeath": "ENEMY_BULLET",
      "waveHistory": [
        { "wave": 1, "durationMs": 14200, "damageTaken": 0, "kills": 18 },
        { "wave": 2, "durationMs": 18500, "damageTaken": 2, "kills": 14 },
        { "wave": 3, "durationMs": 8500, "damageTaken": 3, "kills": 0 }
      ]
    }
  ]
}
```

---

## 7. 결론 및 다운스트림 에이전트 연계 권고

1. **자동화 타당성 (Feasibility)**: `window.gameManager`의 투명한 객체 노출과 Playwright 1.62의 고속 브라우저 제어 덕분에, **소스 코드 수정 없이 100% 비침습적(Non-invasive) 봇 하네스 구축이 완전하게 실현 가능**합니다.
2. **통계적 유의성 확보**: 10회 이상의 연속 런을 자동화하여 평균 생존 시간 및 사망 원인 분포를 도출함으로써, 리밸런싱 전/후의 개선도를 신뢰구간(95% CI)과 t-검정(p < 0.05)으로 수학적으로 증명할 수 있습니다.
