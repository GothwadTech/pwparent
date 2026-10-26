/**
 * One honest line about how this device's login is being held — and a way for
 * the settings panel to show it.
 *
 * The app's identity work (src/lib/firebase/identity.ts) can degrade for
 * reasons the parent should be told about rather than left to guess:
 *
 *   • the Email/Password provider is switched off in the Firebase console, so
 *     a login can only be held by this browser's anonymous session;
 *   • an administrator reset the login code after the identity was created, and
 *     this device had no live session to re-sync the password from.
 *
 * In both cases the parent is still logged in and still sees the right child —
 * only the "same account on every device" guarantee is weaker. That belongs in
 * the UI, not in a console.warn nobody reads.
 *
 * This module deliberately imports NOTHING (no firebase, no backend) so any
 * component can read the note without dragging the SDK into its render path.
 */

let note: string | null = null;

/** Records the current caveat, or `null` when the session is fully linked. */
export function setIdentityNote(value: string | null): void {
  note = value;
}

/** The caveat to show in the settings panel. `null` means "all good". */
export function identityNote(): string | null {
  return note;
}

/** Test helper — keeps specs from leaking a note into the next one. */
export function resetIdentityNote(): void {
  note = null;
}
