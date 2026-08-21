# Milestone 2 & 3: Swarm CLI Endurance Runner & Telemetry Collector Empirical Challenger Report

## 1. Observation (직접 관찰 및 실측 팩트)

1. **실제 CLI 러너 실행 및 아티팩트 검증 (`npx tsx scripts/run_swarm_endurance.ts --workers=4 --duration=15 --output=test-artifacts/stress_results.json`)**:
   - 실행 결과: 4개 워커 병렬 구동 및 `test-artifacts/stress_results.json` 파일 정상 생성 확인 (종료 코드 0).
   - 산출된 요약 통계:
     - `totalRuns`: 4
     - `survivalTime.avgMs`: 15,654.3ms (15.65s)
     - `survivalTime.medianMs`: 15,657ms
     - `survivalTime.stdDevMs`: 8.7ms
     - `survivalTime.ci95LowerMs`: 15,640.4ms
     - `survivalTime.ci95UpperMs`: 15,668.1ms
     - `overallAvgFps`: 54.5 FPS (Min FPS: 15.0 FPS, 1% Low FPS: 25.0 FPS)
     - `maxPeakHeapMb`: 9.5 MB (메모리 누수 감지: false)
     - `crashFreePercentage`: 100% (CRITICAL 이상 징후 0건)

2. **심층 아티팩트 및 런타임 불일치 결함 관찰 (Empirical Defect Discovery)**:
   - `test-artifacts/stress_results.json`의 개별 런(`runs[0]` ~ `runs[3]`) 스냅샷 상세 분석:
     - 4개 워커 모두 `score`: 0, `totalKills`: 0, `upgradesPurchased`: `{ fireRate: 0, multiShot: 0, piercing: 0, totalSpent: 0 }`, `skillsTriggered`: `{ ultimates: 0, allies: 0 }`로 기록됨.
     - `snapshots` 내부 `player.isShooting`: `false`, `player.isMovingLeft`: `false`, `player.isMovingRight`: `false`.
     - 14.1초 시점에 플레이어 체력이 0/5로 소진되었으며, `rawGameOverReason`: `"정수기가 파괴되었습니다. (체력 소진)"`이었으나, `causeOfDeath`: `"SURVIVED"`로 오분류됨.
   - **근본 원인 (Root Cause)**:
     - `src/game/types.ts` (Line 18-22):
       ```typescript
       export enum GameState {
         MENU = 'MENU',
         PLAYING = 'PLAYING',
         GAME_OVER = 'GAME_OVER'
       }
       ```
     - 반면 `scripts/run_swarm_endurance.ts` (Line 55), `tests/stress/swarm_bot_engine.ts` (Line 746), `tests/stress/endless_survival_swarm.spec.ts` (Line 57, 345)에서는:
       ```typescript
       if (!gm || gm.state !== 1) return; // gm.state가 문자열 'PLAYING'이므로 매 틱마다 조기 리턴되어 봇 동작이 전면 차단됨!
       ```
     - 또한 `tests/stress/telemetry_stress_collector.ts` (Line 857), `scripts/run_swarm_endurance.ts` (Line 372)에서는:
       ```typescript
       if (game.state === 2 /* GAME_OVER */) // gm.state가 문자열 'GAME_OVER'이므로 사망 상태를 인식하지 못하고 'SURVIVED'로 처리됨!
       ```

3. **통계 계산 엔진 (Student's t 95% CI & Stats) 실측 검증**:
   - `computeStressSummary(runs)`의 통계 수식 독립 오라클 검증 (`scripts/test_challenger_oracle.ts`):
     - 표본 크기 $n=4$ ($df=3$)에서 임계값 $t_{0.025, 3} = 3.182$ 정확히 적용됨.
     - 표본 크기 $n=1, 2, 4, 8, 10, 30$에 대한 오차 한계($Margin = t \cdot \frac{s}{\sqrt{n}}$) 및 $CI_{95\%}$ 산출 수학적 정합성 확인.
     - 평균, 중앙값, 최소/최대값, 롤링 FPS, 메모리 증가 기울기(`growthRateMbPerMin`), 이상 징후 집계 로직 100% 정상 작동.

4. **단위 및 통합 스트레스 테스트 실행 결과**:
   - `npx playwright test tests/stress/`: 총 34개 테스트 중 33개 통과, 1개 테스트(`ADV-1: 500-Bullet Benchmark`)에서 CPU 부하로 인한 2.067ms vs < 2.0ms 경계치 초과 발생.

---

## 2. Logic Chain & Code Tree Structure

### 2.1 Swarm Execution & Telemetry Lifecycle Logic Tree

```
[Swarm CLI Runner / Playwright Test]
 ├── Browser Context Launch & Page Goto (https://water-invader.vercel.app)
 ├── attachTelemetryToPage (IN_PAGE_TELEMETRY_SCRIPT)
 │    ├── rAF Loop: FPS, Delta Time, 1% Low FPS, Stutters (>33ms, >50ms)
 │    ├── Memory Loop: performance.memory Heap MB & Growth Slope
 │    ├── Audio Tracker: Oscillator/Gain Node Proxies
 │    └── Anomaly Watchdog: Error/Rejection, NaN, Overload Watch
 ├── Start Button Click -> GameManager.state = GameState.PLAYING ('PLAYING')
 │
 ├── [Bug Trigger Point 1: SwarmBot In-Page Loop]
 │    ├── scripts/run_swarm_endurance.ts: Line 55
 │    │    └── `if (!gm || gm.state !== 1) return;`
 │    │         ├── gm.state === 'PLAYING' (string)
 │    │         └── ('PLAYING' !== 1) evaluates to TRUE -> Early Return (No movement, no shooting, no upgrades)
 │    │
 │    └── tests/stress/swarm_bot_engine.ts: Line 746
 │         └── `if (gameManager && gameManager.state === 1)` -> Never ticks on live GameManager!
 │
 ├── [Bug Trigger Point 2: Game Over Detection & Cause of Death]
 │    ├── Player HP reaches 0 -> GameManager.state = GameState.GAME_OVER ('GAME_OVER')
 │    ├── scripts/run_swarm_endurance.ts: Line 372
 │    │    └── `if (snap.gameplay.gameState === 2)` -> ('GAME_OVER' === 2) is FALSE -> Stays in loop
 │    │
 │    └── tests/stress/telemetry_stress_collector.ts: Line 857
 │         └── `if (game.state === 2)` -> ('GAME_OVER' === 2) is FALSE
 │              └── Fallback: causeOfDeath = 'SURVIVED' (Even though rawGameOverReason = "정수기가 파괴되었습니다")
 │
 └── [Statistical Aggregation Layer: computeStressSummary & generateStressReportData]
      ├── Student's t 95% Confidence Interval: [15.64s, 15.67s] (Mathematically Verified)
      └── Artifact Export: test-artifacts/stress_results.json (Generated)
```

---

## 3. 5 Possible Resolution Methods (5가지 해결 방안 비교)

| 방안 # | 해결 방안 명칭 | 구현 내용 | 장점 | 단점 |
|---|---|---|---|---|
| **방안 1 (선택)** | **동종 호환 다중 상태 매칭 (Polymorphic State Guard)** | `scripts/run_swarm_endurance.ts`, `swarm_bot_engine.ts`, `telemetry_stress_collector.ts`, `endless_survival_swarm.spec.ts`의 상태 검사를 `(gm.state === 1 \|\| gm.state === 'PLAYING')` 및 `(gm.state === 2 \|\| gm.state === 'GAME_OVER' \|\| gm.player?.hp <= 0)`로 확장 | 실서버 배포본, 로컬 런타임, 숫자형 목업(Mock) 테스트 전반에 걸쳐 완벽한 무결성과 하위 호환성 보장 | 여러 파일의 조건식을 꼼꼼히 수정해야 함 |
| **방안 2** | **공통 GameState Enum 모듈 임포트 통일** | 모든 테스트 및 스크립트에서 `src/game/types.ts`의 `GameState` enum을 직접 import하여 `gm.state === GameState.PLAYING`으로 통일 | TypeScript 정적 타입 안정성 극대화 | 인페이지 주입 스크립트(eval/string) 환경에서는 enum 객체가 번들링되지 않아 런타임 오류 위험 존재 |
| **방안 3** | **Player HP 및 파라미터 기반 상태 추론** | `gm.state`를 보지 않고 `gm.player && gm.player.hp > 0` 여부만으로 활성 상태 및 게임오버를 판단 | `gm.state` 구현 방식에 완전히 독립적 | 일시정지(`isPaused`)나 타이틀 메뉴 화면 등 예외 상태 구분이 모호해짐 |
| **방안 4** | **GameManager 소스 코드 수정 (state를 1, 2 숫자로 변경)** | `src/game/GameManager.ts` 및 `types.ts`의 `GameState` 값을 숫자로 변경 | 봇 엔진 코드를 그대로 유지 가능 | 기존 게임 캔버스 UI 및 React 컴포넌트 전반에 걸친 브레이킹 체인지 발생 및 무단 소스 수정 금지 규칙 위반 |
| **방안 5** | **GameManager 프록시 인터셉터 주입** | 페이지 진입 시 `window.gameManager`의 `state` getter를 프록시하여 `'PLAYING'`일 때 `1`, `'GAME_OVER'`일 때 `2`를 반환하도록 변환 | 기존 봇 스크립트 수정 최소화 | 프록시 오버헤드 발생 및 실제 게임 컴포넌트와의 불일치 디버깅 난이도 증가 |

### 선정 방안 및 선정 이유
- **선정**: **방안 1 (동종 호환 다중 상태 매칭: Polymorphic State Guard)**
- **이유**:
  1. 실제 Next.js 게임 런타임(`GameState.PLAYING = 'PLAYING'`)과 기존 단위 테스트 목업(`state: 1`)을 모두 100% 완벽하게 지원합니다.
  2. 인페이지 문자열 주입(`IN_PAGE_SWARM_BOT_SCRIPT`) 환경에서도 외부 모듈 종속성 없이 순수 자바스크립트로 즉시 안전하게 작동합니다.
  3. `player.hp <= 0` 가드까지 함께 적용되어 어떤 돌발 네트워크/프레임 지연에서도 게임 오버와 사망 원인을 정확하게 포착할 수 있습니다.

---

## 4. Caveats (제약 사항 및 환경 조건)

1. **무단 코드 수정 금지 준수 (Review-Only Constraint)**:
   - 본 챌린저는 프로토콜 및 사용자 규칙(RULE[user_global_no_unauthorized_edits])에 따라 실제 소스 코드를 임의로 수정하지 않았으며, 결함의 재현 증거와 해결 방안만을 본 보고서에 기록하였습니다.
2. **Chromium 전용 메모리 텔레메트리**:
   - `window.performance.memory`는 Chromium 브라우저 엔진 고유 기능이며, 크로스 브라우저 환경에서는 0으로 안전하게 폴백됩니다.
3. **ADV-1 벤치마크 테스트 경계치**:
   - 500개 탄환 벤치마크(`ADV-1`)는 풀 스위트 동시 실행 시 CPU 로드로 인해 2.067ms를 기록하였으므로, 단독 실행 시에는 약 0.74ms로 정상 통과함을 확인하였습니다.

---

## 5. Conclusion (결론 및 판정)

### 최종 판정: **REQUEST_CHANGES (수정 요청)**

- **M2 & M3 통계 산출 및 러너 아키텍처는 수학적으로 견고하게 구현됨**:
  - Student's t 95% 신뢰구간, FPS 롤링 평균/1% Low, 메모리 기울기, 이상 징후 집계 공식은 100% 정품으로 검증됨.
- **다만, `GameState` 타입 불일치(문자열 `'PLAYING'` vs 숫자 `1`)로 인해 실서버 런타임에서 봇의 실시간 사격/회피/업그레이드가 차단되고 사망 원인이 `'SURVIVED'`로 오분류되는 치명적 런타임 결함이 발견됨.**
- 워커(Worker) 에이전트에게 방안 1의 **Polymorphic State Guard (`(gm.state === 1 || gm.state === 'PLAYING')`) 적용**을 요청합니다.

---

## 6. Verification Method (독립 검증 방법)

워커의 결함 수정 후 다음 명령어를 실행하여 독립 검증을 수행합니다:

1. **독립 스웜 CLI 스트레스 러너 실행**:
   ```powershell
   npx tsx scripts/run_swarm_endurance.ts --workers=4 --duration=15 --output=test-artifacts/stress_results.json
   ```
2. **`test-artifacts/stress_results.json` 실측 아티팩트 검증**:
   - `summary.combatStats.avgScore > 0` 및 `summary.combatStats.avgKills > 0` 확인 (봇이 정상적으로 사격 및 적 처치 수행).
   - `summary.deathCauseDistribution`에서 체력 소진 시 `'ENEMY_BULLET'` 또는 `'DIVER_COLLISION'`으로 정확히 집계되는지 확인.
   - `summary.weaponEvolution`에서 업그레이드 수치가 정상 갱신되는지 확인.
3. **스트레스 테스트 전체 통과 확인**:
   ```powershell
   npx playwright test tests/stress/
   ```
