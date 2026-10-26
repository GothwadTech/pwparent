import type {StudentProfile} from '../types';

/**
 * What ONE login is allowed to see: exactly one child.
 *
 * THE PROBLEM THIS SOLVES
 * Children live at `parents/{uid}/children/{id}`, and `uid` comes from anonymous
 * auth — which is idempotent. Every number used in the same browser resolves to
 * the SAME uid, so that subtree can legitimately hold siblings. Handing the whole
 * list to the UI is what made another child's profile appear in this parent's
 * Profile section, even after login codes were bound one-per-student.
 *
 * The product rule is one number -> one student, so the list that reaches any
 * parent-facing screen is narrowed here, in one named place, instead of each
 * component having to remember to filter.
 *
 * WHAT THIS DOES *NOT* DO
 * Nothing is deleted and nothing is hidden from the administrator. The admin
 * panel still reaches every child through `backend.listAllStudents()`. This only
 * narrows what a single login can see.
 *
 * PRECEDENCE
 *   1. the child this number is BOUND to — the number decides, not the browser
 *   2. whichever child was already open, so a background refresh cannot switch
 *      the child under the parent's thumb
 *   3. the first child — only reachable on a legacy code with no binding
 *
 * A bound id that is not present in `students` falls through rather than
 * returning an empty list: the binding points at a child this uid cannot read,
 * which is a data problem to surface, not a reason to show a blank app.
 */
export function visibleStudentsFor(
  students: StudentProfile[],
  boundStudentId: string | null | undefined,
  active: StudentProfile | null | undefined,
): StudentProfile[] {
  if (students.length === 0) return [];

  const bound = boundStudentId ? students.find((s) => s.id === boundStudentId) : undefined;
  const chosen = bound ?? active ?? students[0];

  // Always length 1 when there is anything to show — never 0, never 2.
  return chosen ? [chosen] : [];
}
