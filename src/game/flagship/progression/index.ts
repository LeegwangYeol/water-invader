// ============================================================================
// WATER INVADER: FLAGSHIP PROGRESSION SUBSYSTEMS BARREL EXPORT
// ============================================================================

export * from './ChassisRadarChart';
export * from './ModularChassis';
export * from './CrewOfficerDeck';

import { ModularChassisManager } from './ModularChassis';
import { CrewOfficerDeckManager } from './CrewOfficerDeck';
import { IChassisManager, ICrewManager } from '../types';

/**
 * Factory creating production-grade progression subsystems for FlagshipManager.
 */
export function createProgressionSubsystems(): {
  modularChassis: IChassisManager;
  crewDeck: ICrewManager;
} {
  return {
    modularChassis: new ModularChassisManager(),
    crewDeck: new CrewOfficerDeckManager(),
  };
}
