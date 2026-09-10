'use client';

import React, { useState } from 'react';
import { GameManager } from '../game/GameManager';
import { OfficerId, StationId } from '../game/flagship/types';

export interface BridgeCrewRosterProps {
  gameManager?: GameManager | null;
  currency: number;
  lang: string;
  onUpdate?: () => void;
}

export const BridgeCrewRoster: React.FC<BridgeCrewRosterProps> = ({
  gameManager,
  currency,
  lang,
  onUpdate,
}) => {
  const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);
  const [selectedOfficerId, setSelectedOfficerId] = useState<OfficerId>('INGRID');
  const [, setTick] = useState(0);

  const deck = gameManager?.flagshipManager?.crewDeck;
  const officers = deck?.state?.officers;
  const stationAssignments = deck?.state?.stationAssignments;
  const activeResonances = deck?.state?.activeResonances || [];

  if (!deck || !officers) {
    return null;
  }

  const officerList: OfficerId[] = ['INGRID', 'JAX', 'REN', 'LYRA'];
  const stations: StationId[] = ['ENGINEERING', 'GUNNERY', 'SONAR', 'BIOLOGY'];

  const handlePromote = (id: OfficerId) => {
    const off = officers[id];
    if (!off || off.rank >= 3) return;

    // Promotion cost: 25 water currency
    const cost = 25;
    if (gameManager && gameManager.currency < cost) return;

    if (gameManager) {
      gameManager.currency -= cost;
      (gameManager as any).updateScoreUI?.();
    }

    deck.promoteOfficer(id);
    setTick((prev) => prev + 1);
    if (onUpdate) onUpdate();
  };

  const handleAssignStation = (id: OfficerId, newStation: StationId) => {
    deck.assignStation(id, newStation);
    setTick((prev) => prev + 1);
    if (onUpdate) onUpdate();
  };

  const activeOfficer = officers[selectedOfficerId];

  return (
    <div className="bg-slate-900/90 border border-purple-800/60 p-3 sm:p-5 rounded-xl mb-3 text-white w-full max-w-sm shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.15)] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-700/40 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]" />
          <h2 className="text-sm sm:text-base font-black tracking-wide text-purple-300">
            {t('함교 장교 로스터 (BRIDGE CREW)', 'BRIDGE CREW ROSTER & SYNERGY')}
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50">
          4 OFFICERS
        </span>
      </div>

      {/* Officer Selection Tabs */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-3">
        {officerList.map((id) => {
          const off = officers[id];
          const isSelected = id === selectedOfficerId;
          return (
            <button
              key={id}
              data-testid={`officer-tab-${id.toLowerCase()}`}
              onClick={() => setSelectedOfficerId(id)}
              className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                isSelected
                  ? 'border-purple-400 bg-purple-950/80 shadow-[0_0_10px_rgba(192,132,252,0.4)]'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 opacity-70 hover:opacity-100'
              }`}
            >
              <span
                className="text-[10px] sm:text-xs font-black"
                style={{ color: isSelected ? off.paletteColor : '#94a3b8' }}
              >
                {off.nameEn.split(' ')[0]}
              </span>
              <span className="text-[8px] sm:text-[9px] text-amber-300">
                {'★'.repeat(off.rank)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Officer Detail Card */}
      {activeOfficer && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/80 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-sm" style={{ color: activeOfficer.paletteColor }}>
                {t(activeOfficer.nameKo, activeOfficer.nameEn)}
              </div>
              <div className="text-[10px] text-slate-400">
                {t('소속:', 'STATION:')} <strong className="text-purple-300">{activeOfficer.station}</strong>
              </div>
            </div>

            {/* Promotion Button */}
            {activeOfficer.rank < 3 ? (
              <button
                data-testid={`promote-btn-${activeOfficer.id.toLowerCase()}`}
                onClick={() => handlePromote(activeOfficer.id)}
                disabled={currency < 25}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded border transition-all cursor-pointer ${
                  currency >= 25
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                }`}
              >
                {t(`진급 (25 💧)`, `PROMOTE (25 💧)`)}
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 rounded">
                MAX RANK (★★★)
              </span>
            )}
          </div>

          {/* Active Ability Info */}
          <div className="p-2 bg-slate-900/90 rounded border border-slate-800 mb-2">
            <div className="text-[10px] font-bold text-cyan-400 flex items-center justify-between">
              <span>⚡ [{activeOfficer.activeAbility.keybind}] {t(activeOfficer.activeAbility.nameKo, activeOfficer.activeAbility.nameEn)}</span>
              <span className="text-slate-400">{activeOfficer.activeAbility.cooldown}s CD</span>
            </div>
          </div>

          {/* Station Selector Dropdown/Swapper */}
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            <span className="text-slate-400">{t('스테이션 재배치:', 'ASSIGN STATION:')}</span>
            <select
              value={activeOfficer.station}
              onChange={(e) => handleAssignStation(activeOfficer.id, e.target.value as StationId)}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-purple-200"
            >
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s} {stationAssignments?.[s] === activeOfficer.id ? '(Active)' : `(${stationAssignments?.[s] || 'Empty'})`}
                </option>
              ))}
            </select>
          </div>

          {/* Perk Tree Tiers */}
          <div className="space-y-1.5 border-t border-slate-800 pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('패시브 특성 트리 (PASSIVE PERKS)', 'PASSIVE PERK TREE')}
            </div>
            {activeOfficer.perks.map((perk) => (
              <div
                key={perk.id}
                className={`p-1.5 rounded border text-[10px] ${
                  perk.isActive
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-100'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Tier {perk.tier}: {t(perk.nameKo, perk.nameEn)}</span>
                  <span className={perk.isActive ? 'text-emerald-400' : 'text-slate-600'}>
                    {perk.isActive ? t('활성', 'ACTIVE') : t(`Rank ${perk.tier} 필요`, `REQ RANK ${perk.tier}`)}
                  </span>
                </div>
                <div className="text-[9px] mt-0.5 leading-tight opacity-90">
                  {t(perk.descriptionKo, perk.descriptionEn)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Resonances Summary */}
      <div className="mt-3 p-2 rounded-lg bg-slate-950/70 border border-purple-900/40 text-[10px]">
        <div className="font-bold text-purple-300 mb-1 flex items-center justify-between">
          <span>{t('활성 공명 (DUAL RESONANCES)', 'ACTIVE DUAL RESONANCES')}</span>
          <span className="text-slate-400">{activeResonances.length} ACTIVE</span>
        </div>
        {activeResonances.length === 0 ? (
          <p className="text-slate-500 text-[9px]">
            {t('두 명 이상의 장교를 Rank 2 이상으로 진급시켜 공명을 활성화하세요.', 'Promote 2+ officers to Rank 2 to unlock Dual Resonances.')}
          </p>
        ) : (
          <div className="space-y-1 mt-1">
            {activeResonances.map((res) => (
              <div key={res.id} className="p-1 rounded bg-purple-950/60 border border-purple-700/50 text-purple-200">
                <span className="font-bold text-cyan-300">★ {t(res.nameKo, res.nameEn)}: </span>
                <span className="text-[9px] text-slate-300">{t(res.descriptionKo, res.descriptionEn)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
