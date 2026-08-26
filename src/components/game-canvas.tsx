'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from '../game/GameManager';
import { GameState } from '../game/types';
import { soundManager } from '../game/SoundManager';

interface ShopUpgradePanelProps {
  currency: number;
  upgrades: { fireRate: number; multiShot: number; piercing: number };
  onBuyFireRate: () => void;
  onBuyMultiShot: () => void;
  onBuyPiercing: () => void;
}

function ShopUpgradePanel({
  currency,
  upgrades,
  onBuyFireRate,
  onBuyMultiShot,
  onBuyPiercing,
}: ShopUpgradePanelProps) {
  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg mb-8 text-white w-full max-w-sm">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center border-b border-slate-600 pb-2">Upgrades (💧 {currency})</h2>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="font-bold">Fire Rate (Lv. {upgrades.fireRate})</p>
          <p className="text-xs sm:text-sm text-slate-400">Shoot faster</p>
        </div>
        <button 
          onClick={onBuyFireRate}
          disabled={currency < 50 || upgrades.fireRate >= 5}
          className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
        >{upgrades.fireRate >= 5 ? 'MAX' : '50 💧'}</button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="font-bold">Multi-Shot (Lv. {upgrades.multiShot})</p>
          <p className="text-xs sm:text-sm text-slate-400">More projectiles</p>
        </div>
        <button 
          onClick={onBuyMultiShot}
          disabled={currency < 100 || upgrades.multiShot >= 5}
          className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
        >{upgrades.multiShot >= 5 ? 'MAX' : '100 💧'}</button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold">Piercing (Lv. {upgrades.piercing})</p>
          <p className="text-xs sm:text-sm text-slate-400">Bullets penetrate enemies</p>
        </div>
        <button 
          onClick={onBuyPiercing}
          disabled={currency < 200 || upgrades.piercing >= 5}
          className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
        >{upgrades.piercing >= 5 ? 'MAX' : '200 💧'}</button>
      </div>
    </div>
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currency, setCurrency] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [ultimate, setUltimate] = useState(0);
  const [hp, setHp] = useState(5);
  const [invaderCount, setInvaderCount] = useState(0);
  const [rogueCount, setRogueCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const [showManual, setShowManual] = useState(false);
  const showManualRef = useRef(false);
  showManualRef.current = showManual;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [lang, setLang] = useState('ko');
  const [upgrades, setUpgrades] = useState({ fireRate: 1, multiShot: 1, piercing: 1 });

  const handleToggleMute = () => {
    soundManager.init();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenManual = () => {
    gameManagerRef.current?.pause();
    setShowManual(true);
  };

  const handleCloseManual = () => {
    setShowManual(false);
    if (gameManagerRef.current?.state === GameState.PLAYING) {
      gameManagerRef.current?.resume();
    }
  };

  useEffect(() => {
    const navLang = navigator.language || 'ko';
    if (navLang.startsWith('en')) {
      setLang('en');
    } else {
      setLang('ko');
    }
  }, []);

  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered', reg))
        .catch((err) => console.error('SW registration failed', err));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const getSafeStoredHighScore = (): number => {
    try {
      const saved = localStorage.getItem('waterInvaderHighScore');
      if (!saved) return 0;
      const parsed = parseInt(saved, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    setHighScore(getSafeStoredHighScore());
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const game = new GameManager(canvas);
    gameManagerRef.current = game;
    (window as any).gameManager = game;
    
    game.onStateChange = (state) => {
      setGameState(state);
      if (state !== GameState.PLAYING) {
        activePointerIdRef.current = null;
        lastPointerXRef.current = null;
        isDraggingRef.current = false;
      }
      if (state === GameState.GAME_OVER) {
        setHighScore(getSafeStoredHighScore());
        setGameOverReason(game.gameOverReason);
      }
    };
    game.onScoreChange = (newScore, newCurrency, newCombo, newWave, newUltimate, newInvaderCount, newRogueCount) => {
      setScore(newScore);
      setCurrency(newCurrency);
      setCombo(newCombo);
      setWave(newWave);
      setUltimate(newUltimate);
      if (typeof newInvaderCount === 'number') setInvaderCount(newInvaderCount);
      if (typeof newRogueCount === 'number') setRogueCount(newRogueCount);
    };
    game.onPlayerHpChange = setHp;
    game.onUpgradesChange = (newUpgrades) => {
      setUpgrades(newUpgrades);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showManualRef.current) return;
      game.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (showManualRef.current) return;
      game.handleKeyUp(e.key);
    };

    const handleBlur = () => {
      activePointerIdRef.current = null;
      lastPointerXRef.current = null;
      isDraggingRef.current = false;
      game.clearKeys();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activePointerIdRef.current = null;
        lastPointerXRef.current = null;
        isDraggingRef.current = false;
        game.clearKeys();
      }
    };
    const handleResize = () => {
      // Re-anchor pointer drag on resize / orientation change so layout changes don't cause coordinate delta jump
      lastPointerXRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      game.stopGame();
    };
  }, []);

  const startGame = () => {
    gameManagerRef.current?.init();
    if (gameManagerRef.current) {
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
    gameManagerRef.current?.startGame();
  };

  const buyFireRate = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeFireRate();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  };

  const buyMultiShot = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeMultiShot();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  };

  const buyPiercing = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradePiercing();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  };

  // Mobile touch & drag evasion controls
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const updateTargetX = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameManagerRef.current) return;
    if (!Number.isFinite(e.clientX)) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || !Number.isFinite(rect.width) || !Number.isFinite(rect.left)) return;

    // Use clientWidth & clientLeft to account for border/padding and exact canvas drawing content box
    const clientLeft = canvas.clientLeft || 0;
    const contentWidth = canvas.clientWidth > 0 ? canvas.clientWidth : (rect.width - clientLeft * 2);
    if (contentWidth <= 0 || !Number.isFinite(contentWidth)) return;

    // Use logical width (600) for DPI-independent 1:1 displacement
    const logicalWidth = gameManagerRef.current.logicalWidth;
    const scaleX = logicalWidth / contentWidth;
    if (!Number.isFinite(scaleX) || scaleX <= 0) return;

    const targetX = (e.clientX - (rect.left + clientLeft)) * scaleX;
    const player = gameManagerRef.current.player;
    if (!player) return;

    const playerCenter = player.position.x + player.size.width / 2;
    const deadzone = 20;

    // If actively dragging, apply smooth responsive relative delta displacement
    if (isDraggingRef.current) {
      if (lastPointerXRef.current !== null && Number.isFinite(lastPointerXRef.current)) {
        const deltaClientX = e.clientX - lastPointerXRef.current;
        if (Number.isFinite(deltaClientX)) {
          const deltaLogicalX = deltaClientX * scaleX;
          const newX = player.position.x + deltaLogicalX;
          const minX = 0;
          const maxX = logicalWidth - player.size.width;
          if (Number.isFinite(newX)) {
            player.position.x = Math.max(minX, Math.min(maxX, newX));
          }
        }
      }
      lastPointerXRef.current = e.clientX;
      // In drag mode, player position is directly controlled by finger; reset velocity flags
      player.isMovingLeft = false;
      player.isMovingRight = false;
    } else {
      // Fallback directional steering for non-drag move events (e.g. synthetic pointermove)
      if (Number.isFinite(targetX) && Math.abs(targetX - playerCenter) > deadzone) {
        if (targetX < playerCenter) {
          player.isMovingLeft = true;
          player.isMovingRight = false;
        } else {
          player.isMovingLeft = false;
          player.isMovingRight = true;
        }
      } else {
        player.isMovingLeft = false;
        player.isMovingRight = false;
      }
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING || !canvasRef.current || !gameManagerRef.current) return;
    // If another pointer is already actively dragging, ignore secondary touches on canvas
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
      return;
    }
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // In case setPointerCapture is unsupported in mock or test environments
    }

    activePointerIdRef.current = e.pointerId;
    lastPointerXRef.current = Number.isFinite(e.clientX) ? e.clientX : null;
    isDraggingRef.current = true;

    // Start auto-firing on canvas touch
    gameManagerRef.current.handleKeyDown(' ');
    updateTargetX(e);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING || !canvasRef.current || !gameManagerRef.current) return;
    // Only track the active dragging pointer (or any pointer if not locked)
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    if (e.buttons > 0 || e.pointerType === 'touch' || isDraggingRef.current) {
      updateTargetX(e);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only release if the event corresponds to the active pointer or if no specific pointer is tracked
    if (activePointerIdRef.current === e.pointerId || activePointerIdRef.current === null || e.pointerId === undefined) {
      try {
        if (e.currentTarget?.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }
      activePointerIdRef.current = null;
      lastPointerXRef.current = null;
      isDraggingRef.current = false;

      if (gameManagerRef.current) {
        gameManagerRef.current.handleKeyUp(' ');
        if (gameManagerRef.current.player) {
          gameManagerRef.current.player.isMovingLeft = false;
          gameManagerRef.current.player.isMovingRight = false;
        }
      }
    }
  };

  const handleTouchStart = (key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
    if (showManual) return;
    e.preventDefault();
    e.stopPropagation();
    gameManagerRef.current?.handleKeyDown(key);
  };

  const handleTouchEnd = (key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
    if (showManual) return;
    e.preventDefault();
    e.stopPropagation();
    gameManagerRef.current?.handleKeyUp(key);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white touch-none z-30 pointer-events-none">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400">{t('점수:', 'Score:')} {score}</h2>
          <p className="text-sm sm:text-base text-blue-200">{t('정수된 물:', 'Pure Water:')} {currency} 💧</p>
          {gameState === GameState.PLAYING && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm sm:text-base text-yellow-300 font-bold">WAVE {wave}</p>
              <div className="flex items-center gap-1.5 ml-1">
                <span 
                  data-testid="invader-threat-badge" 
                  className="px-2 py-0.5 rounded-full text-xs font-black bg-red-950/80 text-red-400 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-1 select-none"
                >
                  👾 {invaderCount}
                </span>
                <span 
                  data-testid="rogue-threat-badge" 
                  className="px-2 py-0.5 rounded-full text-xs font-black bg-lime-950/80 text-lime-400 border border-lime-500/60 shadow-[0_0_8px_rgba(132,204,22,0.4)] flex items-center gap-1 select-none"
                >
                  ⚡ {rogueCount}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex gap-1 justify-end mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full ${i < hp ? 'bg-blue-500' : 'bg-gray-600'}`} />
            ))}
          </div>
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded border border-slate-600 transition-colors pointer-events-auto select-none mb-1 z-30"
          >
            {isMuted ? '🔇 MUTE' : '🔊 SOUND'}
          </button>
          {combo > 1 && (
            <div className="text-lg sm:text-xl font-bold text-yellow-400 animate-pulse">
              {combo}x COMBO!
            </div>
          )}
          {/* Ultimate Gauge */}
          {gameState === GameState.PLAYING && (
            <div className="mt-2 w-32 bg-slate-700 h-4 rounded-full overflow-hidden border border-slate-500 relative">
              <div 
                className={`h-full transition-all duration-300 ${ultimate >= 100 ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-blue-500'}`}
                style={{ width: `${ultimate}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full aspect-[3/4]">
        <canvas
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          ref={canvasRef}
          width={600}
          height={800}
          className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain select-none"
        />
      </div>

      {/* Mobile Controls */}
      {gameState === GameState.PLAYING && (
        <div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">
          <div className="flex flex-col gap-1 w-1/2">
            <div className="flex gap-1 h-1/2">
              <button 
                className={`flex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none ${currency >= 50 ? 'bg-green-600 active:bg-green-500' : 'bg-slate-700 opacity-50'}`}
                onPointerDown={handleTouchStart('q')}
                onPointerUp={handleTouchEnd('q')}
                onPointerLeave={handleTouchEnd('q')}
                onPointerCancel={handleTouchEnd('q')}
              >
                ALLY(Q)
              </button>
              <button 
                className={`flex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none ${ultimate >= 100 ? 'bg-yellow-600 active:bg-yellow-500' : 'bg-slate-700 opacity-50'}`}
                onPointerDown={handleTouchStart('e')}
                onPointerUp={handleTouchEnd('e')}
                onPointerLeave={handleTouchEnd('e')}
                onPointerCancel={handleTouchEnd('e')}
              >
                ULT({ultimate}%)
              </button>
            </div>
            <button 
              className="w-full bg-blue-600/80 active:bg-blue-400 rounded-xl h-1/2 flex items-center justify-center text-xl font-black text-white select-none touch-none shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              onPointerDown={handleTouchStart(' ')}
              onPointerUp={handleTouchEnd(' ')}
              onPointerLeave={handleTouchEnd(' ')}
              onPointerCancel={handleTouchEnd(' ')}
            >
              FIRE!
            </button>
          </div>
        </div>
      )}

      {/* Overlays */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg z-20">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-4 tracking-wider uppercase text-center px-4">
            Water Invader
          </h1>
          {highScore > 0 && (
            <p className="text-xl text-yellow-400 font-bold mb-8">HIGH SCORE: {highScore}</p>
          )}
          <div className="flex flex-col gap-4">
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl sm:text-2xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105"
            >
              START GAME
            </button>
            <button 
              onClick={() => handleOpenManual()}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-lg transition-all"
            >
              HOW TO PLAY
            </button>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                INSTALL APP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {showManual && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg z-30 p-4">
          <div className="bg-slate-800 p-6 rounded-xl max-w-lg w-full max-h-[90%] overflow-y-auto text-white">
            <h2 className="text-3xl font-black text-blue-400 mb-6 text-center border-b border-slate-600 pb-4">HOW TO PLAY</h2>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Controls</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong className="text-white">Move:</strong> Left/Right Arrows or A/D keys</li>
                  <li><strong className="text-white">Shoot:</strong> Spacebar</li>
                  <li><strong className="text-white">Ultimate Skill (Heavy Rain):</strong> E or Shift key (Requires 100% Gauge)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Game Mechanics</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Survive endless waves of enemies! Every 5th wave features a Boss.</li>
                  <li>Collect <strong className="text-blue-300">Pure Water 💧</strong> by defeating enemies.</li>
                  <li>Build up your <strong className="text-yellow-300">Combo</strong> by defeating enemies quickly to multiply your score and currency gain!</li>
                  <li>Taking damage increases your <strong className="text-red-400">Stress & Panic</strong>, which lowers your accuracy and causes your character to visually panic!</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">3-Way Battlefield & Factions</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm sm:text-base">
                  <li><strong className="text-cyan-400">Player & Allies (Blue/Green):</strong> Defend the water filtration station and deploy friendly support drones.</li>
                  <li><strong className="text-orange-400">Alien Invaders (Orange/Red):</strong> Original invaders aiming to corrupt the clean water reservoir.</li>
                  <li><strong className="text-lime-400">Rogue Cyber-Faction (Neon Lime):</strong> Autonomous third faction (Drones, Stalkers, Mechs) hostile to BOTH Player and Invaders!</li>
                  <li><strong className="text-yellow-300">Crossfire Tactics:</strong> Lure Invaders and Rogues into fighting each other! Opposing factions destroying each other awards bonus score, pure water, and instant ultimate charge!</li>
                  <li><strong className="text-amber-400">Dynamic Reinforcements:</strong> Beware of sudden Flank Incursions, Spearhead V-Formations, and Rogue Airdrops signaled by alert sirens!</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Developer Tools (Cheats)</h3>
                <p className="text-slate-300 mb-2">For testing purposes, the following hotkeys are available:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong className="text-fuchsia-400">F3:</strong> Toggle Debug Overlay (Hitboxes & FPS)</li>
                  <li><strong className="text-green-400">F4:</strong> Toggle God Mode (Invincibility)</li>
                  <li><strong className="text-blue-400">F5:</strong> Add 1000 💧 instantly</li>
                </ul>
              </section>
            </div>

            <button 
              onClick={handleCloseManual}
              className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.SHOP && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-20 p-4">
          <h1 className="text-4xl sm:text-5xl font-black text-blue-400 mb-2">WAVE CLEARED</h1>
          <p className="text-xl sm:text-2xl text-white mb-8">Prepare for next wave!</p>
          
          <ShopUpgradePanel
            currency={currency}
            upgrades={upgrades}
            onBuyFireRate={buyFireRate}
            onBuyMultiShot={buyMultiShot}
            onBuyPiercing={buyPiercing}
          />
          
          <button 
            onClick={() => gameManagerRef.current?.startNextWave()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-lg sm:text-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] mt-4"
          >
            NEXT WAVE
          </button>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-20 p-4">
          <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-2">GAME OVER</h1>
          {gameOverReason && (
            <p className="text-lg sm:text-xl text-red-300 font-bold mb-4 text-center">{gameOverReason}</p>
          )}
          <p className="text-xl sm:text-2xl text-white mb-8">Final {t('점수:', 'Score:')} {score}</p>
          
          <ShopUpgradePanel
            currency={currency}
            upgrades={upgrades}
            onBuyFireRate={buyFireRate}
            onBuyMultiShot={buyMultiShot}
            onBuyPiercing={buyPiercing}
          />

          <button 
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-lg sm:text-xl transition-all"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
