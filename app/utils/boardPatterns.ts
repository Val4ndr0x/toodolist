export type BoardPatternId = 'dots' | 'lines' | 'grid' | 'none'

export const BOARD_PATTERNS: { id: BoardPatternId; label: string }[] = [
  { id: 'dots', label: 'Puntos' },
  { id: 'lines', label: 'Renglones' },
  { id: 'grid', label: 'Cuadrícula' },
  { id: 'none', label: 'Liso' },
]

export function isBoardPattern(value: unknown): value is BoardPatternId {
  return typeof value === 'string' && BOARD_PATTERNS.some((p) => p.id === value)
}

/** Tamaño (px) de una unidad del patrón a zoom 1x; se multiplica por el zoom del tablero. */
export const BOARD_PATTERN_UNIT = 32

/** Imagen de fondo del patrón (se repite en mosaico); 'none' significa hoja lisa, sin imagen. */
export function boardPatternImage(pattern: BoardPatternId, color: string): string {
  if (pattern === 'lines') {
    return `linear-gradient(to bottom, transparent 0 ${BOARD_PATTERN_UNIT - 1}px, ${color} ${BOARD_PATTERN_UNIT - 1}px ${BOARD_PATTERN_UNIT}px)`
  }
  if (pattern === 'grid') {
    return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`
  }
  if (pattern === 'none') return 'none'
  return `radial-gradient(circle, ${color} 1.4px, transparent 1.4px)`
}
