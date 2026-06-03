import type { CellColor, CellType } from '../../../shared/types'
import { cellColorClass } from '../../lib/theme'

export const COLOR_OPTIONS: { id: NonNullable<CellColor>; class: string }[] = [
  { id: 'green', class: cellColorClass.green },
  { id: 'red', class: cellColorClass.red },
  { id: 'yellow', class: cellColorClass.yellow },
  { id: 'blue', class: cellColorClass.blue },
  { id: 'orange', class: cellColorClass.orange },
  { id: 'purple', class: cellColorClass.purple },
]

export const CELL_TYPES: CellType[] = ['text', 'number', 'date', 'status', 'notes']
