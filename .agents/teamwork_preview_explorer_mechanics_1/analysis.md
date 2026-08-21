# SpaceInvader (Water Invader) 게임 물리 및 메커니즘 정밀 분석 보고서 (analysis.md)

- **작성 에이전트**: `teamwork_preview_explorer_mechanics_1` (Explorer Subagent)
- **작성 일시**: 2026-08-21T08:06:00Z
- **조사 대상 디렉터리**: `C:\src\SpaceInvader\src\`
- **배포 라이브 URL**: https://water-invader.vercel.app/

---

## 1. 전체 시스템 아키텍처 및 메커니즘 구조 트리 (Architecture Tree)

```text
Water Invader Core Mechanics & Engine Architecture
├── [Game Loop & State] (GameManager.ts)
│   ├── loop(timestamp) -> requestAnimationFrame (60 FPS 목표, delta clamp 0.1s)
│   ├── state transitions: MENU -> PLAYING -> GAME_OVER
│   ├── Wave Management: 3초 Wave Clear Rest -> spawnWave() (매 5웨이브 보스전)
│   └── Reinforcement System: 10~20초 주기 (적 증원 40% / 아군 지원 60%)
├── [Entity Hierarchy] (Entity.ts)
│   ├── Player (Player.ts): 물방울 캐릭터, 가변 연사/탄퍼짐, 상태이상, 궁극기
│   ├── Enemy (Enemy.ts): 7종 적 타입 (NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER)
│   ├── Bullet (Bullet.ts): 플레이어/아군 투사체 vs 적 투사체
│   ├── Barricade (Barricade.ts): 복셀 파괴형 얼음 방벽 vs 무적 돌 방벽
│   ├── Helper (Helper.ts): FIGHTER, REPAIRER, TANK
│   └── Particle (Particle.ts): 중력/마찰력 적용 물리 파티클
├── [Physics & Collision Detection Flow] (GameManager.ts: checkCollisions)
│   ├── Bullet vs Barricade: 방벽 피격 파괴 및 총알 소멸
│   ├── Player Bullet vs Enemy: 적 피격, 관통력 감소, 적 처치 및 분열/폭발
│   ├── Enemy Bullet vs Helper: 아군 헬퍼 방어/피격
│   ├── Enemy Bullet vs Player: 플레이어 피격 (스트레스/제압 상승, 체력 감소)
│   ├── Enemy Bullet Near-Miss: 플레이어 억압(Suppression) 수치 상승
│   ├── Enemy vs Barricade: Diver 충돌 자폭 vs 일반 적 갉아먹기(Gnawing)
│   └── [GAP] Bullet vs Bullet: 미구현 (탄환 요격 로직 부재)
└── [Audio Engine] (SoundManager.ts)
    └── Web Audio API Oscillator (Shoot: Square, Explosion: Sawtooth, PowerUp: Sine)
```

---

## 2. 세부 메커니즘 정밀 검증 결과

### 2.1. 바리케이드 상호작용 및 적 감속 (Barricade Interaction & Slow Down)

#### [코드 트리 구조]
```text
Barricade Collision & Speed Flow
├── GameManager.ts: update()
│   └── enemy.update(deltaTime, speedMultiplier, bullets, playerPos)
│       └── Enemy.ts:75-125
│           ├── currentSpeedX = speedX * speedMultiplier
│           ├── currentSpeedY = speedY * speedMultiplier
│           └── position 갱신 (바리케이드 인자 미전달 및 속도 감속 없음)
└── GameManager.ts: checkCollisions()
    └── GameManager.ts:448-469
        ├── enemy.isGnawing = false (루프 시작 시 초기화)
        └── enemy.checkCollision(barricade) == true
            ├── Diver: 즉시 자폭 (enemy.isDead = true, barricade.hp -= 20)
            └── Non-Diver: enemy.isGnawing = true, barricade.hp -= 0.1 (매 프레임)
```

#### [상세 분석 및 발견 사항]
1. **코드 위치**:
   - `src/game/Enemy.ts:19`: `public isGnawing: boolean = false;` 선언됨.
   - `src/game/Enemy.ts:74-139`: `update()` 메서드 내에서 `isGnawing`을 참조하거나 속도(`speedX`, `speedY`)를 줄이는 코드가 전혀 없음.
   - `src/game/GameManager.ts:448-469`: 바리케이드 충돌 시 `enemy.isGnawing = true;`, `barricade.hp -= 0.1;`만 수행됨.
2. **결론 (Finding)**:
   - **적의 바리케이드 중첩 시 감속(Slow Down) 로직은 현재 코드베이스에 구현되어 있지 않습니다.**
   - 적은 바리케이드와 겹쳐 있어도 원래 속도대로 관통하며 이동하며, 단지 매 프레임당 파괴 가능 방벽의 체력을 0.1씩 깎아먹기만 합니다.

---

### 2.2. 강하병(Diver) 적 동작 메커니즘

#### [코드 트리 구조]
```text
Diver Behavior Flow
├── Initialization (Enemy.ts:56-58)
│   ├── type = EnemyType.DIVER
│   ├── color = '#ef4444' (Red)
│   └── speedX = 50 + level * 8
├── Diving Trigger & Movement (Enemy.ts:78-89)
│   ├── 조건: |(enemy.x + w/2) - (player.x + 25)| < 20 (플레이어가 직하방에 위치)
│   ├── 상태: isDiving = true
│   └── 급강하: position.y += currentSpeedY * 15 * deltaTime (15배속 수직 낙하)
├── Firing Suspension (Enemy.ts:142)
│   └── if (this.isDiving) return null (강하 중 사격 중단)
├── Barricade Impact (GameManager.ts:455-460)
│   ├── enemy.isDead = true (충돌 시 즉시 자폭 및 사망)
│   ├── if (destructible) barricade.hp -= 20 (충돌 대미지 20 부여)
│   └── createExplosion(enemy.x, enemy.y, '#ef4444', 30) (적색 파티클 30개 폭발)
└── Visual Render (Enemy.ts:232-245)
    ├── Teardrop / Rocket 곡선 외형 (Bezier Curves)
    └── 후방 요동치는 엔진 화염 (Yellow Flame, Math.random() 애니메이션)
```

#### [상세 분석 및 발견 사항]
1. **코드 위치**:
   - `src/game/Enemy.ts:78-89, 142, 232-245`
   - `src/game/GameManager.ts:455-460`
2. **결론 (Finding)**:
   - **요구사항 100% 일치 구현 확인**.
   - Diver는 플레이어의 X좌표(±20px 이내) 직상방에 도달하면 `isDiving = true`가 되며 기본 Y속도의 15배로 급강하합니다.
   - 바리케이드와 충돌하면 갉아먹는 대신 즉시 자폭(`enemy.isDead = true`)하며, 파괴 가능 방벽에 20의 막대한 충돌 피해를 입히고 붉은 파티클 30개 폭발을 발생시킵니다.

---

### 2.3. 분열충(Splitter) 적 동작 메커니즘

#### [코드 트리 구조]
```text
Splitter Enemy & Death Splitting Flow
├── Parent Splitter Stats (Enemy.ts:62-64)
│   ├── type = EnemyType.SPLITTER
│   ├── color = '#22c55e' (Green)
│   ├── size = { width: 50, height: 40 } (일반 적 40x30보다 큼)
│   ├── speedX = 50 (기본 속도, 레벨 보너스 속도 없음)
│   └── speedY = 10
├── Visual Representation (Enemy.ts:256-266)
│   └── 중첩된 2개의 독성 방울 (Two overlapping toxic bubbles with eyes)
└── Death Splitting Mechanic (GameManager.ts:377-386)
    ├── Trigger: enemy.hp <= 0 && enemy.type === EnemyType.SPLITTER
    ├── Mini 1 Spawn:
    │   ├── Pos: (x - 15, y)
    │   ├── Type: EnemyType.NORMAL
    │   ├── Size: { width: 20, height: 20 }
    │   └── Speed: speedX = 10, speedY = 5 (초저속)
    └── Mini 2 Spawn:
        ├── Pos: (x + 35, y)
        ├── Type: EnemyType.NORMAL
        ├── Size: { width: 20, height: 20 }
        └── Speed: speedX = -10, speedY = 5 (반대 방향 초저속)
```

#### [상세 분석 및 발견 사항]
1. **코드 위치**:
   - `src/game/Enemy.ts:62-64, 256-266`
   - `src/game/GameManager.ts:377-386`
2. **결론 (Finding)**:
   - **요구사항 100% 일치 구현 확인**.
   - Splitter는 기본 속도 `speedX: 50, speedY: 10`으로 천천히 이동합니다 (일반 적이 레벨당 +5 속도를 받는 것과 달리 기본 속도 고정).
   - 플레이어 탄환에 의해 사망 시, 좌우로 `mini1`(speedX: 10, speedY: 5), `mini2`(speedX: -10, speedY: 5)의 초저속 소형(20x20) 미니 적 2체로 분열합니다.

---

### 2.4. 투사체 충돌 및 요격 (Projectile Collision & Interception)

#### [코드 트리 구조]
```text
Projectile & Collision Flow
├── Sniper Bullet Creation (Enemy.ts:153-162)
│   ├── isInterceptable = true
│   ├── dx, dy 계산하여 플레이어 조준 각도 산출 (Math.atan2)
│   └── speed = 400 (velocity.x = cos(θ)*400, velocity.y = sin(θ)*400)
├── Bullet Entity Property (Bullet.ts:7, 34)
│   ├── public isInterceptable: boolean = false
│   └── [BUG] Line 34: if (this.isInterceptable) { ctx.fillStyle = "#a855f7"; }
│       └── isPlayerBullet 블록 내부에 있어 적 저격 총알에는 도달 불가
└── Collision Evaluation Loop (GameManager.ts:329-447)
    ├── 1. bullet.checkCollision(barricade) -> 방벽 피격
    ├── 2. if (bullet.isPlayerBullet)
    │       └── bullet.checkCollision(enemy) -> 적 피격
    └── 3. else (Enemy Bullet)
            ├── bullet.checkCollision(helper) -> 아군 피격
            ├── bullet.checkCollision(player) -> 플레이어 피격
            └── Near Miss Check -> 플레이어 억압 상승
    └── [MISSING] playerBullet.checkCollision(enemyBullet) -> 요격 로직 부재!
```

#### [상세 분석 및 발견 사항]
1. **코드 위치**:
   - `src/game/Enemy.ts:153-162`: 저격수 총알 생성 시 `b.isInterceptable = true;` 설정.
   - `src/game/Bullet.ts:7, 34`: 프로퍼티 정의 및 렌더링.
   - `src/game/GameManager.ts:329-447`: `checkCollisions()` 내부 충돌 판정.
2. **결론 (Finding - 결함 확인)**:
   - **플레이어 물방울 총알로 저격수 총알/적 투사체를 요격(Intercept)하는 기능은 현재 작동하지 않습니다.**
   - 원인:
     1. `GameManager.ts:checkCollisions()`에 플레이어 총알과 적 총알(또는 `isInterceptable` 총알) 간의 충돌 판정 루프(`playerBullet.checkCollision(enemyBullet)`)가 아예 존재하지 않습니다.
     2. `Bullet.ts:34`의 보라색 렌더링 분기도 `if (this.isPlayerBullet)` 내부 조건문 안에 잘못 들어가 있어 실제 적 저격수 총알은 보라색 대신 일반 적 화염구(Red)로 렌더링됩니다.

---

### 2.5. 기타 핵심 시스템 (아군 소환, 보스전, 플레이어 스탯 등)

#### 1) 아군 소환(Ally Spawning) 시스템
- **수동 호출 (`triggerSummonAlly`, GameManager.ts:611-620)**:
  - 단축키 `Q` 또는 화면의 `ALLY(Q)` 버튼 클릭.
  - 정수된 물(Pure Water) 50개 소모 (`currency >= 50`).
  - `pendingReinforcement = 'ALLY'`, 경고 타이머 2.0초 및 화면 진동 발동.
- **자동 타이머 증원 (GameManager.ts:220-230)**:
  - 10~20초 주기마다 50% 확률로 증원 경고 발생.
  - 60% 확률로 아군(ALLY), 40% 확률로 적 급습(ENEMY, Zigzag 4기).
- **아군 유닛 3종 (`src/game/Helper.ts`)**:
  - `FIGHTER` (초록색, HP 3, 0.5초마다 상방향 탄환 발사 speed -500).
  - `REPAIRER` (노란색, HP 1, 무적/수명 8초, 20% 확률로 파괴된 방벽 복셀 1블록 복구 및 HP +5).
  - `TANK` (보라색, HP 15, 수명 20초, 중앙 sine wave 순찰하며 적 탄환 몸빵).

#### 2) 보스전 메커니즘 (Boss Phase)
- **등장 조건 (`GameManager.ts:119`)**: `this.level % 5 === 0` (5, 10, 15... 웨이브).
- **스펙 (`src/game/Enemy.ts:46-52, 189-216`)**:
  - 크기: `150 x 100` (일반 적 40x30 대비 거대).
  - 체력: `level * 10` (Wave 5 = 50 HP, Wave 10 = 100 HP).
  - 사격 쿨다운: 0.5~3.5초 (일반 적 2~5초보다 훨씬 빠름), 탄속 300.
  - 외형: 붉은 기계/해골 형태, 붉은 눈망울, 이빨 그릴.
  - 사망 연출: 골드 파티클 150개 대폭발, 1.5초 화면 강진동.

#### 3) 플레이어 상태이상 및 시각적 반응
- **Stress(흥분/아드레날린)**:
  - 증가 요인: 피격(+40), 적 돌파 허용(+20), 적 충돌(+40), 적 처치(+10), 아슬아슬한 스침(+5).
  - 효과: 초당 10씩 감소. 스트레스 수치에 따라 연사속도 최대 3배 증가 (`baseFireRate / (1 + stress/50)`).
  - 시각 효과: 50 초과 시 붉은 발광, 화난 눈(`>_<`).
- **Suppression(제압/공황)**:
  - 증가 요인: 적 총알 근접 통과(+15), 피격(+20).
  - 효과: 초당 15씩 감소. 탄환 수평 퍼짐 최대 `±150` 발생.
  - 시각 효과: 50 초과 시 회색 발광, 캐릭터 흔들림(Jitter), 어지러운 눈(`@_@`).
- **체력 손상 시각 효과**:
  - HP <= 2: 우측 상단 반창고 부착.
  - HP <= 1: 몸통 좌하단 깊은 붉은 균열 표시.

#### 4) 궁극기: 폭우 (Heavy Rain, `triggerUltimate`)
- 게이지: 적 처치 1회당 +1.5% 충전 (약 67마리 처치 시 100%).
- 발동: `E` 키, `Shift` 키 또는 모바일 `ULT` 버튼.
- 효과: 화면 상단(`y = -20`)에서 관통력 3, 공격력 10, 탄속 300의 대형 물방울 탄환 30발이 아래로 쏟아짐. 1.0초 화면 진동.

#### 5) 방벽 복셀(Voxel) 파괴 시스템
- 배치: 하단 `y = canvas.height - 150`에 4개 배치.
  - 1번, 4번: `DESTRUCTIBLE` (얼음, 하늘색, HP 20).
  - 2번, 3번: `INDESTRUCTIBLE` (돌, 슬레이트, HP 1, 파괴 불가).
- 복셀 구조: 6열 x 4행 = 24개 블록. 잔여 HP 비율에 비례하여 랜덤 블록이 실시간으로 탈락/파괴됨.

---

## 3. 요약 테이블 (Verification Matrix)

| 검증 항목 | 요구사항 / 의도 | 실제 코드 구현 상태 | 판정 | 비고 / 근본 원인 |
|---|---|---|---|---|
| **1. 바리케이드 감속** | 적이 방벽과 겹칠 때 속도 감소 | `isGnawing` 플래그는 켜지나 `Enemy.update`에 감속 수식 없음 | ❌ **미구현 (GAP)** | 방벽 충돌 시 감속 없이 정상 속도로 관통 |
| **2. Diver 적 동작** | 방벽 충돌 시 갉아먹지 않고 자폭 및 20 대미지 | 충돌 시 `enemy.isDead=true`, `barricade.hp-=20`, 붉은 폭발 30개 | ✅ **정상 구현** | `GameManager.ts:455-460` |
| **3. Splitter 분열** | 사망 시 초저속 미니 적 2체로 분열 | 사망 시 `mini1`(speed ±10, y 5), `mini2` 생성 (20x20 크기) | ✅ **정상 구현** | `GameManager.ts:377-386` |
| **4. 투사체 요격** | 플레이어 총알로 저격수 총알 요격 파괴 | `isInterceptable=true` 선언되었으나 총알-총알 충돌 루프 부재 | ❌ **미구현 (GAP)** | `GameManager.ts:checkCollisions`에 Bullet-Bullet 충돌 누락 |
| **5. 아군 지원 (Q)** | 재화 50 소모로 Q키/버튼 아군 소환 | Fighter, Repairer, Tank 3종 정상 소환 및 기능 수행 | ✅ **정상 구현** | `GameManager.ts:611-620` |
| **6. 보스전 (Wave 5n)** | 5웨이브마다 대형 보스 출현 | 크기 150x100, 체력 10*level, 탄속 300, 전용 외형 렌더링 | ✅ **정상 구현** | `GameManager.ts:119` |
