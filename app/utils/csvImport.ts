/** Lector de CSV de extractos bancarios: separador automático, comillas, montos y fechas en formatos comunes. */

export type DateFormat = 'auto' | 'ymd' | 'dmy' | 'mdy'

export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 10).join('\n')
  const candidates = [';', ',', '\t', '|']
  let best = ','
  let bestCount = 0
  for (const c of candidates) {
    const count = sample.split(c).length - 1
    if (count > bestCount) {
      best = c
      bestCount = count
    }
  }
  return best
}

/** Convierte el texto en filas de celdas (respeta comillas dobles y saltos de línea dentro de ellas). */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell.trim())
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some((c) => c !== '')) rows.push(row)
  return rows
}

/**
 * Monto con signo a partir de textos como "-1.234,56", "$ 1,234.56", "(45.00)" o "1234".
 * Decide el separador decimal por el último símbolo que aparezca seguido de 1–2 dígitos.
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim()
  if (!s) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  if (/^[^\d]*-/.test(s) || /-\s*$/.test(s)) negative = true
  s = s.replace(/[^\d.,]/g, '')
  if (!s) return null
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  let decimalSep: string | null = null
  if (hasDot && hasComma) {
    // Con ambos, el que aparece al final es el decimal: "1.234,56" o "1,234.56".
    decimalSep = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
  } else if (hasDot || hasComma) {
    const sep = hasDot ? '.' : ','
    const parts = s.split(sep)
    // Un único separador seguido de 1–2 dígitos es decimal; "1.234" o "1.234.567" son miles.
    if (parts.length === 2 && parts[1]!.length >= 1 && parts[1]!.length <= 2) decimalSep = sep
  }
  let normalized: string
  if (decimalSep) {
    const thousands = decimalSep === '.' ? ',' : '.'
    normalized = s.split(thousands).join('').replace(decimalSep, '.')
  } else {
    normalized = s.replace(/[.,]/g, '')
  }
  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

const pad = (n: number) => String(n).padStart(2, '0')

function validDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d)
  return date.getMonth() === m - 1 ? `${y}-${pad(m)}-${pad(d)}` : null
}

/** Fecha en YYYY-MM-DD, o null si no se entiende. */
export function parseDate(raw: string, format: DateFormat = 'auto'): string | null {
  const s = raw.trim()
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s)
  if (m) return validDate(Number(m[1]), Number(m[2]), Number(m[3]))
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(s)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  const year = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  if (format === 'mdy') return validDate(year, a, b)
  if (format === 'dmy') return validDate(year, b, a)
  // auto: día/mes (lo habitual en español) salvo que el segundo número no pueda ser mes.
  return b > 12 ? validDate(year, a, b) : validDate(year, b, a)
}

/** Elige el formato de fecha que mejor encaja con todos los valores de la columna. */
export function detectDateFormat(values: string[]): Exclude<DateFormat, 'auto'> {
  let dmy = 0
  let mdy = 0
  for (const v of values) {
    if (/^\d{4}/.test(v.trim())) return 'ymd'
    if (parseDate(v, 'dmy')) dmy++
    if (parseDate(v, 'mdy')) mdy++
  }
  return mdy > dmy ? 'mdy' : 'dmy'
}

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ['Comida', /restaur|rappi|ifood|uber\s*eats|didi\s*food|mercado|supermerc|[ée]xito|carulla|jumbo|ol[ií]mpica|d1\b|ara\b|walmart|oxxo|panader|caf[eé]|pizza|burger|kfc|mcdonald/i],
  ['Transporte', /uber(?!\s*eats)|didi(?!\s*food)|cabify|taxi|gasolin|terpel|primax|peaje|metro|transmilenio|parqueadero|parking|bus\b/i],
  ['Servicios', /\bluz\b|energ[ií]a|\bagua\b|acueducto|\bgas\b|internet|claro|movistar|tigo|wom\b|telmex|izzi|telcel|netflix|spotify|disney|hbo|prime\s*video|youtube|icloud|google\s*one/i],
  ['Hogar', /arriendo|alquiler|renta\b|administraci[oó]n|homecenter|ikea|ferreter/i],
  ['Salud', /farmac|droguer|cruz\s*verde|m[eé]dic|cl[ií]nica|hospital|eps\b|odontol|[oó]ptica/i],
  ['Educación', /colegio|universidad|curso|udemy|platzi|coursera|librer/i],
  ['Compras', /amazon|mercado\s*libre|falabella|zara|h&m|shein|aliexpress|temu|tienda/i],
  ['Ocio', /cine|cinemark|cinepolis|steam|playstation|xbox|nintendo|bar\b|concierto|teatro/i],
]

/** Categoría probable a partir de la descripción del banco. */
export function guessCategory(description: string, type: 'gasto' | 'ingreso'): string {
  if (type === 'ingreso') {
    if (/n[oó]mina|salario|sueldo|payroll/i.test(description)) return 'Salario'
    return 'Otros'
  }
  for (const [category, re] of CATEGORY_KEYWORDS) if (re.test(description)) return category
  return 'Otros'
}

/** Índice de la columna cuyo encabezado coincide con alguno de los patrones, o -1. */
export function findColumn(headers: string[], pattern: RegExp): number {
  return headers.findIndex((h) => pattern.test(h.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()))
}
