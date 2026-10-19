import { describe, it, expect } from 'vitest';
import {
  evalCubicBezier,
  getSegmentIntersection,
  findWireCrossovers,
  getJumpArcPath
} from '../engine/wireCrossover';

describe('Wire Crossover / Jump Engine', () => {
  it('evaluates cubic Bezier correctly at t=0, 0.5, 1', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 0 };
    const p2 = { x: 50, y: 100 };
    const p3 = { x: 100, y: 100 };

    const start = evalCubicBezier(p0, p1, p2, p3, 0);
    expect(start.x).toBeCloseTo(0);
    expect(start.y).toBeCloseTo(0);

    const end = evalCubicBezier(p0, p1, p2, p3, 1);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(100);

    const mid = evalCubicBezier(p0, p1, p2, p3, 0.5);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(50);
  });

  it('detects 2D segment intersection correctly', () => {
    const p1 = { x: 0, y: 50 };
    const p2 = { x: 100, y: 50 };
    const p3 = { x: 50, y: 0 };
    const p4 = { x: 50, y: 100 };

    const res = getSegmentIntersection(p1, p2, p3, p4);
    expect(res).not.toBeNull();
    expect(res?.x).toBeCloseTo(50);
    expect(res?.y).toBeCloseTo(50);
  });

  it('returns null for parallel segments', () => {
    const p1 = { x: 0, y: 10 };
    const p2 = { x: 100, y: 10 };
    const p3 = { x: 0, y: 50 };
    const p4 = { x: 100, y: 50 };

    const res = getSegmentIntersection(p1, p2, p3, p4);
    expect(res).toBeNull();
  });

  it('finds crossovers when two wires cross each other', () => {
    const wire1 = {
      id: 'w1',
      p1: { x: 50, y: 200 },
      p2: { x: 350, y: 200 },
    };
    const wire2 = {
      id: 'w2',
      p1: { x: 200, y: 50 },
      p2: { x: 200, y: 350 },
    };

    const crossovers = findWireCrossovers([wire1, wire2]);
    expect(crossovers.length).toBe(1);
    expect(crossovers[0].x).toBeCloseTo(200, 0);
    expect(crossovers[0].y).toBeCloseTo(200, 0);
    expect(crossovers[0].jumpingWireId).toBe('w2'); // More vertical wire jumps
  });

  it('ignores wires sharing terminals or near endpoints', () => {
    const wire1 = {
      id: 'w1',
      p1: { x: 50, y: 50 },
      p2: { x: 200, y: 100 },
    };
    const wire2 = {
      id: 'w2',
      p1: { x: 50, y: 50 }, // Shared start terminal
      p2: { x: 200, y: 200 },
    };

    const crossovers = findWireCrossovers([wire1, wire2]);
    expect(crossovers.length).toBe(0);
  });

  it('generates smooth SVG jump arc path and mask circle', () => {
    const { arcPath, maskCircle } = getJumpArcPath(150, 150, 0, 8);
    expect(arcPath).toContain('M 142 150');
    expect(arcPath).toContain('A 8 8 0 0 1 158 150');
    expect(maskCircle.cx).toBe(150);
    expect(maskCircle.cy).toBe(150);
    expect(maskCircle.r).toBe(6.5);
  });
});
