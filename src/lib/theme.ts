/** Shared light-theme utility classes */
export const ui = {
  appBg: 'bg-slate-50',
  surface: 'bg-white',
  surfaceMuted: 'bg-slate-50',
  border: 'border-slate-200',
  text: 'text-slate-900',
  textMuted: 'text-slate-500',
  textSubtle: 'text-slate-400',
  input:
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100',
  btnPrimary:
    'rounded-lg bg-violet-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-violet-500 disabled:opacity-50',
  btnSecondary:
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 transition hover:bg-slate-50',
  card: 'rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60',
  navActive: 'bg-violet-50 text-violet-700',
  navIdle: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
} as const

export const cellColorClass: Record<
  NonNullable<import('../../shared/types').CellColor>,
  string
> = {
  green: 'bg-emerald-50',
  red: 'bg-red-50',
  yellow: 'bg-amber-50',
  blue: 'bg-blue-50',
  orange: 'bg-orange-50',
  purple: 'bg-purple-50',
}
