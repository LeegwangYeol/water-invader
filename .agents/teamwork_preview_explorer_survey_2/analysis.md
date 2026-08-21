# Water Invader 게임 엔진 아키텍처 및 상태 관리 심층 분석 보고서

## 1. 개요 및 분석 요약 (Executive Summary)

Water Invader는 Next.js 16(App Router) 및 React 19 기반의 단일 페이지 2D 슈팅 게임입니다. 그래픽 렌더링은 WebGL이나 Three.js 대신 순수 HTML5 2D Canvas(`CanvasRenderingContext2D`)의 절차적 벡터 그래픽을 사용하며, UI 및 모달은 Canvas 상단에 오버레이된 React DOM 컴포넌트로 구성된 하이브리드 아키텍처를 채택하고 있습니다.

게임 루프는 브라우저의 `requestAnimationFrame`과 실시간 가변 델타 타임(`deltaTime = (timestamp - lastTime) / 1000`) 방식을 사용하며, 프레임 드랍으로 인한 물리 관통을 방지하기 위해 `Math.min(deltaTime, 0.1)` 클램핑 처리가 적용되어 있습니다.

모든 핵심 게임 상태(플레이어 위치/체력, 활성 적군 목록, 탄환, 엄폐물, 아군 헬퍼, 파티클, 점수/웨이브/콤보)는 `GameManager` 인스턴스에 일원화되어 있으며, React 컴포넌트 마운트 시 `(window as any).gameManager`로 글로벌 노출되어 Playwright 및 헤드리스 자동화 테스트 봇이 100% 실시간으로 상태를 관측하고 직접 제어할 수 있는 완벽한 테스트 인터페이스가 확보되어 있습니다.

---

## 2. 코드 및 시스템 트리 구조 (Code & System Tree Structures)

### 2.1 파일 및 모듈 아키텍처 트리 (File & Module Tree Structure)
```tree
C:\src\SpaceInvader\
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css                # Tailwind CSS v4 스타일링
│   │   ├── layout.tsx                 # RootLayout (Next.js App Router 메타데이터 및 폰트)
│   │   ├── manifest.ts                # PWA 매니페스트 설정
│   │   └── page.tsx                   # 메인 Server Component (Header + GameCanvas 래퍼)
│   ├── components/
│   │   └── game-canvas.tsx            # Client Component ('use client', Canvas + DOM HUD/모달 오버레이)
│   └── game/
│       ├── Barricade.ts               # 엄폐물 엔티티 (파괴형 얼음 20HP 복셀, 비파괴형 돌)
│       ├── Bullet.ts                  # 플레이어/적 탄환 엔티티 (속도, 관통, 데미지, 궤적)
│       ├── Enemy.ts                   # 7종 적군 엔티티 (NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER)
│       ├── Entity.ts                  # 추상 기본 엔티티 (AABB 충돌 판정, 위치, 크기, 속도)
│       ├── GameManager.ts             # 게임 엔진 코어 (RAF 루프, 물리 업데이트, 스폰, 충돌 검사, 오디오/UI 연동)
│       ├── Helper.ts                  # 아군 지원기 엔티티 (FIGHTER, REPAIRER, TANK)
│       ├── Particle.ts                # 파티클 이펙트 엔티티 (폭발, 중력/마찰 물리)
│       ├── SoundManager.ts            # Web Audio API 절차적 사운드 생성 싱글톤
│       └── types.ts                   # GameState enum (MENU, PLAYING, GAME_OVER), Vector2D, Rect, Size 인터페이스
└── tests/
    ├── 01_ui_and_controls.spec.ts     # UI 및 키보드 조작 테스트
    ├── 02_rendering_and_vector_art.spec.ts # Canvas 벡터 렌더링 검증
    ├── 03_game_mechanics.spec.ts      # 충돌/치트/스킬 게임 메커니즘 테스트
    ├── 04_multiwave_progression.spec.ts # 웨이브 진행 및 보스전 테스트
    └── water-invader.spec.ts          # E2E 마스터 라이프사이클 테스트
```

### 2.2 컴포넌트 및 렌더링 계층 트리 (Component & Rendering Tree Structure)
```tree
[RootLayout] (src/app/layout.tsx - Server Component)
  │
  └── [Home Page] (src/app/page.tsx - Server Component)
        │
        └── [GameCanvas] (src/components/game-canvas.tsx - Client Component)
              │
              ├── [Top HUD Layer] (DOM - pointer-events: none)
              │     ├── Score Text ("점수: {score}")
              │     ├── Currency Text ("정수된 물: {currency} 💧")
              │     ├── Wave Indicator ("WAVE {wave}")
              │     ├── HP Indicator (5개의 원형 생명력 도트)
              │     ├── Combo Notification ("{combo}x COMBO!")
              │     └── Ultimate Gauge Bar (0~100% 게이지 시각화)
              │
              ├── [HTML5 Canvas Layer] (600x800 px)
              │     └── [GameManager Canvas 2D Rendering Engine]
              │           ├── Background: Dark slate (#0f172a) + 동적 기포(Bubbles) 애니메이션
              │           ├── Screen Shake: Translation offset (충격/경고 시 진동)
              │           ├── Barricades: 4개 엄폐물 (복셀 블록 파괴 렌더링)
              │           ├── Player: 물방울 벡터 드로잉 (스트레스/제압/저체력 상태 시각화)
              │           ├── Helpers: 아군 드로잉 (FIGHTER, REPAIRER, TANK)
              │           ├── Enemies: 7종 적군 절차적 벡터 렌더링
              │           ├── Bullets: 플레이어 물방울 탄환 / 적 발광 오브 탄환
              │           ├── Particles: 수십~수백 개 폭발 파티클
              │           └── Debug Overlay (F3 활성화 시): AABB 히트박스(Magenta) + FPS/수치 콘솔
              │
              ├── [Mobile Touch Controls Layer] (DOM - PLAYING 상태 시)
              │     ├── ALLY(Q) Button (아군 소환)
              │     ├── ULT(E) Button (필살기 발동)
              │     └── FIRE! Button (스페이스바 사격)
              │
              └── [Overlay Modal Layer] (DOM - z-index: 20~30)
                    ├── Menu Overlay (GameState.MENU) -> [START GAME], [HOW TO PLAY], [INSTALL APP]
                    ├── How To Play Modal (`showManual: true`) -> 조작키, 규칙, 치트키 안내
                    └── Game Over Overlay (GameState.GAME_OVER) -> 최종 점수, 업그레이드 상점, [PLAY AGAIN]
```

### 2.3 게임 상태 라이프사이클 및 루프 흐름 트리 (Game State Lifecycle & Loop Execution Flow)
```tree
[Application Mount]
  │
  ├── 1. `new GameManager(canvas)` 인스턴스 생성
  ├── 2. `(window as any).gameManager = game` 바인딩 (자동화 테스트용)
  ├── 3. UI 콜백 등록 (`onStateChange`, `onScoreChange`, `onPlayerHpChange`)
  └── 4. 키보드 이벤트 리스너 등록 (`keydown`, `keyup`)
        │
[User Action: START GAME]
  │
  ├── `gameManager.init()` -> 엔티티 리셋, 플레이어 위치/스펙 초기화, 엄폐물 4개 스폰, Wave 1 적군 그리드 스폰
  └── `gameManager.startGame()` -> AudioContext 활성화, `state = GameState.PLAYING`, `requestAnimationFrame(loop)` 시작
        │
[Game Loop Frame Cycle (60~144Hz)]
  ├── 1. Delta Time 계산: `deltaTime = (timestamp - lastTime) / 1000`
  ├── 2. Delta Clamping: `clampedDelta = Math.min(deltaTime, 0.1)`
  ├── 3. FPS 카운터 누적 갱신
  │
  ├── 4. Physics & State Update (`update(clampedDelta)`)
  │     ├── [Player Update]: 좌우 이동 (speed: 300), 발사 타이머, 스트레스/제압 게이지 감쇄, 사격 생성
  │     ├── [Combo Update]: 2초 타이머 초과 시 콤보 리셋
  │     ├── [Reinforcement Timer]: 10~20초 주기 아군/적군 증원 경고 및 스폰
  │     ├── [Enemy Update]:
  │     │     ├── 속도 배수 계산 (`speedMultiplier = 1.0 + (20 - enemies.length)*0.1`)
  │     │     ├── 적군 이동 (좌우 왕복, 하강, ZIGZAG 파동, DIVER 급강하, 회피 기동)
  │     │     ├── 적군 사격 생성 (SNIPER 조준탄, 일반탄, 보스탄)
  │     │     └── 방어선 침투 판정: Y좌표가 바닥 도달 시 플레이어 HP 1 감소 & 스트레스 +20
  │     ├── [Helper Update]: 이동, 자동 사격(FIGHTER), 엄폐물 수리(REPAIRER), 이동식 방패(TANK)
  │     ├── [Barricade Update]: HP 비율에 따른 복셀 블록 파괴 갱신
  │     ├── [Bullet Update]: 위치 이동 (`x += vx * dt`, `y += vy * dt`)
  │     │
  │     ├── [Collision Detection (`checkCollisions()`)]:
  │     │     ├── Bullet vs Barricade: 탄환 소멸, 파괴형 엄폐물 HP 감소
  │     │     ├── Player Bullet vs Enemy: 관통력 차감, 적 HP 감소, 사망 시 분열/폭발/처치 점수/콤보 처리
  │     │     ├── Enemy Bullet vs Helper: 아군 헬퍼 HP 감소
  │     │     ├── Enemy Bullet vs Player: 탄환 소멸, 플레이어 HP 감소 (0 이하 시 Game Over)
  │     │     ├── Bullet Near Miss: 플레이어 근접 스침 판정 시 스트레스/제압 수치 증가
  │     │     └── Enemy vs Barricade: DIVER 자폭 충돌, 일반 적 엄폐물 갉아먹기(Gnawing)
  │     │
  │     ├── [Dead Entity Cleanup]: `filter(e => !e.isDead)` (적, 아군, 탄환, 파티클, 엄폐물)
  │     │
  │     └── [Wave Completion Check]:
  │           └── `enemies.length === 0`: 3초 휴식 타이머 (`waveRestTimer = 3.0`) -> Wave 번호 증가 (`level++`) -> `spawnWave()`
  │
  ├── 5. Rendering (`draw()`)
  │     ├── Canvas Clear -> 배경 거품 렌더링 -> 화면 흔들림(Screen Shake) 변환
  │     ├── Barricades -> Player -> Helpers -> Enemies -> Bullets -> Particles 렌더링
  │     ├── Debug Overlay (F3 활성화 시 히트박스 및 메트릭 출력)
  │     └── Wave Clear / Reinforcement Warning 텍스트 오버레이 렌더링
  │
  └── 6. Next Frame Request: `requestAnimationFrame(loop)`
        │
[Terminal State: GAME OVER]
  ├── 플레이어 HP 0 이하 도달
  ├── `gameOver(reason)` 호출 -> 최고 점수 `localStorage` 저장
  ├── `state = GameState.GAME_OVER` 변경 -> `onStateChange` 콜백 호출
  └── Game Over 모달 활성화 (최종 점수 표시, 업그레이드 상점, 재시작 버튼 노출)
```

### 2.4 입력 이벤트 라우팅 트리 (Input Event Routing Tree)
```tree
[Window Keyboard Event] / [Virtual Touch Pointer Event]
  │
  ├── Keyboard: 'ArrowLeft' / 'a' ───────> `player.isMovingLeft = true/false`
  ├── Keyboard: 'ArrowRight' / 'd' ──────> `player.isMovingRight = true/false`
  ├── Keyboard: ' ' / 'Spacebar' ────────> `player.isShooting = true/false`
  ├── Keyboard: 'e' / 'Shift' ───────────> `triggerUltimate()` (필살기: 30발 비 폭격)
  ├── Keyboard: 'q' ─────────────────────> `triggerSummonAlly()` (순수 물 50 차감 후 아군 소환)
  │
  └── Developer Cheat Hotkeys:
        ├── 'F3' ────────────────────────> `isDebugMode = !isDebugMode` (히트박스 및 FPS 오버레이)
        ├── 'F4' ────────────────────────> `isGodMode = !isGodMode` (무적 모드 토글)
        └── 'F5' ────────────────────────> `currency += 1000` (순수 물 1000 획득)
```

### 2.5 자동화 테스트 봇 상태 관측 트리 (Automated Bot Observation Tree)
```tree
[Playwright / Headless Test Runner] (`page.evaluate(...)`)
  │
  └── `window.gameManager` (Global Direct Hook)
        ├── [.state] ────────────────────> 'MENU' | 'PLAYING' | 'GAME_OVER'
        ├── [.level] ────────────────────> 현재 웨이브 번호 (1, 2, 3...)
        ├── [.score] ────────────────────> 현재 누적 점수
        ├── [.currency] ─────────────────> 보유 중인 순수 물 (💧)
        ├── [.combo] ────────────────────> 현재 연속 처치 콤보
        ├── [.gameOverReason] ───────────> 게임 오버 원인 메시지 (사인 분석)
        ├── [.isResting] ────────────────> 웨이브 클리어 후 휴식 상태 여부
        ├── [.waveRestTimer] ────────────> 다음 웨이브까지 남은 시간
        │
        ├── [.player] ───────────────────> 플레이어 객체
        │     ├── .position { x, y } ────> 현재 X, Y 좌표 (피격 회피 판정 기준)
        │     ├── .hp / .maxHp ──────────> 현재 체력 (기본 3, 최대 5)
        │     ├── .ultimateGauge ────────> 필살기 게이지 (0~100)
        │     ├── .suppressionLevel ─────> 사격 정확도 페널티 게이지 (0~100)
        │     └── .stressLevel ──────────> 사격 속도 부스트/공황 게이지 (0~100)
        │
        ├── [.enemies] (Array) ──────────> 실시간 활성 적군 목록
        │     └── each Enemy:
        │           ├── .position { x, y } (탄환 조준 목표 좌표)
        │           ├── .size { width, height }
        │           ├── .type (0: NORMAL, 1: ZIGZAG, 2: BOSS, 3: SNIPER, 4: DIVER, 5: SHIELDED, 6: SPLITTER)
        │           ├── .hp / .shieldHp (적 체력 및 보호막 수치)
        │           ├── .speedX / .speedY (이동 벡터)
        │           └── .isDiving (급강하 상태 여부)
        │
        ├── [.bullets] (Array) ──────────> 실시간 탄환 목록
        │     └── each Bullet:
        │           ├── .position { x, y } (위협 탄환 회피 계산 좌표)
        │           ├── .velocity { x, y } (탄환 이동 궤적 예측)
        │           ├── .damage / .piercing
        │           └── .isPlayerBullet (적 탄환 vs 아군 탄환 구분)
        │
        ├── [.barricades] (Array) ───────> 4개 엄폐물 (위치, HP, 파괴 상태)
        └── [.helpers] (Array) ──────────> 소환된 아군 헬퍼 목록
```

---

## 3. 세부 항목별 조사 분석 결과

### 3.1 애플리케이션 아키텍처 (Application Architecture)
1. **Next.js & React 계층 구조**:
   - `src/app/page.tsx`: Next.js 16 App Router 기반의 Server Component로, 정적 뼈대(Header 안내문구) 및 메인 게임 컨테이너를 렌더링합니다.
   - `src/components/game-canvas.tsx`: `'use client'` 지시문이 적용된 Client Component로, 브라우저 Canvas 및 React UI 상태를 관리합니다.
2. **렌더링 방식**:
   - **게임 본체**: 순수 HTML5 Canvas 2D (`CanvasRenderingContext2D`, 600x800 픽셀). WebGL이나 Three.js 등의 3D 라이브러리는 사용하지 않으며, 모든 그래픽(플레이어, 7종 적군, 탄환, 파티클, 엄폐물)은 수학적 베지어 곡선(`bezierCurveTo`), 원호(`arc`), 방사형 그래디언트(`createRadialGradient`)를 활용한 절차적 벡터 렌더링으로 구현되어 있습니다.
   - **UI 오버레이**: Canvas 위에 절대 위치(`absolute`)로 배치된 Tailwind CSS React DOM 요소입니다. 점수, 체력 하트, 콤보 뱃지, 궁극기 바, 터치 조작 버튼, 시작/종료 모달이 완벽하게 분리되어 있습니다.

### 3.2 게임 루프 및 델타 타임 처리 (Game Loop & Delta Time)
1. **루프 구동 메커니즘**:
   - `GameManager.ts`의 `loop` 메서드가 `requestAnimationFrame(this.loop)`을 통해 브라우저 화면 주사율에 맞춰 실행됩니다.
   - `performance.now()`를 통해 이전 프레임과의 시간 차이(`deltaTime = (timestamp - this.lastTime) / 1000`)를 초 단위로 계산합니다.
2. **델타 타임 스케일링 vs 프레임 종속성 분석**:
   - **물리 및 이동**: 대부분의 주요 엔티티 이동(`position.x += speed * deltaTime`, `position.y += speedY * deltaTime`), 쿨다운 타이머(`fireTimer -= deltaTime`), 수명(`lifespan -= deltaTime`)은 델타 타임에 비례하여 계산되므로 60Hz/120Hz/144Hz 모니터 주사율 차이에 크게 구애받지 않고 일관된 속도를 유지합니다.
   - **안정성 클램핑**: 탭 전환이나 일시적 지연으로 `deltaTime`이 비정상적으로 커져 충돌 판정을 건너뛰는 터널링 현상을 막기 위해 `this.update(Math.min(deltaTime, 0.1))`로 최대 0.1초(100ms) 클램프가 적용되어 있습니다.
   - **잠재적 프레임 종속 요소 (Quirks)**:
     - `Enemy.ts` 120번 라인: ZIGZAG 적의 사인파 이동 `this.position.x += Math.sin(Date.now() / 200) * 5 * speedMultiplier;` 코드는 `deltaTime`이 곱해지지 않아 고주사율 환경에서 프레임당 가산 횟수가 늘어날 수 있습니다.
     - `GameManager.ts` 464번 라인: 적이 엄폐물을 갉아먹는 대미지 `barricade.hp -= 0.1;` 역시 프레임당 고정 차감으로 되어 있습니다.

### 3.3 상태 관리 (State Management)
1. **단일 진실 공급원 (Single Source of Truth)**:
   - 모든 게임 내 물리/엔티티 상태는 `GameManager` 인스턴스에 보관됩니다.
   - `player`: 위치(`position.x, y`), 체력(`hp: 3`, `maxHp: 5`), 이동/사격 상태, 업그레이드 수치(사격속도, 멀티샷, 관통력), 스트레스/제압 수치.
   - `enemies`: 7종의 적군 객체 배열 (`EnemyType.NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER`).
   - `bullets`: 플레이어 및 적군의 모든 활성 탄환 배열.
   - `barricades`: 4개의 엄폐물 (1번/4번: 20HP 파괴 가능 복셀, 2번/3번: 무적 돌).
   - `helpers`: 지원 소환된 아군 헬퍼 배열 (`FIGHTER, REPAIRER, TANK`).
   - `score`, `currency`, `combo`, `level`(Wave).
2. **게임 상태 열거형 (`GameState`)**:
   - `GameState.MENU`: 게임 시작 전 대기 화면.
   - `GameState.PLAYING`: 인게임 플레이 상태 (적 스폰, 전투 루프 진행).
   - `GameState.GAME_OVER`: 플레이어 체력 소진 시 전환.
   - *(참고)* `GameState.VICTORY`는 별도로 존재하지 않으며, Water Invader는 5웨이브마다 보스가 등장하며 무한히 난이도가 상승하는 무한 웨이브(Endless Wave) 구조를 가집니다.
3. **React UI 동기화 메커니즘**:
   - React 컴포넌트(`game-canvas.tsx`)의 상태는 `GameManager`의 콜백 함수(`onStateChange`, `onScoreChange`, `onPlayerHpChange`)를 통해 단방향으로 전달되어 렌더링을 갱신합니다.

### 3.4 입력 처리 (Input Handling)
1. **이벤트 리스너 등록**:
   - `game-canvas.tsx`의 `useEffect`에서 `window.addEventListener('keydown', ...)` 및 `keyup`을 등록하여 `GameManager.handleKeyDown()` / `handleKeyUp()`으로 전달합니다.
2. **지원 입력 매핑**:
   - 이동: `ArrowLeft` / `a`, `ArrowRight` / `d`
   - 사격: `Space` / `Spacebar` (누르고 있는 동안 지속 사격)
   - 특수 기술: `e` / `Shift` (필살기: Heavy Rain), `q` (아군 소환: ALLY)
   - 치트키: `F3` (디버그 히트박스/FPS), `F4` (무적 모드), `F5` (+1000 물)
3. **모바일 및 터치**:
   - React DOM 버튼의 `onPointerDown`, `onPointerUp`, `onPointerLeave`를 통해 터치 스크린에서도 키보드와 동일한 명령을 전달합니다.
4. **일시정지/재시작**:
   - HOW TO PLAY 모달 오픈 시 키보드 입력이 차단됩니다.
   - 게임 오버 시 [PLAY AGAIN] 클릭 시 `gameManager.init()` 후 `startGame()`을 호출하여 상태를 완벽히 리셋합니다.

### 3.5 자동화 테스트 봇(Playwright/Headless)을 위한 상태 노출 및 관측 지점
1. **글로벌 인스턴스 노출 (`window.gameManager`)**:
   - `src/components/game-canvas.tsx` 85번 라인에 `(window as any).gameManager = game;`이 명시적으로 작성되어 있습니다.
   - Playwright 스크립트는 `page.evaluate()`를 통해 실시간으로 모든 내부 상태에 0ms 지연으로 직접 접근할 수 있습니다.
2. **테스트 봇이 활용 가능한 핵심 텔레메트리 데이터**:
   - **플레이어 위치 및 위험도 분석**: `window.gameManager.player.position.x`, `window.gameManager.player.hp`
   - **적군 타겟팅**: `window.gameManager.enemies` 배열 순회 -> 가장 낮은 Y좌표(플레이어와 가장 가까운 적) 또는 고위험 적(SNIPER, DIVER) 위치 추출
   - **적 탄환 회피 계산**: `window.gameManager.bullets.filter(b => !b.isPlayerBullet)` -> 플레이어 X좌표와 탄환 X좌표, 속도(`velocity.y`, `velocity.x`)를 기반으로 좌/우 회피 방향 결정
   - **게임 종료 및 통계 수집**:
     - 게임 오버 여부: `window.gameManager.state === 'GAME_OVER'`
     - 사인(Cause of Death): `window.gameManager.gameOverReason`
     - 생존 웨이브 및 점수: `window.gameManager.level`, `window.gameManager.score`
3. **DOM 기반 관측 지점**:
   - `page.locator('h1', { hasText: 'GAME OVER' })`: 게임 오버 화면 즉시 감지
   - `page.locator('p', { hasText: /WAVE/ })`: 현재 웨이브 HUD
   - `page.locator('button', { hasText: 'START GAME' })`, `page.locator('button', { hasText: 'PLAY AGAIN' })`: 자동 재시작 클릭

---

## 4. 결론 및 자동화 봇(M1) / 리밸런싱(M2) 연계 권고사항

1. **자동화 봇(Playwright Harness) 구현 방안**:
   - `window.gameManager`를 폴링(예: 매 50~100ms 간격의 `page.evaluate`)하여 적 탄환 좌표를 읽어 회피 키(`ArrowLeft`/`ArrowRight`)를 누르고, 적군 X좌표에 맞춰 사격(`Space`)을 트리거하는 휴리스틱 봇을 손쉽게 구축할 수 있습니다.
   - 사망 시 `window.gameManager.gameOverReason`, `window.gameManager.level`, `window.gameManager.score`, `survivalTime`을 JSON 텔레메트리로 기록하여 10+회 기준선(Baseline) 데이터를 수집할 수 있습니다.
2. **리밸런싱 관점의 핵심 파라미터 위치 확인**:
   - `Player.ts`: 기본 체력(`hp: 3`, `maxHp: 5`), 이동 속도(`speed: 300`), 기본 연사력(`baseFireRate: 0.5`), 제압/스트레스 패널티 수치
   - `Enemy.ts`: 적 체력 계산식(`1 + Math.floor(level / 3)`), 이동 속도(`speedX`, `speedY`), 발사 주기(`fireTimer`), DIVER 급강하 가속도(기본의 6배)
   - `GameManager.ts`: 웨이브별 적군 행/열 계산식(`rows = 3 + floor(level/4)`, `cols = 6 + floor(level/3)`), 특수 적군 등장 확률, 증원 주기, 방어선 침투 시 체력 차감 로직
