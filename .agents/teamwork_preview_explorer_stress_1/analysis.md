# QA Automation and Live Stress Testing Survey & Strategy Analysis

## 1. Executive Summary (요약)
본 분석 문서는 **Water Invader (SpaceInvader)** 프로젝트의 배포 환경(https://water-invader.vercel.app/) 및 로컬 코드베이스에 대한 QA 자동화, 라이브 스트레스 테스트 인프라, 적/아군 메커니즘 검증 및 Chrome DevTools MCP / Playwright / Puppeteer 기반의 종합 검증 전략을 수립한 기술 보고서입니다.

---

## 2. Testing Infrastructure & Dependency Survey (테스트 인프라 및 의존성 조사)

### 2.1 패키지 및 런타임 현황 (package.json)
- **Node.js 버전**: 24.13.0 (LTS 지원 최신 런타임)
- **npm 버전**: 11.6.2
- **프레임워크 및 코어 라이브러리**:
  - 
ext: 16.3.1 (Next.js 16 App Router)
  - eact / eact-dom: 19.2.8 (React 19)
  - 	ailwindcss: ^4 (Tailwind CSS v4)
  - 	ypescript: ^5
- **테스트 라이브러리 부재 현황**:
  - package.json의 devDependencies에 Playwright(@playwright/test), Puppeteer(puppeteer), Vitest(itest), Jest(jest) 등 테스트 프레임워크가 사전 설치되어 있지 않음.
  - 하지만 
px playwright 및 
px puppeteer를 통한 즉시 다운로드 실행 또는 프로젝트 로컬 설치(
pm install -D @playwright/test)가 완전히 가능한 환경임.

### 2.2 실시간 브라우저 및 DevTools MCP 환경
- **Chrome DevTools MCP 연결 상태**:
  - 이미 chrome-devtools-mcp 서버가 활성화되어 있으며, 라이브 배포 URL(https://water-invader.vercel.app/)의 페이지 세션에 직접 연결되어 있음.
  - 사용 가능 도구: evaluate_script, click, press_key, 	ype_text, 	ake_screenshot, 	ake_snapshot, list_console_messages, list_network_requests 등.
- **전역 게임 엔진 노출 (window.gameManager)**:
  - src/components/game-canvas.tsx 85행에 (window as any).gameManager = game; 코드가 삽입되어 있어, 브라우저 콘솔 및 DevTools MCP 스크립트에서 게임 인스턴스에 100% 직접 접근하여 상태 제어 및 실시간 텔레메트리 추출이 가능함.

---

## 3. Codebase Architecture & Execution Flow (코드 트리 구조 분석)

`	ext
Water Invader System & QA Verification Flow
├── 1. Frontend Layer (React 19 / Next.js 16)
│   ├── src/app/page.tsx (메인 컨테이너 및 래퍼)
│   └── src/components/game-canvas.tsx
│       ├── UI HUD (점수, 정수된 물, Wave, HP 구슬, Combo, 궁극기 게이지)
│       ├── Mobile Controls (◀, ▶, ALLY(Q), ULT, FIRE 버튼)
│       ├── Overlays (MENU, HOW TO PLAY 모달, GAME OVER / 상점)
│       └── Canvas Hook & window.gameManager 전역 바인딩 (Line 85)
├── 2. Game Engine Core (Vanilla TypeScript Canvas)
│   ├── src/game/GameManager.ts (게임 메인 루프 & 상태 오케스트레이션)
│   │   ├── loop() -> deltaTime 기반 고정 업데이트 (update) 및 렌더링 (draw)
│   │   ├── spawnWave() -> Wave별 행/열 동적 생성 및 특수 적 확률 스폰 (Line 119~151)
│   │   ├── checkCollisions() -> 총알/적/방벽/플레이어/서포터 충돌 처리 (Line 330~470)
│   │   ├── handleEnemyKill() -> 콤보, 재화, 궁극기 게이지 충전
│   │   └── Developer Cheats (F3: Debug Hitbox/FPS, F4: God Mode, F5: +1000??)
│   ├── src/game/Player.ts (플레이어 수압 펌프 & 물방울 캐릭터)
│   │   ├── update() / fire() -> 다중 발사(multiShot), 관통(piercing), 스트레스/제압 메커니즘
│   │   └── draw() -> 물방울 베지어 곡선, 표정 애니메이션 (기본, 스트레스, 제압, 반창고/균열)
│   ├── src/game/Enemy.ts (7종 적 벡터 그래픽 & AI 행동)
│   │   ├── NORMAL (주황 문어 블롭 + 사인파 촉수)
│   │   ├── ZIGZAG (노란 8각 별 + 회전 및 고속 지그재그 이동)
│   │   ├── BOSS (Wave 5 주기 대형 해골 머신 + 타겟팅 탄막)
│   │   ├── SNIPER (보라색 다이아몬드/삼각형 + 플레이어 조준 고속탄 + isInterceptable)
│   │   ├── DIVER (빨간색 눈물방울/로켓 + X축 정렬 시 수직 다이브 공격)
│   │   ├── SHIELDED (슬레이트 6각형 아머 + 파란 보호막 3HP 재생)
│   │   └── SPLITTER (녹색 겹친 버블 + 파괴 시 초저속 미니 2체 분열)
│   ├── src/game/Bullet.ts (수자원/오염물질 탄환 물리)
│   │   ├── isPlayerBullet (물방울 형태) vs Enemy Bullet (발광 구체)
│   │   └── isInterceptable 플래그 (스나이퍼 탄환 요격 속성)
│   ├── src/game/Barricade.ts (복셀 파괴 방벽)
│   │   ├── DESTRUCTIBLE (하늘색 얼음 방벽 - 6x4 복셀 블록 점진 파괴)
│   │   └── INDESTRUCTIBLE (슬레이트 돌 방벽 - 무적 방어)
│   └── src/game/Helper.ts (소환 아군 서포터)
│       ├── FIGHTER (녹색 공격 드론)
│       ├── REPAIRER (노란색 방벽 수리 드론)
│       └── TANK (보라색 탄환 흡수 드론)
`

---

## 4. Requirements Verification & Root Cause Findings (요구사항별 심층 분석 및 결함 발견)

### 4.1 R1. UI 및 캐릭터 벡터 그래픽 검증
1. **ALLY(Q) 버튼 존재 여부**:
   - **로컬 코드 (src/components/game-canvas.tsx:201-209)**:
     - ALLY(Q) 버튼이 정상 구현되어 있으며, currency >= 50일 때 녹색 활성화, 터치/클릭 시 handleTouchStart('q')로 연동됨.
   - **라이브 배포 사이트 (https://water-invader.vercel.app/) 실측 결과**:
     - 실제 라이브 DOM에는 ◀, ▶, ULT\n0%, FIRE 4개 버튼만 렌더링되고 있으며, **ALLY(Q) 버튼이 누락**된 이전 빌드가 배포되어 있음. (원인: Vercel 배포 미반영 또는 최신 커밋 미배포).
2. **플레이어 캐릭터 물방울 벡터 렌더링**:
   - src/game/Player.ts:163-170에서 Canvas 베지어 곡선(ezierCurveTo)과 방사형 그라디언트(createRadialGradient)를 사용하여 귀여운 파란 물방울 형태로 렌더링됨을 확인.
3. **적 7종 벡터 그래픽 렌더링**:
   - src/game/Enemy.ts:169-307에서 픽셀 아트 대신 Canvas Path API(oundRect, ezierCurveTo, rc, lineTo)를 사용한 고품질 벡터 그래픽으로 전면 개편되어 있음 확인.

---

### 4.2 R2. 게임 메커니즘 심층 검증 (결함 및 정상 로직 분석)

`	ext
Game Mechanics Verification Decision Tree
├── 1. Enemy Barricade Slowdown Check
│   ├── Enemy.ts: Line 19 (public isGnawing: boolean = false 선언)
│   ├── GameManager.ts: Line 451, 462 (충돌 시 isGnawing = true 플래그 설정)
│   └── [결함 발견] Enemy.ts의 update() 루프에서 isGnawing에 따른 이동 속도 감속 로직이 누락되어 감속되지 않음!
├── 2. Diver Crash & Explode vs Gnaw Check
│   ├── GameManager.ts: Line 455~460
│   └── [정상 확인] enemy.type === DIVER 충돌 시 isDead = true 및 destructible barricade에 즉시 20 대미지 폭발 충돌 처리 완료.
├── 3. Splitter Low-Speed Division Check
│   ├── GameManager.ts: Line 377~386
│   └── [정상 확인] SPLITTER 처치 시 speedX = 10, speedY = 5 (일반 적 50/10 대비 극도로 느린 속도)의 미니 적 2체 스폰 완료.
└── 4. Sniper Bullet Interception Check
    ├── Bullet.ts: Line 7 (public isInterceptable: boolean = false)
    ├── Enemy.ts: Line 154 (스나이퍼 발사 시 b.isInterceptable = true 부여)
    └── [결함 발견] GameManager.ts: Line 330~470의 checkCollisions() 내에 플레이어 탄환과 적 탄환 간의 충돌 및 요격 루프가 완전히 누락되어 요격 불가!
`

1. **방벽 중첩 시 적 감속 (Barricade Slowdown)**:
   - Enemy.ts와 GameManager.ts를 전수 조사한 결과, 방벽에 닿았을 때 isGnawing = true 플래그는 켜지지만 Enemy.ts:74의 update 함수에서 speedX/speedY를 줄이는 로직이 연결되어 있지 않아 실제로는 감속 없이 원래 속도로 진행됨.
2. **다이버(Diver) 방벽 자폭 충돌**:
   - GameManager.ts:455-460에서 enemy.type === EnemyType.DIVER인 경우 갈아먹기(Gnawing) 대신 enemy.isDead = true, arricade.hp -= 20 및 폭발 파티클 30개를 생성하며 즉시 자폭함이 완벽하게 구현됨.
3. **스플리터(Splitter) 초저속 분열체**:
   - GameManager.ts:377-386에서 SPLITTER 사망 시 크기 20x20, speedX: 10 / -10, speedY: 5의 초저속 미니체 2마리를 스폰하도록 완벽하게 구현됨.
4. **스나이퍼 탄환 플레이어 총알 요격 (Sniper Bullet Interception)**:
   - Bullet.ts에 isInterceptable: boolean 프로퍼티가 있고 Enemy.ts:154에서 스나이퍼 탄환에 .isInterceptable = true를 부여하지만, **GameManager.ts의 checkCollisions()에 플레이어 총알(isPlayerBullet)과 적 총알(isInterceptable) 간의 상호 충돌 검사 로직이 누락**되어 있어 현재 요격이 발생하지 않음.

---

### 4.3 R3. 라이브 스트레스 테스트 및 적 스폰 조건 분석
- **웨이브별 스폰 공식 (GameManager.ts:126-151)**:
  - ows = 3 + Math.floor(level / 4)
  - cols = 6 + Math.floor(level / 3)
  - maxSpecials = Math.max(1, Math.min(1 + Math.floor(level / 2), 4))
  - 웨이브 1: 최대 1체 특수 적 스폰 확률 (Math.random() > 0.85)
  - 웨이브 2~3: 최대 2체 특수 적 스폰
  - 웨이브 4: 최대 3체 특수 적 스폰
  - 웨이브 5: 보스전 (level % 5 === 0) 대형 보스 1체 스폰
- **적 7종 라이브 스폰 전략**:
  - 오토파일럿 봇(Auto-Pilot Bot) 스크립트를 통해 플레이어가 탄환을 지속 발사하고 타겟팅 이동하며 웨이브 1 -> 2 -> 3 -> 4 -> 5를 순차 클리어하여 모든 적(Normal, Zigzag, Sniper, Diver, Splitter, Shielded, Boss)의 출현을 100% 포착 및 스트레스 부하 검증 가능.

---

## 5. 5가지 QA 및 스트레스 테스트 방안 비교 및 최적 방안 선정

| 방안 (Method) | 설명 (Description) | 장점 (Pros) | 단점 (Cons) |
|---|---|---|---|
| **Method 1: Chrome DevTools MCP 실시간 대화형 검증** | 활성화된 DevTools MCP 세션을 통해 window.gameManager 상태를 직접 조작하고 스크린샷 캡처 | 사전 패키지 설치 불필요, 실시간 시각적 증거 확보 용이 | 다수 웨이브 자동 반복 실행 시 턴 소모 |
| **Method 2: 독립형 Playwright E2E 자동화 스위트** | @playwright/test 스크립트를 작성하여 Chromium 헤드리스/헤디드 브라우저로 라이브 URL 검증 | CI/CD 파이프라인 표준, 대량 반복 회귀 테스트에 적합 | 브라우저 바이너리 다운로드 및 설정 필요 |
| **Method 3: Puppeteer 기반 초경량 노드 스트레스 러너** | 
ode scripts/stress-test.js로 Puppeteer 세션을 띄우고 100ms 폴링으로 텔레메트리 로깅 | 가볍고 단순한 스크립트로 FPS, 메모리 힙, 엔티티 누수 측정 용이 | Playwright 대비 Assertion 도구 생태계 다소 협소 |
| **Method 4: 인페이지 초고속 틱 시뮬레이션 하네스** | 브라우저 내에서 gameManager.update(1/60)를 루프로 수만 번 호출하는 가상 시뮬레이션 | 10,000 프레임을 수 초 만에 돌려 장기 생존/메모리 누수 검증 | 실제 렌더링 프레임레이트 및 시각적 애니메이션 검증 불가 |
| **Method 5: 하이브리드 통합 검증 스위트 (DevTools MCP + 오토파일럿 하네스)** | Chrome DevTools MCP의 실시간 렌더링/스크린샷과 브라우저 내 오토파일럿 자율 주행 봇을 결합한 통합 방식 | 무설치 즉시 실행 가능, 고속 웨이브 등반과 시각적 증거(스크린샷) 동시 확보 | 브라우저 탭 세션 의존성 |

### 최적 방안 선정: **Method 5 (하이브리드 통합 검증 스위트)**
- **선정 이유**:
  1. 현재 이미 chrome-devtools-mcp가 라이브 URL에 완벽히 연결되어 있으며 window.gameManager가 노출되어 있어 추가적인 도구 설치 지연 없이 100% 즉각 수행 가능합니다.
  2. 오토파일럿 전투 루프를 브라우저 내에 주입하여 웨이브 1~5까지 자동으로 등반하며 스나이퍼, 다이버, 스플리터, 보스가 스폰되는 즉시 스크린샷과 텔레메트리를 포착할 수 있습니다.
  3. 향후 CI/CD 및 독립 회귀 테스트를 위해 Playwright 스크립트 템플릿(Method 2)을 함께 제공하여 완벽한 호환성을 보장합니다.

---

## 6. Concrete Test Execution Strategy (구체적 테스트 실행 전략 및 시나리오)

`	ext
Live QA & Stress Testing Execution Pipeline
├── Step 1: Pre-flight Inspection
│   ├── Canvas 존재 확인 (width: 600, height: 800)
│   ├── React UI DOM 요소 검증 (HUD, ALLY 버튼, ULT 버튼)
│   └── window.gameManager 인스턴스 무결성 확인
├── Step 2: Auto-Pilot Multi-Wave Combat Loop
│   ├── God Mode 활성화 및 플레이어 스탯 부스팅 (fireRate: 0.08, multiShot: 3, piercing: 3)
│   ├── AI 타겟팅: 최하단 적을 향해 X축 자동 추적 이동
│   ├── 상시 연사 및 궁극기(100% 충전 시 'E'), ALLY 소환(50?? 충전 시 'Q') 자동 발동
│   └── 웨이브 1 → 2 → 3 → 4 → 5(보스) 자동 돌파
├── Step 3: Enemy Mechanics Specific Probes
│   ├── Normal: 촉수 사인파 렌더링 및 하강 속도 측정
│   ├── Zigzag: 고속 회전 및 사인파 궤적 확인
│   ├── Sniper: 조준 탄환 각도 및 isInterceptable 플래그 확인
│   ├── Diver: 플레이어 X축 일치 시 급강하 및 방벽 20 대미지 자폭 폭발 검증
│   ├── Splitter: 피격 사망 시 10/-10 속도의 초저속 미니체 2체 분열 확인
│   ├── Shielded: 3HP 실드 흡수 및 실드 재생 주기 확인
│   └── Boss: Wave 5 대형 기체 출현, HP 스케일링, 사망 시 화면 흔들림/150 파티클 검증
└── Step 4: Stress & Performance Telemetry Capture
    ├── FPS 안정성 (300+ FPS 지속 여부)
    ├── 엔티티 배열(bullets, particles, enemies) 메모리 누수 및 클린업 검증
    └── DevTools take_screenshot을 통한 시각적 증거 저장
`
