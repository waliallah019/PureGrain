/**
 * Builds a compact page list for pagination controls, collapsing long ranges
 * with ellipses so the control stays a fixed width on mobile.
 *
 *   getPageItems(1, 5)   -> [1, 2, 3, 4, 5]
 *   getPageItems(6, 20)  -> [1, "…", 5, 6, 7, "…", 20]
 *   getPageItems(2, 20)  -> [1, 2, 3, "…", 20]
 *
 * Always includes the first and last page plus a window around the current one.
 */
export type PageItem = number | "…";

export function getPageItems(
  current: number,
  total: number,
  siblings = 1
): PageItem[] {
  if (!Number.isFinite(total) || total < 1) return [1];
  // Enough room to show everything without gaps: first + last + window + 2 gaps
  const maxSlots = siblings * 2 + 5;
  if (total <= maxSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);

  const items: PageItem[] = [1];
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("…");
  items.push(total);

  return items;
}
