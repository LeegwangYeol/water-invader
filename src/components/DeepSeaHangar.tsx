'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChassisId, ChassisRadarStats } from '../game/flagship/types';
import { ChassisRadarChart } from '../game/flagship/progression/ChassisRadarChart';
import { GameManager } from '../game/GameManager';

export interface ChassisUIData {
  id: ChassisId;
  nameKo: string;
  nameEn: string;
  badgeKo: string;
  badgeEn: string;
  color: string;
  baseHp: number;
  maxHp: number;
  speed: string;
  hitbox: string;
  passiveNameKo: string;
  passiveNameEn: string;
  passiveDescKo: string;
  passiveDescEn: string;
  stats: ChassisRadarStats;
}

export const CHASSIS_SPECS: Record<ChassisId, ChassisUIData> = {
  [ChassisId.NAUTILUS]: {
    id: ChassisId.NAUTILUS,
    nameKo: '노틸러스 드레드노트',
    nameEn: 'Nautilus Dreadnought',
    badgeKo: '요새형 결전함',
    badgeEn: 'JUGGERNAUT TANK',
    color: '#f59e0b',
    baseHp: 7,
    maxHp: 9,
    speed: '220 px/s (-26.7%)',
    hitbox: '64 x 46 px',
    passiveNameKo: '이지스 격벽 (Aegis Bulkhead)',
    passiveNameEn: 'Aegis Bulkhead',
    passiveDescKo: '피격 데미지 -1 고정 감소. 체력 2 이하 시 탄막을 증발시키는 고압 증기 충격파 방출 및 1.5초 무적.',
    passiveDescEn: '-1 flat damage mitigation. At <= 2 HP, emits bullet-clearing steam shockwave (120px) + 1.5s i-frames.',
    stats: { speed: 45, armor: 95, hardpoints: 80, energy: 50, hitboxProfile: 35, salvage: 60 },
  },
  [ChassisId.STINGRAY]: {
    id: ChassisId.STINGRAY,
    nameKo: '스팅레이 요격정',
    nameEn: 'Stingray Interceptor',
    badgeKo: '고기동 회피형',
    badgeEn: 'SPEED & EVASION',
    color: '#38bdf8',
    baseHp: 3,
    maxHp: 4,
    speed: '420 px/s (+40%)',
    hitbox: '38 x 30 px (-43%)',
    passiveNameKo: '캐비테이션 슬립스트림 (Cavitation Slipstream)',
    passiveNameEn: 'Cavitation Slipstream',
    passiveDescKo: '좌우 기동 시 오버드라이브 축적, 100% 충전 사격 시 관통 랜스 발사 + 0.5초 무적. 기본 연사속도 +25%.',
    passiveDescEn: 'Lateral movement charges overdrive; firing at 100% unleashes piercing cavitation lance + 0.5s i-frames. +25% fire rate.',
    stats: { speed: 95, armor: 30, hardpoints: 65, energy: 85, hitboxProfile: 90, salvage: 50 },
  },
  [ChassisId.LEVIATHAN]: {
    id: ChassisId.LEVIATHAN,
    nameKo: '레비아탄 수확정',
    nameEn: 'Leviathan Harvester',
    badgeKo: '자원 채굴 특화',
    badgeEn: 'ECONOMY & SUSTAIN',
    color: '#eab308',
    baseHp: 6,
    maxHp: 7,
    speed: '270 px/s (-10%)',
    hitbox: '54 x 42 px',
    passiveNameKo: '순수 수자원 응축기 (Pure Water Condenser)',
    passiveNameEn: 'Pure Water Condenser',
    passiveDescKo: '전 화면 순수 수자원 흡인 마그넷 탑재 (+35% 몹, +50% 보스). 100 💧 획득마다 +1 HP 수복 또는 폭발 탄환 3회.',
    passiveDescEn: 'Full-screen water magnet (+35% mobs, +50% boss/elites). Every 100 water restores +1 HP or empowers 3 explosive shots.',
    stats: { speed: 55, armor: 80, hardpoints: 70, energy: 60, hitboxProfile: 45, salvage: 95 },
  },
  [ChassisId.GHOST]: {
    id: ChassisId.GHOST,
    nameKo: '고스트 은폐함',
    nameEn: 'Ghost Stealth Sub',
    badgeKo: '암습 & 위상 차폐',
    badgeEn: 'AMBUSH & PHASING',
    color: '#a855f7',
    baseHp: 4,
    maxHp: 5,
    speed: '320 px/s (+6.7%)',
    hitbox: '46 x 34 px',
    passiveNameKo: '소나 클록 (Sonar Cloak)',
    passiveNameEn: 'Sonar Cloak',
    passiveDescKo: '사격 1.5초 중단 시 70% 투명 위상 은폐. 은폐 해제 첫 공격 시 300% 치명타 유도 음파탄 발사. 피격 무적 2.2초.',
    passiveDescEn: 'Ceasing fire for 1.5s activates 70% translucent cloak. First shot out of cloak unleashes 300% critical ambush wave.',
    stats: { speed: 75, armor: 45, hardpoints: 60, energy: 90, hitboxProfile: 75, salvage: 55 },
  },
  [ChassisId.KRAKEN]: {
    id: ChassisId.KRAKEN,
    nameKo: '크라켄 바이오쉽',
    nameEn: 'Kraken Bioship',
    badgeKo: '생체 재생 & 근접 방호',
    badgeEn: 'ORGANIC REGEN & CQB',
    color: '#10b981',
    baseHp: 5,
    maxHp: 6,
    speed: '240~360 px/s (맥동)',
    hitbox: '50 x 40 px',
    passiveNameKo: '생체 촉수 방호 & 먹물 분사 (Tentacle Defense)',
    passiveNameEn: 'Tentacle Defense & Ink',
    passiveDescKo: '산성 비/유독 물질 100% 완전 면역. 90px 내 자동 촉수 타격. 25초 비전투 시 1 HP 자동 회복. 피격 시 적 탄속 60% 감속 먹물.',
    passiveDescEn: '100% acid rain immunity. Auto-lashes enemies in 90px. +1 HP regen every 25s out of combat. Emits bullet-slowing ink cloud.',
    stats: { speed: 65, armor: 60, hardpoints: 75, energy: 70, hitboxProfile: 60, salvage: 70 },
  },
};

export interface DeepSeaHangarProps {
  gameManager?: GameManager | null;
  lang: string;
  onChassisSelect?: (chassisId: ChassisId) => void;
}

export const DeepSeaHangar: React.FC<DeepSeaHangarProps> = ({
  gameManager,
  lang,
  onChassisSelect,
}) => {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

  // Initial active chassis from manager if present, otherwise NAUTILUS
  const initialId = (gameManager?.flagshipManager?.modularChassis?.activeChassis?.id as ChassisId) || ChassisId.NAUTILUS;
  const [selectedId, setSelectedId] = useState<ChassisId>(initialId);
  const [comparisonId, setComparisonId] = useState<ChassisId | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animProgressRef = useRef<number>(1.0);
  const animFrameIdRef = useRef<number>(0);

  // Sync selectedId with active chassis from gameManager on mount or prop change
  useEffect(() => {
    if (gameManager?.flagshipManager?.modularChassis?.activeChassis?.id) {
      setSelectedId(gameManager.flagshipManager.modularChassis.activeChassis.id as ChassisId);
    }
  }, [gameManager]);

  // Animate and render radar chart
  const renderChart = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeSpec = CHASSIS_SPECS[selectedId];
    const comparisonSpec = comparisonId && comparisonId !== selectedId ? CHASSIS_SPECS[comparisonId] : undefined;

    ChassisRadarChart.render(ctx, 150, 105, 68, activeSpec.stats, {
      comparisonStats: comparisonSpec?.stats,
      chassisName: activeSpec.nameEn,
      strokeColor: activeSpec.color,
      accentColor: activeSpec.color,
      fillColor: activeSpec.color === '#f59e0b' ? 'rgba(245, 158, 11, 0.22)' :
                 activeSpec.color === '#38bdf8' ? 'rgba(56, 189, 248, 0.22)' :
                 activeSpec.color === '#eab308' ? 'rgba(234, 179, 8, 0.22)' :
                 activeSpec.color === '#a855f7' ? 'rgba(168, 85, 247, 0.22)' :
                 'rgba(16, 185, 129, 0.22)',
      animProgress: progress,
      showLabels: true,
      showValues: true,
      showGrid: true,
    });
  }, [selectedId, comparisonId]);

  // Trigger smooth animation on chassis change
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 300; // ms

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1.0, elapsed / duration);
      animProgressRef.current = progress;

      renderChart(progress);

      if (progress < 1.0) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [selectedId, renderChart]);

  const handleSelect = (id: ChassisId) => {
    if (id === selectedId) return;
    setComparisonId(selectedId);
    setSelectedId(id);

    if (gameManager) {
      gameManager.selectChassis(id);
    } else if (typeof window !== 'undefined' && (window as any).flagshipManager?.modularChassis) {
      (window as any).flagshipManager.modularChassis.selectChassis(id);
      if ((window as any).gameManager?.player) {
        (window as any).flagshipManager.modularChassis.applyToPlayer((window as any).gameManager.player);
      }
    }

    if (onChassisSelect) {
      onChassisSelect(id);
    }
  };

  const activeSpec = CHASSIS_SPECS[selectedId];

  return (
    <div className="bg-slate-900/90 border border-cyan-800/60 p-3 sm:p-5 rounded-xl mb-3 text-white w-full max-w-sm shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-700/40 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <h2 className="text-sm sm:text-base font-black tracking-wide text-cyan-300 font-mono">
            {t('심해 격납고 (MODULAR CHASSIS)', 'DEEP-SEA HANGAR (MODULAR HULL)')}
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
          5 HULLS AVAILABLE
        </span>
      </div>

      {/* Chassis Selection Buttons */}
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-3">
        {Object.values(CHASSIS_SPECS).map((chassis) => {
          const isSelected = chassis.id === selectedId;
          return (
            <button
              key={chassis.id}
              data-testid={`chassis-select-${chassis.id.toLowerCase()}`}
              id={`chassis-select-${chassis.id.toLowerCase()}`}
              onClick={() => handleSelect(chassis.id)}
              className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_10px_rgba(56,189,248,0.4)] scale-102'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 opacity-70 hover:opacity-100'
              }`}
            >
              <span
                className="text-[10px] sm:text-xs font-black font-mono"
                style={{ color: isSelected ? chassis.color : '#94a3b8' }}
              >
                {chassis.nameEn.split(' ')[0]}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">
                {chassis.baseHp}HP
              </span>
            </button>
          );
        })}
      </div>

      {/* Hexagonal Radar Chart Canvas */}
      <div className="flex flex-col items-center justify-center my-1 bg-slate-950/90 rounded-lg p-1.5 border border-cyan-900/50">
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          data-testid="chassis-radar-canvas"
          className="w-full max-w-[300px] h-auto aspect-[3/2] block"
        />
      </div>

      {/* Selected Hull Telemetry Spec Card */}
      <div className="mt-3 p-2.5 sm:p-3 rounded-lg bg-slate-950/70 border border-slate-700/60 font-mono text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-sm tracking-wide" style={{ color: activeSpec.color }}>
            {t(activeSpec.nameKo, activeSpec.nameEn)}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
            style={{
              borderColor: `${activeSpec.color}66`,
              backgroundColor: `${activeSpec.color}22`,
              color: activeSpec.color,
            }}
          >
            {t(activeSpec.badgeKo, activeSpec.badgeEn)}
          </span>
        </div>

        {/* Quick Stat Bar */}
        <div className="grid grid-cols-3 gap-1 py-1 text-[11px] text-slate-300 border-t border-b border-slate-800 my-1.5">
          <div>
            <span className="text-slate-500">HP: </span>
            <strong className="text-white">{activeSpec.baseHp}</strong>
            <span className="text-slate-500"> (Max {activeSpec.maxHp})</span>
          </div>
          <div>
            <span className="text-slate-500">SPD: </span>
            <strong className="text-cyan-300">{activeSpec.speed.split(' ')[0]}</strong>
          </div>
          <div>
            <span className="text-slate-500">SIZE: </span>
            <strong className="text-amber-300">{activeSpec.hitbox.replace(' px', '')}</strong>
          </div>
        </div>

        {/* Passive Details */}
        <div className="mt-2">
          <div className="text-[11px] font-bold text-cyan-400 mb-0.5 flex items-center gap-1">
            <span>⚡</span>
            <span>{t(activeSpec.passiveNameKo, activeSpec.passiveNameEn)}</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 leading-relaxed">
            {t(activeSpec.passiveDescKo, activeSpec.passiveDescEn)}
          </p>
        </div>
      </div>
    </div>
  );
};
