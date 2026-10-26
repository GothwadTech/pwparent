/**
 * Which `parents/{uid}` subtree does this login actually own?
 *
 * ── THE BUG THIS EXISTS FOR ────────────────────────────────────────────────
 * An administrator creates a child under SOME family record `parents/{P}` and
 * then issues the login code for the parent's number from that child's screen,
 * which stamps `credentials/{phone}.parentUid = P`. The parent's own Firebase
 * session, however, has a uid `Q` that belongs to their browser/identity — and
 * `Q == P` only by coincidence (same device, same anonymous uid, never a
 * cleared profile, never a second phone).
 *
 * Whenever they differed, the parent logged in successfully — the code verified
 * — and then read `parents/{Q}/children`, which is empty, and stared at an
 * empty dashboard. The data was never missing; it was one subtree over.
 *
 * ── THE RULE ───────────────────────────────────────────────────────────────
 * The credential's `parentUid` is the authority for where the family lives,
 * because it is written by the admin at issue time from the child's own
 * record. A session whose credential points at `P` reads and writes `P`,
 * whatever its auth uid says. The matching security-rule helper is
 * `isBoundParent()` in firestore.rules; without it this would be a client-side
 * wish rather than a permission.
 *
 * Absent a binding (legacy codes, admin sessions) the session uid stands.
 */

/**
 * Resolve the family subtree for one session.
 *
 * @param sessionUid          the Firebase auth uid of this session
 * @param credentialParentUid `credentials/{phone}.parentUid`, when the number
 *                            has a code with a binding stamped on it
 * @returns the uid whose `parents/{uid}` subtree this login owns
 */
export function familyUidFor(
  sessionUid: string | null | undefined,
  credentialParentUid?: string | null,
): string | null {
  const bound = (credentialParentUid ?? '').trim();
  if (bound) return bound;
  const own = (sessionUid ?? '').trim();
  return own || null;
}
