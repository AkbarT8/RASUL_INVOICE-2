/** Excel-style palette + custom hex */
export const PALETTE = [
  '#ffffff',
  '#000000',
  '#e7e6e6',
  '#44546a',
  '#4472c4',
  '#ed7d31',
  '#a5a5a5',
  '#ffc000',
  '#5b9bd5',
  '#70ad47',
  '#f2f2f2',
  '#7f7f7f',
  '#d0cece',
  '#d6dce4',
  '#bdd7ee',
  '#fce4d6',
  '#ededed',
  '#fff2cc',
  '#ddebf7',
  '#e2efda',
  '#ff0000',
  '#c00000',
  '#ff5050',
  '#ff9900',
  '#ffd966',
  '#92d050',
  '#00b050',
  '#00b0f0',
  '#0070c0',
  '#7030a0',
  '#c65911',
  '#f4b084',
  '#c6efce',
  '#9bc2e6',
  '#ffff00',
  '#00ffff',
  '#ff00ff',
  '#800000',
  '#008000',
  '#000080',
  '#800080',
  '#808000',
  '#008080',
  '#c0c0c0',
  '#808080',
  '#9999ff',
  '#993366',
  '#339966',
  '#ffcc99',
] as const

const LEGACY: Record<string, string> = {
  green: '#c6efce',
  red: '#ffc7ce',
  yellow: '#ffeb9c',
  blue: '#bdd7ee',
  orange: '#fce4d6',
  purple: '#e4dfec',
}

export function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null
  if (color.startsWith('#')) return color
  return LEGACY[color] ?? color
}

export function colorStyle(color: string | null | undefined): { backgroundColor: string } | undefined {
  const hex = normalizeColor(color)
  if (!hex) return undefined
  return { backgroundColor: hex }
}

export function colorToExcelArgb(hex: string | null): string | undefined {
  const n = normalizeColor(hex)
  if (!n || !n.startsWith('#') || n.length < 7) return undefined
  return 'FF' + n.slice(1).toUpperCase()
}
