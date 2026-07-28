/**
 * Builds the exam_board query param value from a Step1Board selection.
 *
 * - null / no board / "All Boards" → undefined (no param — unfiltered)
 * - real board                     → its id, as a string
 * - WAEC+NECO combined board       → comma-joined component_ids
 *   (e.g. "1,2") — backend endpoints treat multiple ids as a union
 *   for topics/questions/years, except subjects which intersect
 *   (handled separately in Step2Subject.jsx).
 */
export function boardParamValue(board) {
  if (!board || !board.id || board.id === 'all') return undefined;
  if (board.component_ids?.length === 2) {
    return board.component_ids.join(',');
  }
  return String(board.id);
}