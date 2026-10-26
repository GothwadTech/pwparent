import {describe, expect, it} from 'vitest';
import {visibleStudentsFor} from '../lib/studentScope';
import type {StudentProfile} from '../types';

/**
 * ONE NUMBER -> ONE STUDENT, on every parent-facing screen.
 *
 * The regression this pins: another child's profile was appearing in this
 * parent's Profile section. Children live under `parents/{uid}`, and anonymous
 * auth is idempotent — every number used in one browser gets the SAME uid — so
 * that subtree can hold siblings. The narrowing has to happen before any screen
 * sees the list, which is what `visibleStudentsFor` is for.
 */

function kid(id: string, name: string): StudentProfile {
  return {
    id,
    name,
    batch: 'MISSION 30 NEET 2026',
    course: '',
    attendance: '0%',
    testsCompleted: 0,
    dppsDone: 0,
    videoWatchRate: '0%',
  };
}

const ananya = kid('stu-ananya', 'Ananya');
const rahul = kid('stu-rahul', 'Rahul');

describe('studentScope: a login sees exactly one child', () => {
  it('returns only the bound child, never the sibling', () => {
    const visible = visibleStudentsFor([ananya, rahul], 'stu-rahul', ananya);

    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('stu-rahul');
    // The sibling must not leak, even though it is in the same subtree and even
    // though it was the child already open.
    expect(visible.map((s) => s.id)).not.toContain('stu-ananya');
  });

  it('never returns more than one, however many siblings exist', () => {
    const many = [ananya, rahul, kid('stu-c', 'C'), kid('stu-d', 'D')];
    expect(visibleStudentsFor(many, 'stu-d', null)).toHaveLength(1);
  });

  it('the binding beats whichever child was already open', () => {
    // A background refresh must not switch the child under the parent's thumb,
    // but an explicit binding outranks the remembered selection.
    expect(visibleStudentsFor([ananya, rahul], 'stu-ananya', rahul)[0].id).toBe('stu-ananya');
  });

  it('falls back to the open child when the code has no binding', () => {
    expect(visibleStudentsFor([ananya, rahul], null, rahul)[0].id).toBe('stu-rahul');
  });

  it('falls back to the first child on a legacy unbound code', () => {
    const visible = visibleStudentsFor([ananya, rahul], null, null);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('stu-ananya');
  });

  it('a binding that points outside this subtree falls through, not to blank', () => {
    // The bound child belongs to a different uid. Showing an empty app would
    // look like data loss, so the fallback still renders something.
    const visible = visibleStudentsFor([ananya, rahul], 'stu-somewhere-else', null);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('stu-ananya');
  });

  it('an empty subtree stays empty — no phantom child is invented', () => {
    expect(visibleStudentsFor([], 'stu-ananya', null)).toEqual([]);
    expect(visibleStudentsFor([], null, null)).toEqual([]);
  });

  it('a single child passes through unchanged', () => {
    const visible = visibleStudentsFor([ananya], 'stu-ananya', ananya);
    expect(visible).toEqual([ananya]);
  });
});
