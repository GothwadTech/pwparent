/**
 * Fluid desktop scaling.
 *
 * ── THE PROBLEM ────────────────────────────────────────────────────────────
 * Every screen is designed for a 430 × 880 phone viewport and uses ABSOLUTE
 * pixel values (`text-[28px]`, `px-5`, `w-[62px]`). On a desktop those render
 * tiny inside a huge screen, so the app used to float in a fake phone frame.
 *
 * The frame is gone — the app now fills the whole viewport. But a 0.49
 * aspect-ratio design cannot fill a 1.78 aspect-ratio screen without either
 * distorting (non-uniform scale) or leaving gaps.
 *
 * ── THE SOLUTION ───────────────────────────────────────────────────────────
 * Uniform scale-to-fit on the CONSTRAINED axis (height), and let the width go
 * fluid. Implemented as a shrink-then-scale trick so layout still reflows:
 *
 *     logical size = viewport / scale     (what the CSS lays out against)
 *     transform: scale(scale)             (blows it back up to exactly fill)
 *
 * `transform: scale()` is used instead of `zoom` because `zoom` is still
 * unevenly supported and interacts badly with `position: fixed` descendants.
 *
 * Scale is derived from HEIGHT, never width: scaling on width would squash the
 * layout vertically and force scrolling. The cap stops text becoming absurd on
 * ultrawide monitors.
 *
 * Nothing here is a separate "desktop layout" — it is the identical phone UI,
 * just uniformly enlarged and allowed to use the full width.
 */
import {type CSSProperties, useEffect, useState} from 'react';

/** Design height the screens were built against (see App.tsx's old 880px frame). */
export const DESIGN_HEIGHT = 880;

/**
 * Never magnify. The reference renders are 1:1 phone pixels; uniformly blowing
 * the shell up to fill a tall window is exactly the "zoomed" feel this app must
 * not have. Width still goes fluid, height just becomes more scroll room.
 */
export const MAX_SCALE = 1;

export function computeFluidScale(viewportHeight: number): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 1;
  const raw = viewportHeight / DESIGN_HEIGHT;
  return Number(Math.min(Math.max(raw, 1), MAX_SCALE).toFixed(3));
}

/**
 * Live fluid scale, recomputed on resize/orientation change.
 * Returns 1 on phones (where the viewport is shorter than the design height),
 * so mobile rendering is byte-for-byte what it always was.
 */
export function useFluidScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => setScale(computeFluidScale(window.innerHeight));

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);

  return scale;
}

/**
 * Inline style for the scaled shell.
 *
 * The `calc(100% / scale)` width+height is what makes this work: it shrinks the
 * box first so that after the scale transform it lands exactly on the viewport
 * edges — no overflow, no letterboxing, no distortion.
 */
export function fluidShellStyle(scale: number): CSSProperties {
  if (scale === 1) return {width: '100%', height: '100%'};
  return {
    width: `calc(100% / ${scale})`,
    height: `calc(100% / ${scale})`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };
}
