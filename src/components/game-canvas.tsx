'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from '../game/GameManager';
import { GameState } from '../game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [currency, setCurrency] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(3);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const game = new GameManager(canvas);
    gameManagerRef.current = game;
    // Expose for testing
    (window as any).gameManager = game;
    
    game.onStateChange = setGameState;
    game.onScoreChange = (newScore, newCurrency, newCombo) => {
      setScore(newScore);
      setCurrency(newCurrency);
      setCombo(newCombo);
    };
    game.onPlayerHpChange = setHp;

    const handleKeyDown = (e: KeyboardEvent) => game.handleKeyDown(e.key);
    const handleKeyUp = (e: KeyboardEvent) => game.handleKeyUp(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      game.stopGame();
    };
  }, []);

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

  // Mobile controls
  const handleTouchStart = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    gameManagerRef.current?.handleKeyDown(key);
  };

  const handleTouchEnd = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    gameManagerRef.current?.handleKeyUp(key);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white pointer-events-none z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400">Score: {score}</h2>
          <p className="text-sm sm:text-base text-blue-200">Pure Water: {currency} 💧</p>
        </div>
        <div className="text-right">
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
        </div>
      </div>

      <div className="w-full aspect-[4/3] sm:aspect-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain"
        />
      </div>

      {/* Mobile Controls */}
      {gameState === GameState.PLAYING && (
        <div className="w-full flex justify-between p-4 mt-2 gap-4 touch-none">
          <div className="flex gap-2 w-1/2">
            <button 
              className="flex-1 bg-slate-700/80 active:bg-blue-600 rounded-xl h-20 flex items-center justify-center text-4xl text-white select-none touch-none"
              onPointerDown={handleTouchStart('ArrowLeft')}
              onPointerUp={handleTouchEnd('ArrowLeft')}
              onPointerLeave={handleTouchEnd('ArrowLeft')}
              onPointerCancel={handleTouchEnd('ArrowLeft')}
            >
              ◀
            </button>
            <button 
              className="flex-1 bg-slate-700/80 active:bg-blue-600 rounded-xl h-20 flex items-center justify-center text-4xl text-white select-none touch-none"
              onPointerDown={handleTouchStart('ArrowRight')}
              onPointerUp={handleTouchEnd('ArrowRight')}
              onPointerLeave={handleTouchEnd('ArrowRight')}
              onPointerCancel={handleTouchEnd('ArrowRight')}
            >
              ▶
            </button>
          </div>
          <button 
            className="w-1/2 bg-blue-600/80 active:bg-blue-400 rounded-xl h-20 flex items-center justify-center text-3xl font-black text-white tracking-widest select-none shadow-[0_0_15px_rgba(59,130,246,0.5)] touch-none"
            onPointerDown={handleTouchStart(' ')}
            onPointerUp={handleTouchEnd(' ')}
            onPointerLeave={handleTouchEnd(' ')}
            onPointerCancel={handleTouchEnd(' ')}
          >
            FIRE
          </button>
        </div>
      )}

      {/* Overlays */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg z-20">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-8 tracking-wider uppercase text-center px-4">
            Water Invader
          </h1>
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl sm:text-2xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105"
          >
            START GAME
          </button>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-20 p-4">
          <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-4">GAME OVER</h1>
          <p className="text-xl sm:text-2xl text-white mb-8">Final Score: {score}</p>
          
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
            
            <div className="flex justify-between items-center">
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
