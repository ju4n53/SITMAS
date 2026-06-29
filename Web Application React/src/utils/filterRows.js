export function filterRows(rows, term) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => Object.values(row || {}).some((value) => String(value ?? '').toLowerCase().includes(normalized)));
}
