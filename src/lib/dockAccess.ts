/**
 * The two doors into the settings / Firestore panel — and nothing else.
 *
 * The panel used to hang off a floating pill in the corner of every screen.
 * That pill is gone; the panel now opens from exactly two places:
 *
 *   1. the round (i) button that sits to the LEFT of "How it works" on the
 *      login and OTP headers;
 *   2. the Help Centre's own search bar — type the word "admin" in any case
 *      and an access button appears under the field.
 *
 * This module owns the second door's rule so it is one tested function rather
 * than a string comparison buried in a component.
 */

/**
 * Reduce a typed query to what matters: lowercase letters and digits only.
 * "ADMIN ", "Ad-Min" and "ad min" all mean the same thing to a parent who was
 * told to type the word admin.
 */
export function normalizeDockQuery(raw: string): string {
  return (raw ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * True when the Help Centre search should surface the access button.
 *
 * Deliberately generous: the word "admin" anywhere in the query counts, so
 * "admin panel", "ADMIN", "how do I open admin" all work, while an unrelated
 * query ("payment failed") never shows it.
 */
export function isDockUnlockQuery(raw: string): boolean {
  return normalizeDockQuery(raw).includes('admin');
}
