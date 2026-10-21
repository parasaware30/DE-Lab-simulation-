/**
 * Wire Crossover (Bridge / Jump) Detection and Geometry Engine
 * Detects intersections between digital circuit wires and calculates
 * schematic bridge arcs so overlapping wires cleanly hop over each other.
 */

export interface Point {
  x: number;
  y: number;
}

export interface WireIntersection {
  id: string;
  x: number;
  y: number;
  wireAId: string; // Under wire ID
  wireBId: string; // Jumping wire ID
  jumpAngle: number; // Tangent angle (radians) of jumping wire at intersection
  underAngle: number; // Tangent angle (radians) of under wire
  underWireId: string;
  jumpingWireId: string;
}

export interface WireGeometryInput {
  id: string;
  p1: Point;
  p2: Point;
  color?: string;
  value?: number | string;
}

/**
 * Evaluates cubic Bezier point at parameter t in [0, 1]
 */
export function evalCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Evaluates first derivative (tangent) of cubic Bezier at parameter t in [0, 1]
 */
export function evalCubicBezierDerivative(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/**
 * Calculates 2D line segment intersection between (p1->p2) and (p3->p4)
 */
export function getSegmentIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): { x: number; y: number; ua: number; ub: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-6) return null; // Parallel or collinear

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
      ua,
      ub,
    };
  }

  return null;
}

/**
 * Samples a wire's cubic Bezier curve into polyline points
 */
export function sampleWireCurve(p1: Point, p2: Point, steps = 24): { points: Point[]; cp1: Point; cp2: Point } {
  const dx = Math.max(35, Math.abs(p2.x - p1.x) * 0.5);
  const cp1 = { x: p1.x + dx, y: p1.y };
  const cp2 = { x: p2.x - dx, y: p2.y };

  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(evalCubicBezier(p1, cp1, cp2, p2, t));
  }

  return { points, cp1, cp2 };
}

/**
 * Finds all legitimate crossover / intersection points between wires
 */
export function findWireCrossovers(wires: WireGeometryInput[]): WireIntersection[] {
  if (wires.length < 2) return [];

  const sampled = wires.map(w => {
    const { points, cp1, cp2 } = sampleWireCurve(w.p1, w.p2, 24);
    return {
      wire: w,
      points,
      cp1,
      cp2,
    };
  });

  const intersections: WireIntersection[] = [];
  const minTerminalDist = 20; // Don't create jump arcs right next to input/output pins

  for (let i = 0; i < sampled.length; i++) {
    for (let j = i + 1; j < sampled.length; j++) {
      const sA = sampled[i];
      const sB = sampled[j];

      // Skip wires that share terminals
      const distStart = Math.hypot(sA.wire.p1.x - sB.wire.p1.x, sA.wire.p1.y - sB.wire.p1.y);
      const distEnd = Math.hypot(sA.wire.p2.x - sB.wire.p2.x, sA.wire.p2.y - sB.wire.p2.y);
      if (distStart < 5 || distEnd < 5) continue;

      let bestIntersection: { x: number; y: number; tA: number; tB: number } | null = null;

      // Check all segment pairs
      for (let segA = 0; segA < sA.points.length - 1; segA++) {
        for (let segB = 0; segB < sB.points.length - 1; segB++) {
          const pA1 = sA.points[segA];
          const pA2 = sA.points[segA + 1];
          const pB1 = sB.points[segB];
          const pB2 = sB.points[segB + 1];

          const res = getSegmentIntersection(pA1, pA2, pB1, pB2);
          if (res) {
            const tA = (segA + res.ua) / (sA.points.length - 1);
            const tB = (segB + res.ub) / (sB.points.length - 1);

            // Verify distance to all 4 wire terminals
            const dA1 = Math.hypot(res.x - sA.wire.p1.x, res.y - sA.wire.p1.y);
            const dA2 = Math.hypot(res.x - sA.wire.p2.x, res.y - sA.wire.p2.y);
            const dB1 = Math.hypot(res.x - sB.wire.p1.x, res.y - sB.wire.p1.y);
            const dB2 = Math.hypot(res.x - sB.wire.p2.x, res.y - sB.wire.p2.y);

            if (dA1 > minTerminalDist && dA2 > minTerminalDist && dB1 > minTerminalDist && dB2 > minTerminalDist) {
              bestIntersection = { x: res.x, y: res.y, tA, tB };
              break;
            }
          }
        }
        if (bestIntersection) break;
      }

      if (bestIntersection) {
        // Calculate tangent vectors at intersection
        const derA = evalCubicBezierDerivative(sA.wire.p1, sA.cp1, sA.cp2, sA.wire.p2, bestIntersection.tA);
        const derB = evalCubicBezierDerivative(sB.wire.p1, sB.cp1, sB.cp2, sB.wire.p2, bestIntersection.tB);

        const angleA = Math.atan2(derA.y, derA.x);
        const angleB = Math.atan2(derB.y, derB.x);

        // Decide which wire jumps:
        // By electrical schematic convention, more vertical wires jump over horizontal trunk wires.
        // If verticality is similar, wire with higher index (sB) jumps.
        const vertA = Math.abs(Math.sin(angleA));
        const vertB = Math.abs(Math.sin(angleB));

        const bJumps = Math.abs(vertB - vertA) > 0.2 ? vertB > vertA : true;

        const jumpingWire = bJumps ? sB.wire : sA.wire;
        const underWire = bJumps ? sA.wire : sB.wire;
        const jumpAngle = bJumps ? angleB : angleA;
        const underAngle = bJumps ? angleA : angleB;

        // Ensure we don't have duplicate nearby jumps
        const isDuplicate = intersections.some(
          item => Math.hypot(item.x - bestIntersection!.x, item.y - bestIntersection!.y) < 14
        );

        if (!isDuplicate) {
          intersections.push({
            id: `jump_${underWire.id}_${jumpingWire.id}_${Math.round(bestIntersection.x)}_${Math.round(bestIntersection.y)}`,
            x: Math.round(bestIntersection.x * 10) / 10,
            y: Math.round(bestIntersection.y * 10) / 10,
            wireAId: underWire.id,
            wireBId: jumpingWire.id,
            underWireId: underWire.id,
            jumpingWireId: jumpingWire.id,
            jumpAngle,
            underAngle,
          });
        }
      }
    }
  }

  return intersections;
}

/**
 * Calculates SVG path string for a Jump Arch of radius R centered at (cx, cy)
 * along tangent angle jumpAngle
 */
export function getJumpArcPath(
  cx: number,
  cy: number,
  jumpAngle: number,
  optionsOrRadius: number | { height?: number; span?: number } = 8
): {
  arcPath: string;
  maskCircle: { cx: number; cy: number; r: number };
} {
  let height = 8;
  let span = 9;

  if (typeof optionsOrRadius === 'number') {
    height = optionsOrRadius;
    span = Math.max(5, optionsOrRadius + 1);
  } else if (optionsOrRadius) {
    height = optionsOrRadius.height ?? 8;
    span = optionsOrRadius.span ?? 9;
  }

  const vx = Math.cos(jumpAngle);
  const vy = Math.sin(jumpAngle);

  // Normal vector pointing perpendicular to wire (prefer upward / outward)
  let nx = -vy;
  let ny = vx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  // Start & End points along the jumping wire
  const x1 = cx - span * vx;
  const y1 = cy - span * vy;
  const x2 = cx + span * vx;
  const y2 = cy + span * vy;

  // Parabolic arch control points
  const peakX = cx + height * nx;
  const peakY = cy + height * ny;

  const c1x = x1 + (peakX - cx) * 0.9;
  const c1y = y1 + (peakY - cy) * 0.9;
  const c2x = x2 + (peakX - cx) * 0.9;
  const c2y = y2 + (peakY - cy) * 0.9;

  const arcPath = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;

  return {
    arcPath,
    maskCircle: {
      cx,
      cy,
      r: Math.max(4, Math.min(span, height) - 1.5),
    },
  };
}
