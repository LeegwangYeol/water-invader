// ============================================================================
// WATER INVADER: CHASSIS 6-AXIS HEXAGONAL RADAR CHART RENDERER
// ============================================================================

import { ChassisRadarStats } from '../types';

export interface RadarChartOptions {
  comparisonStats?: ChassisRadarStats;
  fillColor?: string;
  strokeColor?: string;
  comparisonColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  chassisName?: string;
  accentColor?: string;
  animProgress?: number; // 0.0 to 1.0
}

export interface AxisDefinition {
  key: keyof ChassisRadarStats;
  nameKo: string;
  nameEn: string;
  unit?: string;
}

export const RADAR_AXES: AxisDefinition[] = [
  { key: 'speed', nameKo: '기동 속도', nameEn: 'SPEED' },
  { key: 'armor', nameKo: '장갑 내구', nameEn: 'ARMOR' },
  { key: 'hardpoints', nameKo: '화력 슬롯', nameEn: 'HARDPOINTS' },
  { key: 'energy', nameKo: '에너지 효율', nameEn: 'ENERGY' },
  { key: 'hitboxProfile', nameKo: '피격 안전성', nameEn: 'PROFILE' },
  { key: 'salvage', nameKo: '자원 인양', nameEn: 'SALVAGE' },
];

export class ChassisRadarChart {
  /**
   * Render a procedural 6-axis hexagonal radar chart with glowing cyber-marine telemetry styling.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    stats: ChassisRadarStats,
    options: RadarChartOptions = {}
  ): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    const {
      comparisonStats,
      fillColor = 'rgba(6, 182, 212, 0.22)',
      strokeColor = '#06b6d4',
      comparisonColor = 'rgba(245, 158, 11, 0.75)',
      showLabels = true,
      showValues = true,
      showGrid = true,
      chassisName,
      accentColor = '#38bdf8',
      animProgress = 1.0,
    } = options;

    const progress = Math.max(0, Math.min(1, animProgress));
    const axisCount = RADAR_AXES.length;
    const angleStep = (Math.PI * 2) / axisCount;
    // Start at top (-PI / 2)
    const startAngle = -Math.PI / 2;

    ctx.save();

    // ------------------------------------------------------------------------
    // 1. Concentric Hexagonal Grid Rings & Radial Spokes
    // ------------------------------------------------------------------------
    if (showGrid) {
      const ringSteps = [0.2, 0.4, 0.6, 0.8, 1.0];
      for (let rIdx = 0; rIdx < ringSteps.length; rIdx++) {
        const ringScale = ringSteps[rIdx];
        const r = radius * ringScale;
        const isOuter = rIdx === ringSteps.length - 1;

        ctx.strokeStyle = isOuter ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.25)';
        ctx.lineWidth = isOuter ? 1.5 : 1;
        if (!isOuter) {
          ctx.setLineDash([3, 3]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        for (let i = 0; i < axisCount; i++) {
          const angle = startAngle + i * angleStep;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Radial spoke lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < axisCount; i++) {
        const angle = startAngle + i * angleStep;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    // ------------------------------------------------------------------------
    // 2. Comparison Silhouette (Ghost Overlay if present)
    // ------------------------------------------------------------------------
    if (comparisonStats) {
      ctx.save();
      ctx.strokeStyle = comparisonColor;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);

      ctx.beginPath();
      for (let i = 0; i < axisCount; i++) {
        const key = RADAR_AXES[i].key;
        const val = Math.max(0, Math.min(100, comparisonStats[key]));
        const r = radius * (val / 100);
        const angle = startAngle + i * angleStep;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 3. Active Chassis Data Polygon
    // ------------------------------------------------------------------------
    const points: Array<{ x: number; y: number; val: number }> = [];
    for (let i = 0; i < axisCount; i++) {
      const key = RADAR_AXES[i].key;
      const rawVal = Math.max(0, Math.min(100, stats[key]));
      const val = rawVal * progress;
      const r = radius * (val / 100);
      const angle = startAngle + i * angleStep;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      points.push({ x: px, y: py, val: rawVal });
    }

    ctx.save();
    // Glowing polygon boundary
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ------------------------------------------------------------------------
    // 4. Vertex Markers & Pulse Glow
    // ------------------------------------------------------------------------
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      // Outer halo
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Core pip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------------------
    // 5. Axis Labels and Numerical Values
    // ------------------------------------------------------------------------
    if (showLabels) {
      ctx.font = '10px monospace';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < axisCount; i++) {
        const axis = RADAR_AXES[i];
        const val = points[i].val;
        const angle = startAngle + i * angleStep;
        // Place text slightly outside the outer radius
        const labelR = radius + 22;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;

        // Alignment based on angle
        if (Math.abs(Math.cos(angle)) < 0.2) {
          ctx.textAlign = 'center';
        } else if (Math.cos(angle) > 0) {
          ctx.textAlign = 'left';
        } else {
          ctx.textAlign = 'right';
        }

        // Label line
        ctx.fillStyle = '#94a3b8';
        const labelText = axis.nameEn;
        ctx.fillText(labelText, lx, ly - 5);

        // Value badge
        if (showValues) {
          ctx.fillStyle = accentColor;
          let valueStr = `${Math.round(val)}`;
          if (comparisonStats) {
            const compVal = Math.round(comparisonStats[axis.key]);
            const delta = Math.round(val) - compVal;
            if (delta > 0) valueStr += ` (+${delta})`;
            else if (delta < 0) valueStr += ` (${delta})`;
          }
          ctx.fillText(valueStr, lx, ly + 6);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 6. Center Hub & Optional Chassis Header
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    if (chassisName) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
      ctx.fillText(chassisName.toUpperCase(), cx, cy - radius - 38);
    }

    ctx.restore();
  }
}
