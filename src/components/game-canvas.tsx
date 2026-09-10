'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameManager, HOMING_MISSILE_COSTS } from '../game/GameManager';
import { GameState, CrisisState, EndGameCrisisState, CrisisPhase } from '../game/types';
import { soundManager } from '../game/SoundManager';

// ============================================================================
// Memoized Sub-Components (Prevents DOM diffing on Score / Combo / Timer tick)
// ============================================================================

interface ShopUpgradePanelProps {
  currency: number;
  hp: number;
  upgrades: { fireRate: number; multiShot: number; piercing: number; hasAcidShield?: boolean; homingMissiles?: number };
  onBuyFireRate: () => void;
  onBuyMultiShot: () => void;
  onBuyPiercing: () => void;
  onBuyAcidShield?: () => void;
  onBuyHomingMissiles?: () => void;
  onRepairTank: () => void;
  lang: string;
}

export const ShopUpgradePanel = React.memo(function ShopUpgradePanel({
  currency,
  hp,
  upgrades,
  onBuyFireRate,
  onBuyMultiShot,
  onBuyPiercing,
  onBuyAcidShield,
  onBuyHomingMissiles,
  onRepairTank,
  lang,
}: ShopUpgradePanelProps) {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

  return (
    <div className="bg-slate-800 p-3 sm:p-6 rounded-lg mb-2 sm:mb-6 text-white w-full max-w-sm shrink-0">
      <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-center border-b border-slate-600 pb-1.5 sm:pb-2">Upgrades (💧 {currency})</h2>
      
      {/* Tank Repair (+1 HP) */}
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <p className="text-sm sm:text-base font-bold">{t('탱크 수리 (+1 HP)', 'Repair Tank (+1 HP)')} ({hp}/5)</p>
          <p className="text-xs sm:text-sm text-slate-400">{t('손상된 정수 탱크 복구', 'Restore water tank hull')}</p>
        </div>
        <button 
          onClick={onRepairTank}
          disabled={currency < 75 || hp >= 5}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded font-bold transition-colors text-xs sm:text-sm cursor-pointer"
        >{hp >= 5 ? 'MAX' : '75 💧'}</button>
      </div>

      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <p className="text-sm sm:text-base font-bold">Fire Rate (Lv. {upgrades.fireRate})</p>
          <p className="text-xs sm:text-sm text-slate-400">Shoot faster</p>
        </div>
        <button 
          onClick={onBuyFireRate}
          disabled={currency < 50 || upgrades.fireRate >= 5}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors text-xs sm:text-sm cursor-pointer"
        >{upgrades.fireRate >= 5 ? 'MAX' : '50 💧'}</button>
      </div>
      
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <p className="text-sm sm:text-base font-bold">Multi-Shot (Lv. {upgrades.multiShot})</p>
          <p className="text-xs sm:text-sm text-slate-400">More projectiles</p>
        </div>
        <button 
          onClick={onBuyMultiShot}
          disabled={currency < 100 || upgrades.multiShot >= 5}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors text-xs sm:text-sm cursor-pointer"
        >{upgrades.multiShot >= 5 ? 'MAX' : '100 💧'}</button>
      </div>
      
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <p className="text-sm sm:text-base font-bold">Piercing (Lv. {upgrades.piercing})</p>
          <p className="text-xs sm:text-sm text-slate-400">Bullets penetrate enemies</p>
        </div>
        <button 
          onClick={onBuyPiercing}
          disabled={currency < 200 || upgrades.piercing >= 5}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 disabled:bg-slate-700 rounded font-bold transition-colors text-xs sm:text-sm cursor-pointer"
        >{upgrades.piercing >= 5 ? 'MAX' : '200 💧'}</button>
      </div>

      {/* Acid Shield / 내산성 코팅 */}
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <p className="text-sm sm:text-base font-bold">{t('내산성 코팅 (ACID SHIELD)', 'Acid Shield Coating')}</p>
          <p className="text-xs sm:text-sm text-slate-400">{t('산성 폭풍의 유독성 물방울을 무효화합니다', 'Neutralize toxic acid storm droplets')}</p>
        </div>
        <button 
          onClick={onBuyAcidShield}
          disabled={currency < 150 || !!upgrades.hasAcidShield}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-lime-600 hover:bg-lime-500 disabled:bg-slate-700 rounded font-bold transition-colors text-xs sm:text-sm cursor-pointer"
        >{upgrades.hasAcidShield ? t('보유중', 'OWNED') : '150 💧'}</button>
      </div>

      {/* Homing Missiles / 유도 미사일 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-base font-bold">{t('유도 미사일', 'Homing Missiles')} (Lv. {upgrades.homingMissiles || 0})</p>
            <span className="text-xs bg-indigo-900/80 text-indigo-300 border border-indigo-500/50 px-1.5 py-0.5 rounded font-mono font-bold">
              🚀 Lv.{upgrades.homingMissiles || 0}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {t('가장 가까운 적을 자동 추적하여 큰 피해를 줍니다', 'Auto-seeks nearest enemy with heavy damage')}
          </p>
        </div>
        <button 
          data-testid="buy-homing-missiles-btn"
          onClick={onBuyHomingMissiles}
          disabled={(upgrades.homingMissiles || 0) >= 5 || currency < HOMING_MISSILE_COSTS[upgrades.homingMissiles || 0]}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded font-bold transition-colors shadow-[0_0_10px_rgba(99,102,241,0.3)] text-xs sm:text-sm cursor-pointer"
        >
          {(upgrades.homingMissiles || 0) >= 5 ? 'MAX' : `${HOMING_MISSILE_COSTS[upgrades.homingMissiles || 0]} 💧`}
        </button>
      </div>
    </div>
  );
});

interface TopHUDProps {
  score: number;
  currency: number;
  wave: number;
  invaderCount: number;
  rogueCount: number;
  hp: number;
  isMuted: boolean;
  combo: number;
  ultimate: number;
  gameState: GameState;
  onToggleMute: () => void;
  lang: string;
}

export const TopHUD = React.memo(function TopHUD({
  score,
  currency,
  wave,
  invaderCount,
  rogueCount,
  hp,
  isMuted,
  combo,
  ultimate,
  gameState,
  onToggleMute,
  lang,
}: TopHUDProps) {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

  return (
    <div className="absolute top-0 left-0 w-full p-4 p-2 sm:p-4 max-sm:!p-2 flex justify-between items-start text-white touch-none z-30 pointer-events-none">
      <div className="bg-slate-950/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none py-0.5 sm:p-0 rounded">
        <h2 className="text-sm sm:text-2xl font-bold text-blue-400 leading-tight">{t('점수:', 'Score:')} {score}</h2>
        <p className="text-xs sm:text-base text-blue-200 leading-tight">{t('정수된 물:', 'Pure Water:')} {currency} 💧</p>
        {gameState === GameState.PLAYING && (
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <p className="text-xs sm:text-base text-yellow-300 font-bold">WAVE {wave}</p>
            <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
              <span 
                data-testid="invader-threat-badge" 
                className="px-1.5 py-0 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-red-950/70 text-red-400 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-0.5 select-none"
              >
                👾 {invaderCount}
              </span>
              <span 
                data-testid="rogue-threat-badge" 
                className="px-1.5 py-0 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-lime-950/70 text-lime-400 border border-lime-500/60 shadow-[0_0_8px_rgba(132,204,22,0.4)] flex items-center gap-0.5 select-none"
              >
                ⚡ {rogueCount}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end bg-slate-950/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none py-0.5 sm:p-0 rounded">
        <div className="flex gap-1 justify-end mb-1 sm:mb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-3.5 h-3.5 sm:w-6 sm:h-6 rounded-full ${i < hp ? 'bg-blue-500' : 'bg-gray-600'}`} />
          ))}
        </div>
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] sm:text-xs font-bold text-slate-200 rounded border border-slate-600 transition-colors pointer-events-auto select-none mb-0.5 sm:mb-1 z-30 min-h-[22px] flex items-center justify-center cursor-pointer"
        >
          {isMuted ? '🔇 MUTE' : '🔊 SOUND'}
        </button>
        {combo > 1 && (
          <div className="text-sm sm:text-xl font-bold text-yellow-400 animate-pulse">
            {combo}x COMBO!
          </div>
        )}
        {/* Ultimate Gauge */}
        {gameState === GameState.PLAYING && (
          <div className="mt-1 sm:mt-2 w-20 sm:w-32 bg-slate-700 h-2.5 sm:h-4 rounded-full overflow-hidden border border-slate-500 relative">
            <div 
              className={`h-full transition-all duration-300 ${ultimate >= 100 ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-blue-500'}`}
              style={{ width: `${ultimate}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

interface CanvasCoreProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}

export const CanvasCore = React.memo(function CanvasCore({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CanvasCoreProps) {
  return (
    <canvas
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      ref={canvasRef}
      className="w-full h-full block bg-slate-900 touch-none select-none"
    />
  );
});

interface MobileControlsProps {
  currency: number;
  ultimate: number;
  onTouchStart: (key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => void;
  onTouchEnd: (key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => void;
}

export const MobileControls = React.memo(function MobileControls({
  currency,
  ultimate,
  onTouchStart,
  onTouchEnd,
}: MobileControlsProps) {
  return (
    <div className="w-full flex flex-col p-2 sm:p-4 mt-1 sm:mt-2 gap-2 touch-none">
      <div className="flex gap-1.5 w-full">
        <button 
          className={`flex-1 min-h-[40px] py-1.5 rounded-lg text-xs font-bold text-white pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer ${currency >= 50 ? 'bg-green-600 active:bg-green-500' : 'bg-slate-700 opacity-50'}`}
          onPointerDown={onTouchStart('q')}
          onPointerUp={onTouchEnd('q')}
          onPointerLeave={onTouchEnd('q')}
          onPointerCancel={onTouchEnd('q')}
        >
          ALLY(Q)
        </button>
        <button 
          className={`flex-1 min-h-[40px] py-1.5 rounded-lg text-xs font-bold text-white pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer ${ultimate >= 100 ? 'bg-yellow-600 active:bg-yellow-500' : 'bg-slate-700 opacity-50'}`}
          onPointerDown={onTouchStart('e')}
          onPointerUp={onTouchEnd('e')}
          onPointerLeave={onTouchEnd('e')}
          onPointerCancel={onTouchEnd('e')}
        >
          ULT({ultimate}%)
        </button>
        <button 
          className="flex-1 min-h-[40px] py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-700 active:bg-cyan-500 pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          onPointerDown={onTouchStart('c')}
          onPointerUp={onTouchEnd('c')}
          onPointerLeave={onTouchEnd('c')}
          onPointerCancel={onTouchEnd('c')}
          title="Cavitation Torpedo (C)"
        >
          TORP(C)
        </button>
        <button 
          className="flex-1 min-h-[40px] py-1.5 rounded-lg text-xs font-bold text-white bg-amber-700 active:bg-amber-500 pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          onPointerDown={onTouchStart('h')}
          onPointerUp={onTouchEnd('h')}
          onPointerLeave={onTouchEnd('h')}
          onPointerCancel={onTouchEnd('h')}
          title="Hydraulic Harpoon (H)"
        >
          HARP(H)
        </button>
      </div>

      <div className="flex gap-1.5 w-full items-center">
        <button 
          className="flex-1 min-h-[38px] py-1 rounded-lg text-[11px] font-bold text-purple-200 bg-purple-900/80 active:bg-purple-700 pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer border border-purple-500/30"
          onPointerDown={onTouchStart('1')}
          onPointerUp={onTouchEnd('1')}
          onPointerLeave={onTouchEnd('1')}
          onPointerCancel={onTouchEnd('1')}
          title="Weapons Officer: Ballistic Salvo (1)"
        >
          OFFICER 1
        </button>
        <button 
          className="flex-1 min-h-[38px] py-1 rounded-lg text-[11px] font-bold text-purple-200 bg-purple-900/80 active:bg-purple-700 pointer-events-auto touch-none select-none flex items-center justify-center cursor-pointer border border-purple-500/30"
          onPointerDown={onTouchStart('2')}
          onPointerUp={onTouchEnd('2')}
          onPointerLeave={onTouchEnd('2')}
          onPointerCancel={onTouchEnd('2')}
          title="Engineer: Ballast Shield (2)"
        >
          OFFICER 2
        </button>
        <button 
          className="flex-[2] min-h-[44px] py-2 bg-blue-600/80 active:bg-blue-400 rounded-xl flex items-center justify-center text-base sm:text-lg font-black text-white select-none touch-none shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer"
          onPointerDown={onTouchStart(' ')}
          onPointerUp={onTouchEnd(' ')}
          onPointerLeave={onTouchEnd(' ')}
          onPointerCancel={onTouchEnd(' ')}
        >
          FIRE!
        </button>
      </div>
    </div>
  );
});

interface MenuOverlayProps {
  highScore: number;
  deferredPrompt: any;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenManual: () => void;
  onInstallClick: () => void;
}

export const MenuOverlay = React.memo(function MenuOverlay({
  highScore,
  deferredPrompt,
  onStartGame,
  onOpenShop,
  onOpenManual,
  onInstallClick,
}: MenuOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg z-20">
      <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-4 tracking-wider uppercase text-center px-4">
        Water Invader
      </h1>
      {highScore > 0 && (
        <p className="text-xl text-yellow-400 font-bold mb-8">HIGH SCORE: {highScore}</p>
      )}
      <div className="flex flex-col gap-4">
        <button 
          onClick={onStartGame}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl sm:text-2xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105"
        >
          START GAME
        </button>
        <button 
          onClick={onOpenShop}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105"
        >
          ARMORY / SHOP (정비소)
        </button>
        <button 
          onClick={onOpenManual}
          className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-lg transition-all"
        >
          HOW TO PLAY
        </button>
        {deferredPrompt && (
          <button 
            onClick={onInstallClick}
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
  );
});

interface ManualModalProps {
  onClose: () => void;
}

export const ManualModal = React.memo(function ManualModal({
  onClose,
}: ManualModalProps) {
  return (
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
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Flagship Submersible Arsenal & Crew Tactics</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm sm:text-base">
              <li><strong className="text-cyan-300">Cavitation Torpedo [C / X]:</strong> Launch hyperbaric cavitation torpedoes. Detonates manually or on impact, creating a massive sub-bass shockwave implosion.</li>
              <li><strong className="text-emerald-300">Bioluminescent Laser [Continuous Space / Hold Click]:</strong> Sustained coherent beam that incinerates targets and lights up dark abyssal zones.</li>
              <li><strong className="text-amber-300">Hydraulic Harpoon [H / Shift / Right-Click]:</strong> Heavy steel harpoon tether. Grapple leviathans and drag them into explosive hydrothermal vents!</li>
              <li><strong className="text-blue-300">Active Sonar Sweep [S]:</strong> Sweeps acoustic pings through pitch-black Biolapse darkness cycles to reveal hidden Hadal horrors.</li>
              <li><strong className="text-purple-300">Crew Officer Bridge [1, 2, 3, 4]:</strong>
                <br />• <strong>[1] Weapons Officer:</strong> Ballistic salvo & hyper-cavitation overdrive
                <br />• <strong>[2] Engineer:</strong> Kinetic ramming shield & emergency ballast purge
                <br />• <strong>[3] Sonar Tech:</strong> Acoustic pulse burst & high-velocity target lock
                <br />• <strong>[4] Biologist:</strong> Bioluminescent flare & acid neutralizer
              </li>
              <li><strong className="text-rose-400">Deep-Sea Factions & Boss:</strong> Face off against Hadal Bio-Horrors, the Automaton Phalanx, and the multi-phase Kraken Prime leviathan!</li>
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
          onClick={onClose}
          className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xl transition-all"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
});

interface ShopModalProps {
  currency: number;
  hp: number;
  upgrades: { fireRate: number; multiShot: number; piercing: number; hasAcidShield?: boolean; homingMissiles?: number };
  onBuyFireRate: () => void;
  onBuyMultiShot: () => void;
  onBuyPiercing: () => void;
  onBuyAcidShield?: () => void;
  onBuyHomingMissiles?: () => void;
  onRepairTank: () => void;
  onNextWave: () => void;
  isPreGame?: boolean;
  isContinue?: boolean;
  wave?: number;
  lang: string;
}

export const ShopModal = React.memo(function ShopModal({
  currency,
  hp,
  upgrades,
  onBuyFireRate,
  onBuyMultiShot,
  onBuyPiercing,
  onBuyAcidShield,
  onBuyHomingMissiles,
  onRepairTank,
  onNextWave,
  isPreGame,
  isContinue,
  wave,
  lang,
}: ShopModalProps) {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

  const title = isContinue
    ? t('정비소 / 무기고 (이어하기)', 'ARMORY & WORKSHOP (CONTINUE)')
    : (isPreGame ? t('정비소 / 무기고', 'ARMORY & WORKSHOP') : t('웨이브 클리어', 'WAVE CLEARED'));

  const subtitle = isContinue
    ? t('전투 재개 전 무기와 체력을 정비하세요!', `Prepare weapons & restore HP before resuming Wave ${wave || 1}!`)
    : (isPreGame ? t('출격 전 무기를 업그레이드하세요!', 'Prepare weapons before deploying!') : t('다음 웨이브를 준비하세요!', 'Prepare for next wave!'));

  const actionButtonText = isContinue
    ? t('전투 재개 (RESUME WAVE)', 'RESUME WAVE')
    : (isPreGame ? t('웨이브 1 출격', 'START MISSION (DEPLOY TO WAVE 1)') : t('다음 웨이브', 'NEXT WAVE'));

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-lg z-20 p-2 sm:p-4">
      <div className="w-full max-h-[85vh] sm:max-h-[90%] overflow-y-auto flex flex-col items-center custom-scrollbar py-2 px-1">
        <h1 className="text-2xl sm:text-5xl font-black text-blue-400 mb-1 sm:mb-2 text-center">
          {title}
        </h1>
        <p className="text-xs sm:text-2xl text-white mb-2 sm:mb-6 text-center px-2">
          {subtitle}
        </p>
        
        <ShopUpgradePanel
          currency={currency}
          hp={hp}
          upgrades={upgrades}
          onBuyFireRate={onBuyFireRate}
          onBuyMultiShot={onBuyMultiShot}
          onBuyPiercing={onBuyPiercing}
          onBuyAcidShield={onBuyAcidShield}
          onBuyHomingMissiles={onBuyHomingMissiles}
          onRepairTank={onRepairTank}
          lang={lang}
        />
        
        <button 
          data-testid={isContinue ? "resume-wave-button" : (isPreGame ? "start-mission-button" : "next-wave-button")}
          id={isContinue ? "resume-wave-button" : (isPreGame ? "start-mission-btn" : "next-wave-button")}
          onClick={onNextWave}
          className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-base sm:text-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] mt-2 shrink-0 mb-3 cursor-pointer active:scale-95"
        >
          {actionButtonText}
        </button>
      </div>
    </div>
  );
});

interface GameOverModalProps {
  score: number;
  currency: number;
  hp: number;
  gameOverReason: string;
  upgrades: { fireRate: number; multiShot: number; piercing: number; hasAcidShield?: boolean; homingMissiles?: number };
  onBuyFireRate: () => void;
  onBuyMultiShot: () => void;
  onBuyPiercing: () => void;
  onBuyAcidShield?: () => void;
  onBuyHomingMissiles?: () => void;
  onRepairTank: () => void;
  onContinue: () => void;
  onRestart?: () => void;
  onPlayAgain?: () => void;
  lang: string;
}

export const GameOverModal = React.memo(function GameOverModal({
  score,
  currency,
  hp,
  gameOverReason,
  upgrades,
  onBuyFireRate,
  onBuyMultiShot,
  onBuyPiercing,
  onBuyAcidShield,
  onBuyHomingMissiles,
  onRepairTank,
  onContinue,
  onRestart,
  onPlayAgain,
  lang,
}: GameOverModalProps) {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);
  const handleRestart = onRestart || onPlayAgain;
  // In GameOverModal, baseline revived HP starts at 3/5 when player HP was <= 0 upon death
  const displayHp = hp <= 0 ? 3 : hp;

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-lg z-20 p-2 sm:p-4">
      <div className="w-full max-h-[85vh] sm:max-h-[90%] overflow-y-auto flex flex-col items-center custom-scrollbar py-2 px-1">
        <h1 className="text-3xl sm:text-5xl font-black text-red-500 mb-1 sm:mb-2 text-center">GAME OVER</h1>
        {gameOverReason && (
          <p className="text-xs sm:text-xl text-red-300 font-bold mb-2 sm:mb-4 text-center px-2">{gameOverReason}</p>
        )}
        <p className="text-lg sm:text-2xl text-white mb-2 sm:mb-6 text-center">Final {t('점수:', 'Score:')} {score}</p>
        
        <ShopUpgradePanel
          currency={currency}
          hp={displayHp}
          upgrades={upgrades}
          onBuyFireRate={onBuyFireRate}
          onBuyMultiShot={onBuyMultiShot}
          onBuyPiercing={onBuyPiercing}
          onBuyAcidShield={onBuyAcidShield}
          onBuyHomingMissiles={onBuyHomingMissiles}
          onRepairTank={onRepairTank}
          lang={lang}
        />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center mt-2 mb-3 w-full max-w-md px-2 shrink-0">
          <button 
            data-testid="continue-button"
            id="continue-btn"
            onClick={onContinue}
            className="w-full sm:w-1/2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-sm sm:text-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center cursor-pointer shrink-0"
          >
            <span>{t('이어하기', 'Continue')}</span>
            <span className="text-xs font-normal text-emerald-200 mt-0.5">{t('현재 웨이브 유지 (Continue)', 'Resume current wave')}</span>
          </button>
          
          <button 
            data-testid="restart-button"
            id="restart-btn"
            onClick={handleRestart}
            className="w-full sm:w-1/2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-lg text-sm sm:text-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center cursor-pointer shrink-0"
          >
            <span>{t('처음부터 시작', 'Restart from Beginning')}</span>
            <span className="text-xs font-normal text-red-200 mt-0.5">{t('웨이브 1 리셋 (PLAY AGAIN)', 'Reset to Wave 1 (PLAY AGAIN)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Main GameCanvas Component
// ============================================================================

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

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
  const [crisisState, setCrisisState] = useState<CrisisState | null>(null);
  const [endGameCrisisState, setEndGameCrisisState] = useState<EndGameCrisisState | null>(null);
  const [alliedReinforcementBanner, setAlliedReinforcementBanner] = useState<{ active: boolean; text: string }>({ active: false, text: '' });
  const [squadronStatus, setSquadronStatus] = useState<{ total: number; fighters: number; medics: number; repairers: number; tanks: number }>({
    total: 0,
    fighters: 0,
    medics: 0,
    repairers: 0,
    tanks: 0,
  });
  
  const [showManual, setShowManual] = useState(false);
  const showManualRef = useRef(false);
  showManualRef.current = showManual;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [lang, setLang] = useState('ko');
  const [upgrades, setUpgrades] = useState({ fireRate: 1, multiShot: 1, piercing: 1, hasAcidShield: false });
  const [isPreGameShop, setIsPreGameShop] = useState(false);
  const [isContinueShop, setIsContinueShop] = useState(false);

  const handleToggleMute = useCallback(() => {
    soundManager.init();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleOpenManual = useCallback(() => {
    gameManagerRef.current?.pause();
    setShowManual(true);
  }, []);

  const handleCloseManual = useCallback(() => {
    setShowManual(false);
    if (gameManagerRef.current?.state === GameState.PLAYING) {
      gameManagerRef.current?.resume();
    }
  }, []);

  useEffect(() => {
    const navLang = navigator.language || 'ko';
    if (navLang.startsWith('en')) {
      setLang('en');
    } else {
      setLang('ko');
    }
  }, []);

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

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt]);

  const getSafeStoredHighScore = useCallback((): number => {
    try {
      const saved = localStorage.getItem('waterInvaderHighScore');
      if (!saved) return 0;
      const parsed = parseInt(saved, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    setHighScore(getSafeStoredHighScore());
  }, [getSafeStoredHighScore]);

  // Mobile touch & drag evasion control refs
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const game = new GameManager(canvas);
    gameManagerRef.current = game;
    if (typeof window !== 'undefined') {
      (window as any).gameManager = game;
    }
    
    game.onStateChange = (state) => {
      setGameState(state);
      if (state !== GameState.SHOP) {
        setIsContinueShop(false);
      }
      if (state !== GameState.PLAYING) {
        activePointerIdRef.current = null;
        lastPointerXRef.current = null;
        isDraggingRef.current = false;
      }
      if (state === GameState.GAME_OVER) {
        setHighScore(getSafeStoredHighScore());
        setGameOverReason(game.gameOverReason);
        if (game.player && game.player.hp <= 0) {
          game.player.hp = 3;
          setHp(3);
        }
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
    game.onCrisisEvent = (crisis) => {
      setCrisisState(crisis ? { ...crisis } : null);
    };
    game.onEndGameCrisisEvent = (crisis) => {
      setEndGameCrisisState(crisis ? { ...crisis } : null);
    };
    game.onAlliedReinforcements = (active, text) => {
      setAlliedReinforcementBanner({ active, text });
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
      } else {
        // Ensure AudioContext resumes if sound is active upon returning to tab
        if (!soundManager.isMuted) {
          soundManager.init();
        }
      }
    };
    const handleResize = () => {
      // Re-anchor pointer drag on resize / orientation change so layout changes don't cause coordinate delta jump
      lastPointerXRef.current = null;
      game.resize();
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
      gameManagerRef.current = null;
      if (typeof window !== 'undefined') {
        (window as any).gameManager = null;
      }
    };
  }, [getSafeStoredHighScore]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      setSquadronStatus({ total: 0, fighters: 0, medics: 0, repairers: 0, tanks: 0 });
      return;
    }
    const syncAllies = () => {
      if (gameManagerRef.current) {
        const helpers = gameManagerRef.current.helpers || [];
        const total = helpers.length;
        let fighters = 0;
        let medics = 0;
        let repairers = 0;
        let tanks = 0;
        for (let i = 0; i < helpers.length; i++) {
          const type = helpers[i].type;
          if (type === 0) fighters++;
          else if (type === 3) medics++;
          else if (type === 1) repairers++;
          else if (type === 2) tanks++;
        }

        setSquadronStatus(prev => {
          if (
            prev.total === total &&
            prev.fighters === fighters &&
            prev.medics === medics &&
            prev.repairers === repairers &&
            prev.tanks === tanks
          ) {
            return prev;
          }
          return { total, fighters, medics, repairers, tanks };
        });

        const bannerTimer = gameManagerRef.current.alliedReinforcementBannerTimer || 0;
        const bannerText = gameManagerRef.current.alliedReinforcementBannerText || '✦ MASSIVE ALLIED REINFORCEMENTS ARRIVED! ✦';
        if (bannerTimer > 0) {
          setAlliedReinforcementBanner(prev => {
            if (prev.active && prev.text === bannerText) return prev;
            return { active: true, text: bannerText };
          });
        } else {
          setAlliedReinforcementBanner(prev => (prev.active ? { active: false, text: '' } : prev));
        }
      }
    };
    syncAllies();
    const interval = setInterval(syncAllies, 200);
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = useCallback(() => {
    setIsPreGameShop(false);
    gameManagerRef.current?.init(false, true);
    if (gameManagerRef.current) {
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
    gameManagerRef.current?.startGame();
  }, []);

  const handleContinueToShop = useCallback(() => {
    if (gameStateRef.current !== GameState.GAME_OVER) return;
    setIsPreGameShop(false);
    setIsContinueShop(true);
    if (gameManagerRef.current) {
      const currentHpBefore = gameManagerRef.current.player ? gameManagerRef.current.player.hp : 3;
      gameManagerRef.current.prepareContinue();
      if (gameManagerRef.current.player && currentHpBefore > 3) {
        gameManagerRef.current.player.hp = Math.max(currentHpBefore, gameManagerRef.current.player.hp);
      }
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      setScore(gameManagerRef.current.score);
      setWave(gameManagerRef.current.level);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
    setGameState(GameState.SHOP);
  }, []);

  const handleResumeContinuedWave = useCallback(() => {
    if (gameStateRef.current !== GameState.SHOP) return;
    setIsContinueShop(false);
    setIsPreGameShop(false);
    if (gameManagerRef.current) {
      gameManagerRef.current.continueGame();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      setScore(gameManagerRef.current.score);
      setWave(gameManagerRef.current.level);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
    setGameState(GameState.PLAYING);
  }, []);

  const continueGame = useCallback(() => {
    setIsPreGameShop(false);
    setIsContinueShop(false);
    if (gameManagerRef.current) {
      gameManagerRef.current.continueGame();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      setScore(gameManagerRef.current.score);
      setWave(gameManagerRef.current.level);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
    setGameState(GameState.PLAYING);
  }, []);

  const restartFromBeginning = useCallback(() => {
    setIsPreGameShop(false);
    if (gameManagerRef.current) {
      gameManagerRef.current.restartFromBeginning();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      setScore(gameManagerRef.current.score);
      setWave(gameManagerRef.current.level);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
  }, []);

  const handleOpenPreGameShop = useCallback(() => {
    if (gameManagerRef.current) {
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
    setIsPreGameShop(true);
    setGameState(GameState.SHOP);
  }, []);

  const buyFireRate = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeFireRate();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  }, []);

  const buyMultiShot = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeMultiShot();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  }, []);

  const buyPiercing = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradePiercing();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  }, []);

  const buyAcidShield = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeAcidShield();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  }, []);

  const buyHomingMissiles = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.upgradeHomingMissiles();
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
    }
  }, []);

  const repairTank = useCallback(() => {
    const game = gameManagerRef.current;
    if (game) {
      if (game.player && game.player.hp <= 0) {
        game.player.hp = 3;
      }
      if (game.repairTank()) {
        setUpgrades(game.getUpgrades());
        setCurrency(game.currency);
        if (game.player) {
          setHp(game.player.hp);
        }
      }
    }
  }, []);

  const startNextWave = useCallback(() => {
    gameManagerRef.current?.startNextWave();
  }, []);

  const updateTargetX = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
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
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== GameState.PLAYING || !canvasRef.current || !gameManagerRef.current) return;
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

    // Forward pointer down to Flagship systems (Modals, Torpedo right-click, etc.)
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const scaleX = gameManagerRef.current.logicalWidth / (canvas.clientWidth || rect.width);
      const scaleY = gameManagerRef.current.logicalHeight / (canvas.clientHeight || rect.height);
      const logicalX = (e.clientX - rect.left) * scaleX;
      const logicalY = (e.clientY - rect.top) * scaleY;
      gameManagerRef.current.handlePointer(logicalX, logicalY, true, e.button);
    }

    // Start auto-firing on canvas touch
    gameManagerRef.current.handleKeyDown(' ');
    updateTargetX(e);
  }, [updateTargetX]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== GameState.PLAYING || !canvasRef.current || !gameManagerRef.current) return;
    // Only track the active dragging pointer (or any pointer if not locked)
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    if (e.buttons > 0 || e.pointerType === 'touch' || isDraggingRef.current) {
      updateTargetX(e);
    }
  }, [updateTargetX]);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only release if the event corresponds to the active pointer or if no specific pointer is tracked
    if (activePointerIdRef.current === e.pointerId || activePointerIdRef.current === null || e.pointerId === undefined) {
      try {
        if (e.currentTarget?.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }

      if (canvasRef.current && gameManagerRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const scaleX = gameManagerRef.current.logicalWidth / (canvas.clientWidth || rect.width);
          const scaleY = gameManagerRef.current.logicalHeight / (canvas.clientHeight || rect.height);
          const logicalX = (e.clientX - rect.left) * scaleX;
          const logicalY = (e.clientY - rect.top) * scaleY;
          gameManagerRef.current.handlePointer(logicalX, logicalY, false, e.button);
        }
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
  }, []);

  const handleTouchStart = useCallback((key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
    if (showManualRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    gameManagerRef.current?.handleKeyDown(key);
  }, []);

  const handleTouchEnd = useCallback((key: string) => (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
    if (showManualRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    gameManagerRef.current?.handleKeyUp(key);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">
      {/* 1. Dedicated Canvas Viewport Container (Isolated from Mobile Controls) */}
      <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
        {/* Canvas Viewport (Memoized container, DPR buffer sizing protected) */}
        <CanvasCore
          canvasRef={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
        />

        {/* Top HUD (Memoized) */}
        <TopHUD
          score={score}
          currency={currency}
          wave={wave}
          invaderCount={invaderCount}
          rogueCount={rogueCount}
          hp={hp}
          isMuted={isMuted}
          combo={combo}
          ultimate={ultimate}
          gameState={gameState}
          onToggleMute={handleToggleMute}
          lang={lang}
        />

        {/* Allied Reinforcement Squadron Status HUD */}
        {gameState === GameState.PLAYING && squadronStatus.total > 0 && (
          <div
            data-testid="ally-squadron-hud"
            className="absolute top-20 sm:top-24 left-2 sm:left-4 pointer-events-none z-30 px-3 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/80 text-white text-xs font-mono flex items-center gap-2 shadow-[0_0_12px_rgba(34,197,94,0.5)] select-none backdrop-blur-sm"
          >
            <span className="font-bold text-emerald-400">🛡️ ALLIES ({squadronStatus.total}):</span>
            <div className="flex items-center gap-2 text-[11px]">
              {squadronStatus.fighters > 0 && (
                <span className="text-green-300 font-semibold flex items-center gap-0.5">
                  ⚔️ {squadronStatus.fighters}
                </span>
              )}
              {squadronStatus.medics > 0 && (
                <span className="text-cyan-300 font-semibold flex items-center gap-0.5">
                  💚 {squadronStatus.medics}
                </span>
              )}
              {squadronStatus.repairers > 0 && (
                <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                  🔧 {squadronStatus.repairers}
                </span>
              )}
              {squadronStatus.tanks > 0 && (
                <span className="text-purple-300 font-semibold flex items-center gap-0.5">
                  🛡️ {squadronStatus.tanks}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Massive Allied Reinforcements Arrival Banner */}
        {gameState === GameState.PLAYING && alliedReinforcementBanner.active && (
          <div
            data-testid="allied-reinforcement-banner"
            className="absolute inset-x-4 top-24 pointer-events-none z-30 flex flex-col items-center justify-center border-2 border-emerald-400 shadow-[0_0_30px_rgba(34,197,94,0.8)] animate-pulse rounded-xl bg-slate-950/95 py-3 px-4 text-center"
          >
            <div className="text-emerald-400 font-black text-xs sm:text-sm tracking-widest uppercase mb-0.5 flex items-center justify-center gap-2">
              <span>✦</span> SQUADRON WARP CONVERGENCE <span>✦</span>
            </div>
            <div className="text-white font-black text-sm sm:text-base tracking-wide text-emerald-100">
              {alliedReinforcementBanner.text || '✦ MASSIVE ALLIED REINFORCEMENTS ARRIVED! ✦'}
            </div>
            <div className="text-amber-300 font-bold text-[11px] mt-1">
              [SQUADRON DEPLOYED: FIGHTERS, MEDICS & REPAIR BOTS ON STATION]
            </div>
          </div>
        )}

        {/* Stellaris-Style End-Game Crisis Warning Banner Overlay */}
        {gameState === GameState.PLAYING && endGameCrisisState && (endGameCrisisState.phase === CrisisPhase.INCURSION || endGameCrisisState.warningTimer > 0) && (
          <div
            data-testid="endgame-crisis-warning-banner"
            className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-purple-500/90 shadow-[inset_0_0_80px_rgba(168,85,247,0.8)] animate-pulse rounded-lg bg-purple-950/40"
          >
            <div className="bg-slate-950/95 border-2 border-purple-500 px-6 py-5 rounded-2xl text-center shadow-[0_0_40px_rgba(168,85,247,0.9)] max-w-lg mx-4">
              <div className="text-purple-400 font-black text-xs sm:text-sm tracking-widest uppercase mb-1 flex items-center justify-center gap-2">
                <span>⚡</span> STELLARIS-STYLE END-GAME CRISIS INCURSION <span>⚡</span>
              </div>
              <div className="text-white font-black text-xl sm:text-2xl text-purple-100 tracking-wider my-1">
                {endGameCrisisState.bannerText || 'DIMENSIONAL WARP CONVERGENCE IMMINENT'}
              </div>
              <div className="text-amber-400 font-black text-xs sm:text-sm mt-2 animate-bounce">
                WARP CONVERGENCE IN: {endGameCrisisState.warningTimer.toFixed(1)}s
              </div>
            </div>
          </div>
        )}

        {/* Active Status Badges Stack Container (Staggered / Flex column to prevent overlapping) */}
        {gameState === GameState.PLAYING && (
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1.5 w-max max-w-[90%]">
            {/* Stellaris-Style End-Game Crisis Active Badge Indicator */}
            {endGameCrisisState && endGameCrisisState.isActive && endGameCrisisState.phase !== CrisisPhase.INCURSION && endGameCrisisState.phase !== CrisisPhase.DEFEATED && (
              <div
                data-testid="endgame-crisis-active-badge"
                className="px-4 py-1 sm:px-5 sm:py-1.5 rounded-full bg-purple-950/95 border-2 border-purple-400 text-purple-200 text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-pulse select-none"
              >
                <span>🌌</span>
                <span>
                  {endGameCrisisState.phase === CrisisPhase.PHASE_1_SHIELD
                    ? 'PHASE 1: DIMENSIONAL SHIELD ACTIVE'
                    : endGameCrisisState.phase === CrisisPhase.PHASE_2_HULL
                    ? 'PHASE 2: SOVEREIGN HULL EXPOSED'
                    : `PHASE 3: CORE OVERDRIVE (${Math.ceil(endGameCrisisState.enrageTimer)}s)`}
                </span>
                <span>🌌</span>
              </div>
            )}

            {/* EMP Suppression Visual Indicator */}
            {crisisState && crisisState.empSuppressionActive && (
              <div
                data-testid="emp-suppression-badge"
                className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse select-none"
              >
                <span>⚡</span> WEAPONS SUPPRESSED (EMP ACTIVE) <span>⚡</span>
              </div>
            )}

            {/* Toxic Acid Storm Indicator */}
            {crisisState && crisisState.activeCrisis === 'ACID_STORM' && crisisState.warningTimer <= 0 && (
              <div
                data-testid="acid-storm-badge"
                className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-lime-950/90 border border-lime-400 text-lime-300 text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(132,204,22,0.6)] animate-pulse select-none"
              >
                <span>☣️</span> TOXIC ACID STORM ACTIVE <span>☣️</span>
              </div>
            )}
          </div>
        )}

        {/* Crisis Warning Banner Overlay */}
        {gameState === GameState.PLAYING && crisisState && crisisState.warningTimer > 0 && (
          <div
            data-testid="crisis-warning-banner"
            className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-red-500/90 shadow-[inset_0_0_60px_rgba(239,68,68,0.7)] animate-pulse rounded-lg bg-red-950/30"
          >
            <div className="bg-red-950/95 border-2 border-red-500 px-6 py-4 rounded-xl text-center shadow-[0_0_30px_rgba(239,68,68,0.8)] max-w-md mx-4">
              <div className="text-red-400 font-black text-xs sm:text-sm tracking-widest uppercase mb-1 flex items-center justify-center gap-2">
                <span>🚨</span> EMERGENCY CRISIS DETECTED <span>🚨</span>
              </div>
              <div className="text-white font-black text-lg sm:text-2xl text-red-100 tracking-wide">
                {crisisState.bannerText || crisisState.activeCrisis}
              </div>
              <div className="text-amber-400 font-black text-xs sm:text-sm mt-2 animate-bounce">
                IMMINENT THREAT ARRIVAL: {crisisState.warningTimer.toFixed(1)}s
              </div>
            </div>
          </div>
        )}

        {/* Main Menu Overlay */}
        {gameState === GameState.MENU && (
          <MenuOverlay
            highScore={highScore}
            deferredPrompt={deferredPrompt}
            onStartGame={startGame}
            onOpenShop={handleOpenPreGameShop}
            onOpenManual={handleOpenManual}
            onInstallClick={handleInstallClick}
          />
        )}

        {/* How To Play Manual Modal */}
        {showManual && (
          <ManualModal onClose={handleCloseManual} />
        )}

        {/* Shop Modal (Between Waves & Pre-Game & Continue) */}
        {gameState === GameState.SHOP && (
          <ShopModal
            currency={currency}
            hp={hp}
            upgrades={upgrades}
            onBuyFireRate={buyFireRate}
            onBuyMultiShot={buyMultiShot}
            onBuyPiercing={buyPiercing}
            onBuyAcidShield={buyAcidShield}
            onBuyHomingMissiles={buyHomingMissiles}
            onRepairTank={repairTank}
            onNextWave={isContinueShop ? handleResumeContinuedWave : (isPreGameShop ? startGame : startNextWave)}
            isPreGame={isPreGameShop}
            isContinue={isContinueShop}
            wave={wave}
            lang={lang}
          />
        )}

        {/* Game Over Modal */}
        {gameState === GameState.GAME_OVER && (
          <GameOverModal
            score={score}
            currency={currency}
            hp={hp}
            gameOverReason={gameOverReason}
            upgrades={upgrades}
            onBuyFireRate={buyFireRate}
            onBuyMultiShot={buyMultiShot}
            onBuyPiercing={buyPiercing}
            onBuyAcidShield={buyAcidShield}
            onBuyHomingMissiles={buyHomingMissiles}
            onRepairTank={repairTank}
            onContinue={handleContinueToShop}
            onRestart={restartFromBeginning}
            onPlayAgain={restartFromBeginning}
            lang={lang}
          />
        )}
      </div>

      {/* 2. Mobile Controls (Positioned outside and below the canvas container) */}
      {gameState === GameState.PLAYING && (
        <div data-testid="mobile-controls-wrapper" className="w-full max-w-[600px]">
          <MobileControls
            currency={currency}
            ultimate={ultimate}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      )}
    </div>
  );
}
