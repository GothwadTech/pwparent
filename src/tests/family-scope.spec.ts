import {describe, expect, it} from 'vitest';
import {familyUidFor} from '../lib/familyScope';

/**
 * The rule behind "OTP ke baad dashboard khali": the family subtree is wherever
 * the credential's binding says, not wherever the session uid happens to be.
 * These pin the resolution so a future refactor cannot silently send a parent
 * back to their own empty subtree.
 */
describe('familyUidFor: the credential binding owns the family subtree', () => {
  it('prefers the parentUid stamped on the login code', () => {
    expect(familyUidFor('session-uid-Q', 'family-uid-P')).toBe('family-uid-P');
  });

  it('falls back to the session uid when a legacy code has no binding', () => {
    expect(familyUidFor('session-uid-Q', undefined)).toBe('session-uid-Q');
    expect(familyUidFor('session-uid-Q', null)).toBe('session-uid-Q');
    expect(familyUidFor('session-uid-Q', '   ')).toBe('session-uid-Q');
  });

  it('trims both inputs and returns null when there is nothing at all', () => {
    expect(familyUidFor('  family-uid-P  ', null)).toBe('family-uid-P');
    expect(familyUidFor(null, '  ')).toBeNull();
    expect(familyUidFor(undefined, undefined)).toBeNull();
  });

  it('never lets an empty session uid win over a real binding', () => {
    expect(familyUidFor('', 'family-uid-P')).toBe('family-uid-P');
  });
});
