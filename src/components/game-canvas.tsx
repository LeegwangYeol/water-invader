'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from '../game/GameManager';
import { GameState } from '../game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameOverReason, setGameOverReason] = useState<string>("");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currency, setCurrency] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [ultimate, setUltimate] = useState(0);
  const [hp, setHp] = useState(3);
  
  const [showManual, setShowManual] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [lang, setLang] = useState('ko');

  useEffect(() => {
    const navLang = navigator.language || 'ko';
    if (navLang.startsWith('en')) {
      setLang('en');
    } else {
      setLang('ko');
    }
  }, []);

  const t = (ko: string, en: string) => lang === 'ko' ? ko : en;

  useEffect(() => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.error('SW registration failed', err));
    }

    // Listen for the PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleSkill = (key: string) => {
    if (gameManagerRef.current && gameState === GameState.PLAYING) {
      gameManagerRef.current.handleKeyDown(key);
    }
  };

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

  useEffect(() => {
    const saved = localStorage.getItem('waterInvaderHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const game = new GameManager(canvas);
    gameManagerRef.current = game;
    // Expose for testing
    (window as any).gameManager = game;
    
    game.onStateChange = (state) => {
      setGameState(state);
      if (state === GameState.GAME_OVER) {
        const saved = localStorage.getItem('waterInvaderHighScore');
        if (saved) setHighScore(parseInt(saved, 10));
        setGameOverReason(game.gameOverReason);
      }
    };
    game.onScoreChange = (newScore, newCurrency, newCombo, newWave, newUltimate) => {
      setScore(newScore);
      setCurrency(newCurrency);
      setCombo(newCombo);
      setWave(newWave);
      setUltimate(newUltimate);
    };
    game.onPlayerHpChange = setHp;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showManual) return;
      game.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (showManual) return;
      game.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      game.stopGame();
    };
  }, [showManual]);

  const startGame = () => {
    gameManagerRef.current?.init(); // Reset state
    gameManagerRef.current?.startGame();
  };

  const buyFireRate = () => {
    gameManagerRef.current?.upgradeFireRate();
  };

  const buyMultiShot = () => {
    gameManagerRef.current?.upgradeMultiShot();
  };

  const buyPiercing = () => {
    gameManagerRef.current?.upgradePiercing();
  };

  // Mobile controls
  const handleTouchStart = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    if (showManual) return;
    e.preventDefault();
    gameManagerRef.current?.handleKeyDown(key);
  };

  const handleTouchEnd = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    if (showManual) return;
    e.preventDefault();
    gameManagerRef.current?.handleKeyUp(key);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white pointer-events-none z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400">{t('점수:', 'Score:')} {score}</h2>
          <p className="text-sm sm:text-base text-blue-200">{t('정수된 물:', 'Pure Water:')} {currency} 💧</p>
          {gameState === GameState.PLAYING && (
            <p className="text-sm sm:text-base text-yellow-300 font-bold mt-1">WAVE {wave}</p>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex gap-1 justify-end mb-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full ${i < hp ? 'bg-blue-500' : 'bg-gray-600'}`} />
            ))}
          </div>
          {combo > 1 && (
            <div className="text-lg sm:text-xl font-bold text-yellow-400 animate-pulse">
              {combo}x COMBO!
            </div>
          )}
          {/* Ultimate Gauge */}
          {gameState === GameState.PLAYING && (
            <div className="mt-2 w-32 bg-slate-700 h-4 rounded-full overflow-hidden border border-slate-500 relative relative">
              <div 
                className={`h-full transition-all duration-300 ${ultimate >= 100 ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-blue-500'}`}
                style={{ width: `${ultimate}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full aspect-[3/4] sm:aspect-auto">
        <canvas
          ref={canvasRef}
          width={600}
          height={800}
          className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain"
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
              onClick={() => setShowManual(true)}
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
              onClick={() => setShowManual(false)}
              className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-20 p-4">
          <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-2">GAME OVER</h1>
          {gameOverReason && (
            <p className="text-lg sm:text-xl text-red-300 font-bold mb-4 text-center">{gameOverReason}</p>
          )}
          <p className="text-xl sm:text-2xl text-white mb-8">Final {t('점수:', 'Score:')} {score}</p>
          
          {/* Shop */}
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg mb-8 text-white w-full max-w-sm">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center border-b border-slate-600 pb-2">Upgrades (💧 {currency})</h2>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-bold">Fire Rate</p>
                <p className="text-xs sm:text-sm text-slate-400">Shoot faster</p>
              </div>
              <button 
                onClick={buyFireRate}
                disabled={currency < 50}
                className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
              >
                50 💧
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-bold">Multi-Shot</p>
                <p className="text-xs sm:text-sm text-slate-400">More projectiles</p>
              </div>
              <button 
                onClick={buyMultiShot}
                disabled={currency < 100}
                className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
              >
                100 💧
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">Piercing</p>
                <p className="text-xs sm:text-sm text-slate-400">Bullets penetrate enemies</p>
              </div>
              <button 
                onClick={buyPiercing}
                disabled={currency < 200}
                className="px-4 py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors"
              >
                200 💧
              </button>
            </div>
          </div>

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
