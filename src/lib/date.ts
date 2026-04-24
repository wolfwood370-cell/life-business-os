// Date helpers that avoid timezone drift when saving <input type="date"> values.
//
// Problem: `new Date('2026-04-24').toISOString()` → '2026-04-23T22:00:00Z' in CET,
// so reloading and slicing(10) gives '2026-04-23' (wrong day).
//
// Solution: serialize the picked day as noon UTC. Noon UTC is the same calendar
// day in every timezone between UTC-11 and UTC+11, so slicing(10) after reload
// always yields the original YYYY-MM-DD the user picked.

/** Returns the local "today" as YYYY-MM-DD. */
export const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Converts a YYYY-MM-DD string from a <input type="date"> into a timezone-safe
 * ISO string (noon UTC of the same calendar day). Use for `timestamptz` columns.
 * Returns `undefined` when the input is empty.
 */
export const dateInputToIso = (yyyyMmDd: string | undefined | null): string | undefined => {
  if (!yyyyMmDd) return undefined;
  // Accept already-ISO strings by slicing the date portion.
  const datePart = yyyyMmDd.length >= 10 ? yyyyMmDd.slice(0, 10) : yyyyMmDd;
  // Validate shape minimally
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return undefined;
  return `${datePart}T12:00:00.000Z`;
};

/**
 * Returns the date portion (YYYY-MM-DD) of any ISO-ish string, safely for UI prefill
 * of <input type="date">. Works regardless of timezone because we store noon UTC.
 */
export const isoToDateInput = (iso: string | undefined | null): string => {
  if (!iso) return '';
  return iso.slice(0, 10);
};
