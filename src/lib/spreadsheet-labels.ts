/** Excel-style column label: 0 → A, 25 → Z, 26 → AA */
export function columnLetter(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    n -= 1
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

export function displayColumnTitle(
  colIndex: number,
  firstRowCellValue?: string,
  fallbackName?: string,
): string {
  const v = firstRowCellValue?.trim()
  if (v) return v
  const n = fallbackName?.trim()
  if (n) return n
  return columnLetter(colIndex)
}
