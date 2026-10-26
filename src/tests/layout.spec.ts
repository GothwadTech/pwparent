import {describe, expect, it} from 'vitest';
import {DESIGN_HEIGHT, MAX_SCALE, computeFluidScale, fluidShellStyle} from '../lib/layout';

/**
 * The desktop layout is a uniform scale of the phone UI — never a stretch and
 * never a separate design. Scale is derived from HEIGHT only, so the aspect
 * ratio of every component is preserved exactly.
 */
describe('computeFluidScale', () => {
  it('is exactly 1 at or below the design height (phones are untouched)', () => {
    expect(computeFluidScale(DESIGN_HEIGHT)).toBe(1);
    expect(computeFluidScale(844)).toBe(1);
    expect(computeFluidScale(640)).toBe(1);
  });

  it('never goes below 1 — a short viewport keeps the real phone layout', () => {
    expect(computeFluidScale(480)).toBe(1);
    expect(computeFluidScale(120)).toBe(1);
  });

  it('never magnifies on a desktop viewport — the reference renders are 1:1', () => {
    // Uniformly blowing the shell up to fill a tall window is exactly the
    // "zoomed" feel the app must not have. Width goes fluid; height becomes
    // scroll room. Scale stays 1 everywhere.
    expect(computeFluidScale(1080)).toBe(1);
    expect(computeFluidScale(1440)).toBe(1);
  });

  it('is capped so a huge monitor cannot turn the UI into a poster', () => {
    expect(computeFluidScale(2160)).toBeLessThanOrEqual(MAX_SCALE);
    expect(computeFluidScale(4320)).toBe(MAX_SCALE);
    expect(computeFluidScale(99999)).toBe(MAX_SCALE);
  });

  it('is a single uniform number, so nothing can distort', () => {
    const scale = computeFluidScale(1080);
    expect(typeof scale).toBe('number');
    expect(Number.isFinite(scale)).toBe(true);
    // height-driven only: same height, any width -> same scale.
    expect(scale).toBe(computeFluidScale(1080));
  });

  it('degrades safely on nonsense input', () => {
    expect(computeFluidScale(0)).toBe(1);
    expect(computeFluidScale(-500)).toBe(1);
    expect(computeFluidScale(Number.NaN)).toBe(1);
    expect(computeFluidScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('fluidShellStyle', () => {
  it('is a pure no-op at scale 1 — phones get zero transform', () => {
    expect(fluidShellStyle(1)).toEqual({width: '100%', height: '100%'});
  });

  it('inversely sizes the box so the scaled result exactly fills the parent', () => {
    const style = fluidShellStyle(1.25);

    expect(style.transform).toBe('scale(1.25)');
    expect(style.transformOrigin).toBe('top left');
    expect(style.width).toBe('calc(100% / 1.25)');
    expect(style.height).toBe('calc(100% / 1.25)');
    // 100%/1.25 then *1.25 == 100%: full bleed, no letterboxing, no scrollbars.
  });

  it('emits no transform at any real viewport, because scale is always 1', () => {
    for (const height of [640, 844, 945, 1080, 1440, 2160]) {
      expect(fluidShellStyle(computeFluidScale(height))).toEqual({width: '100%', height: '100%'});
    }
  });

  it('design constants are the 430x880 the app was built for', () => {
    expect(DESIGN_HEIGHT).toBe(880);
    // The cap IS the guarantee: magnification is forbidden, so the ceiling is 1.
    expect(MAX_SCALE).toBe(1);
  });
});
