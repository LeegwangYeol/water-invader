# Handoff Report - Shop, Economy, & UI Interaction Glitches Investigation

## 1. Observation (직접 관찰 결과)

### 1.1 소스 코드 및 파일 구조
- src/components/game-canvas.tsx: React 컴포넌트, HUD, 상점 UI 오버레이, 모바일 터치 컨트롤, 키보드 이벤트 리스너.
- src/game/GameManager.ts: 게임 루프, 상태 전이(GameState.SHOP, GameState.GAME_OVER), 상점 업그레이드 메서드(upgradeFireRate, upgradeMultiShot, upgradePiercing), 재화(currency) 관리.
- src/game/Player.ts: 플레이어 스탯(baseFireRate, multiShot, piercing), 발사 로직(fire()), 스트레스 및 억제 탄막 분산.
- src/game/types.ts: GameState enum (MENU, PLAYING, GAME_OVER, SHOP).

### 1.2 핵심 결함 및 관찰 상세
1. [Obs 1 / HIGH] upgradeFireRate() 최대 레벨(Lv. 5 / 0.1s) 도달 후 재화 50 무한 소진 결함 (GameManager.ts:866)
   - 조건식이 fireRate > 0.05로 작성되어 있어 fireRate가 0.1(최대치)에 도달한 후에도 0.1 > 0.05 === true가 되어 호출 시마다 50이 계속 차감됩니다.
2. [Obs 2 / MEDIUM] React upgrades 상태 비동기화 (game-canvas.tsx:26, 96-102)
   - onScoreChange 콜백에 무기 업그레이드 레벨이 포함되지 않아, 엔진 직접 호출 시 UI 표시가 갱신되지 않습니다.
3. [Obs 3 / MEDIUM] SHOP, MENU, GAME_OVER 화면에서 Q(Ally) 및 E(Ultimate) 키 입력 누수 (game-canvas.tsx:105-112, GameManager.ts:796-825)
   - GameState.PLAYING 검사가 누락되어 상점이나 메뉴에서 Q나 E를 누르면 재화 50이나 궁극기 게이지가 허공에 낭비됩니다.
4. [Obs 4 / LOW] 관통 업그레이드 상한 불일치 (GameManager.ts:884 vs game-canvas.tsx:439)
   - UI는 5레벨에서 비활성화(MAX)되지만, 엔진은 99까지 허용합니다.
5. [Obs 5 / LOW] 상점 UI JSX 중복 (game-canvas.tsx:405-443 vs 463-501)
   - SHOP과 GAME_OVER 오버레이의 상점 카드 JSX가 완전히 중복되어 있습니다.
6. [Obs 6 / VERIFIED] 인터미션 상점 전이 및 로그라이트 스탯 보존 정상 작동
   - enemies.length === 0 시 GameState.SHOP으로 일시정지(pause())되고, startNextWave()로 정상 재개됩니다.
   - GameManager.init()에서 플레이어 무기 스탯과 잔여 재화가 보존되어 메타 진행이 정상 동작합니다.

---

## 2. Logic Chain & Code Tree Structure (논리 전개 및 코드 트리)

### 2.1 상점 및 경제 시스템 아키텍처 트리
`	ext
Water Invader System Architecture (Shop, Economy & UI Overlay)
|
+-- [Game Loop & State Machine] (src/game/GameManager.ts)
|   +-- GameState: MENU ---> PLAYING ---> SHOP (Wave Clear) ---> PLAYING (Next Wave)
|   |                         +---> GAME_OVER (HP <= 0) ---> MENU / PLAY AGAIN
|   |
|   +-- [Economy Engine: Pure Water]
|   |   +-- Earned: handleEnemyKill() -> +5 * comboMultiplier (1.0x ~ 3.0x)
|   |   +-- Cheat: F5 key -> +1000 Pure Water
|   |   +-- Spent:
|   |       +-- ALLY(Q): 50 Water -> triggerSummonAlly()
|   |       +-- Fire Rate: 50 Water -> upgradeFireRate() [BUG: fireRate > 0.05 drains at Lv 5]
|   |       +-- Multi-Shot: 100 Water -> upgradeMultiShot() (Cap = 5)
|   |       +-- Piercing: 200 Water -> upgradePiercing() (Cap = 99 in Engine, 5 in UI)
|   |
|   +-- [State Transitions & Intermission Flow]
|   |   +-- Wave Clear Detection (GameManager.ts:380)
|   |   |   +-- (state === PLAYING && enemies.length === 0 && warningTimer <= 0)
|   |   |       +-- state = GameState.SHOP
|   |   |       +-- onStateChange(GameState.SHOP)
|   |   |       +-- pause() -> cancelAnimationFrame(), clearKeys()
|   |   |
|   |   +-- Next Wave Resume (GameManager.ts:151)
|   |   |   +-- startNextWave()
|   |   |       +-- state = GameState.PLAYING
|   |   |       +-- level++ -> spawnWave()
|   |   |       +-- updateScoreUI()
|   |   |       +-- resume loop -> requestAnimationFrame(this.loop)
|   |   |
|   |   +-- Game Over Flow (GameManager.ts:605)
|   |       +-- gameOver(reason)
|   |           +-- state = GameState.GAME_OVER
|   |           +-- soundManager.playGameOver()
|   |           +-- onStateChange(GameState.GAME_OVER)
|   |
|   +-- [Rogue-lite Retention Mechanics] (GameManager.ts:103)
|       +-- init()
|           +-- Resets: hp=3, stress=0, suppression=0, score=0, combo=0, level=1
|           +-- Preserves: player.baseFireRate, player.multiShot, player.piercing, currency
|
+-- [React UI & Overlay Layer] (src/components/game-canvas.tsx)
|   +-- Top HUD (z-30): Score, Pure Water, Wave, HP Dots, Mute, Combo, Ultimate Bar
|   |
|   +-- Overlays (z-20 / z-30):
|   |   +-- MENU Overlay: START GAME, HOW TO PLAY, INSTALL APP
|   |   +-- MANUAL Modal: How to play guide & cheat hotkeys
|   |   +-- SHOP Overlay (Wave Cleared): Upgrades Card + NEXT WAVE button
|   |   +-- GAME_OVER Overlay: Final Score + Upgrades Card + PLAY AGAIN button
|   |
|   +-- React-Engine State Synchronization:
|       +-- onScoreChange -> updates score, currency, combo, wave, ultimate
|       +-- onPlayerHpChange -> updates hp
|       +-- [BUG/GAP] upgrades state -> not updated via onScoreChange callback
|
+-- [Weapon Upgrade Mechanics] (src/game/Player.ts)
    +-- fireRate (0.5s -> 0.1s): fireTimer = baseFireRate / (1 + stressLevel / 50)
    +-- multiShot (1 -> 5):
    |   +-- Lv 1: 1 bullet (centerX)
    |   +-- Lv 2: 2 parallel bullets (left/right)
    |   +-- Lv 3: 3 spread bullets [-10 deg, 0 deg, +10 deg]
    |   +-- Lv 4: 4 spread bullets [-15 deg, -5 deg, +5 deg, +15 deg]
    |   +-- Lv 5: 5 spread bullets [-20 deg, -10 deg, 0 deg, +10 deg, +20 deg]
    +-- piercing (1 -> 5): Bullet.piercing count deducted on each enemy penetration
`

### 2.2 논리 전개 (Logic Chain)
1. fireRate 최소 한계값은 0.1s인데 조건문이 fireRate > 0.05이므로, 최대 레벨 도달 후에도 조건이 참이 되어 50이 계속 낭비됩니다.
2. React의 upgrades 상태가 useState에 고립되어 있어, 엔진 상태가 변경되어도 UI에 단방향 미동기화 문제가 발생합니다.
3. handleKeyDown 및 스킬 발동 메서드가 GameState.PLAYING 가드가 없어 비전투 상태에서 키 입력 시 스킬/재화가 소모됩니다.

---

## 3. Caveats (주의사항 및 한계)
1. Read-Only 분석 원칙에 따라 src/ 파일은 수정하지 않고 조사 및 분석만 진행했습니다.
2. localStorage에는 HighScore만 저장되며, currency와 upgrades는 세션 리셋 시 유지되나 브라우저 새로고침(F5) 시 초기화됩니다.

---

## 4. Conclusion (최종 평가 및 개선 권고사항)
1. [HIGH] GameManager.ts:866 upgradeFireRate() 조건식을 fireRate > 0.15로 수정하여 5레벨에서 구매 차단.
2. [MEDIUM] GameManager.ts triggerSummonAlly() 및 triggerUltimate()에 if (this.state !== GameState.PLAYING) return; 추가.
3. [MEDIUM] game-canvas.tsx에서 onScoreChange 수신 시 플레이어 업그레이드 수치를 함께 동기화.
4. [LOW] game-canvas.tsx 내 중복된 상점 UI JSX를 단일 컴포넌트로 분리.

---

## 5. Verification Method & Test Assertions (독립 검증 방법)

### 5.1 upgradeFireRate() 5레벨 재화 누수 재현 단위 테스트
`	ypescript
test('Bug Reproduction: upgradeFireRate does not drain currency beyond Lv 5', () => {
  const gm = new GameManager(mockCanvas);
  gm.currency = 500;
  gm.player.fireRate = 0.5;

  gm.upgradeFireRate(); // 0.4, 450
  gm.upgradeFireRate(); // 0.3, 400
  gm.upgradeFireRate(); // 0.2, 350
  gm.upgradeFireRate(); // 0.1, 300
  expect(gm.player.fireRate).toBe(0.1);
  expect(gm.currency).toBe(300);

  // 5th attempt at MAX level
  gm.upgradeFireRate();
  // BUGGY BEHAVIOR: currency becomes 250!
  // EXPECTED CORRECT BEHAVIOR: currency remains 300!
  expect(gm.currency).toBe(300);
});
`

### 5.2 상점 화면에서 Q/E 스킬 키 입력 차단 검증 테스트
`	ypescript
test('Verification: Q and E keys must be ignored in SHOP and GAME_OVER states', () => {
  const gm = new GameManager(mockCanvas);
  gm.state = GameState.SHOP;
  gm.currency = 100;
  gm.player.ultimateGauge = 100;

  gm.handleKeyDown('q');
  expect(gm.currency).toBe(100);
  expect(gm.pendingReinforcement).toBeNull();

  gm.handleKeyDown('e');
  expect(gm.player.ultimateGauge).toBe(100);
  expect(gm.bullets.length).toBe(0);
});
`

### 5.3 빌드 검증 명령어
`ash
npx tsc --noEmit
npm run build
`
