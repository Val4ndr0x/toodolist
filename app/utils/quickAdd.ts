import { addDays, toDateKey } from '~/utils/calendarDate'
import { nextWeekday, type TaskRecurrence } from '~/utils/taskRecurrence'

export type QuickAddPriority = 'low' | 'medium' | 'high'

export type QuickAddResult = {
  /** Texto de la tarea sin las palabras clave reconocidas. */
  text: string
  dueDate: string | null
  priority: QuickAddPriority | null
  assignee: string | null
  recurrence: TaskRecurrence
  recurrenceInterval: number
  recurrenceDays: number[]
  /** 'HH:mm' del recordatorio. */
  remindAt: string | null
}

// Límites de palabra que sí entienden tildes y la ñ (\b de JS no las considera letras).
const S = '(?<=^|[\\s,.;])'
const E = '(?=$|[\\s,.;])'

const DAY_PATTERNS: [number, string][] = [
  [1, 'lunes'],
  [2, 'martes'],
  [3, 'mi[ée]rcoles'],
  [4, 'jueves'],
  [5, 'viernes'],
  [6, 's[áa]bados?'],
  [0, 'domingos?'],
]
const ANY_DAY = DAY_PATTERNS.map(([, p]) => p).join('|')

function dayNumber(word: string): number | null {
  for (const [n, p] of DAY_PATTERNS) if (new RegExp(`^${p}$`, 'i').test(word)) return n
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Busca `pattern`; si coincide, lo quita del texto y devuelve la coincidencia. */
function take(state: { text: string }, pattern: string): RegExpExecArray | null {
  const re = new RegExp(`${S}(?:${pattern})${E}`, 'iu')
  const m = re.exec(state.text)
  if (m) state.text = `${state.text.slice(0, m.index)} ${state.text.slice(m.index + m[0].length)}`
  return m
}

/**
 * Interpreta una tarea escrita en lenguaje natural, p. ej.
 * "pagar la luz mañana a las 6pm !alta @Ana cada mes".
 */
export function parseQuickAdd(input: string, now = new Date()): QuickAddResult {
  const state = { text: ` ${input} ` }
  const todayKey = toDateKey(now)
  const result: QuickAddResult = {
    text: input.trim(),
    dueDate: null,
    priority: null,
    assignee: null,
    recurrence: null,
    recurrenceInterval: 2,
    recurrenceDays: [],
    remindAt: null,
  }

  // Prioridad: !alta / !media / !baja, o !!! para alta.
  let m = take(state, '!(alta|media|baja)|!!!')
  if (m) result.priority = m[1] ? ({ alta: 'high', media: 'medium', baja: 'low' } as const)[m[1].toLowerCase() as 'alta'] : 'high'

  // Responsable: @nombre (guion bajo = espacio, para nombres compuestos).
  m = take(state, '@([\\p{L}\\p{N}_.-]+)')
  if (m?.[1]) result.assignee = m[1].replace(/_/g, ' ')

  // Repetición.
  if ((m = take(state, 'cada\\s+(\\d{1,3})\\s+d[íi]as'))) {
    result.recurrence = 'interval'
    result.recurrenceInterval = Math.max(1, Number(m[1]))
  } else if (take(state, 'cada\\s+d[íi]a|todos\\s+los\\s+d[íi]as|diariamente|diaria|diario')) {
    result.recurrence = 'daily'
  } else if (take(state, 'entre\\s+semana|d[íi]as\\s+h[áa]biles|de\\s+lunes\\s+a\\s+viernes')) {
    result.recurrence = 'weekdays'
    result.recurrenceDays = [1, 2, 3, 4, 5]
  } else if (take(state, 'los\\s+fines\\s+de\\s+semana|cada\\s+fin\\s+de\\s+semana')) {
    result.recurrence = 'weekdays'
    result.recurrenceDays = [0, 6]
  } else if ((m = take(state, `(?:cada|todos\\s+los)\\s+((?:${ANY_DAY})(?:\\s*(?:,|y)\\s*(?:${ANY_DAY}))*)`))) {
    const days = m[1]!.split(/\s*(?:,|\sy\s)\s*/i).map((w) => dayNumber(w.trim())).filter((d): d is number => d !== null)
    result.recurrence = 'weekdays'
    result.recurrenceDays = Array.from(new Set(days)).sort()
  } else if (take(state, 'cada\\s+semana|semanalmente|semanal')) {
    result.recurrence = 'weekly'
  } else if (take(state, 'cada\\s+mes|mensualmente|mensual')) {
    result.recurrence = 'monthly'
  }

  // Hora del recordatorio: "a las 6pm", "a las 18:30", "18:30".
  m = take(state, '(?:a\\s+las?\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.)') ?? take(state, 'a\\s+las?\\s+(\\d{1,2})(?::(\\d{2}))?') ?? take(state, '(\\d{1,2}):(\\d{2})')
  if (m) {
    let h = Number(m[1])
    const min = Number(m[2] ?? 0)
    const suffix = m[3]?.toLowerCase().replace(/\./g, '')
    if (suffix === 'pm' && h < 12) h += 12
    if (suffix === 'am' && h === 12) h = 0
    if (h <= 23 && min <= 59) result.remindAt = `${pad(h)}:${pad(min)}`
  }

  // Fecha.
  if (take(state, 'pasado\\s+ma[ñn]ana')) result.dueDate = toDateKey(addDays(now, 2))
  else if (take(state, 'ma[ñn]ana')) result.dueDate = toDateKey(addDays(now, 1))
  else if (take(state, 'hoy')) result.dueDate = todayKey
  else if ((m = take(state, 'en\\s+(\\d{1,3})\\s+d[íi]as'))) result.dueDate = toDateKey(addDays(now, Number(m[1])))
  else if (take(state, 'en\\s+una\\s+semana|la\\s+pr[óo]xima\\s+semana')) result.dueDate = toDateKey(addDays(now, 7))
  else if ((m = take(state, `(?:el\\s+|este\\s+|pr[óo]ximo\\s+|el\\s+pr[óo]ximo\\s+)?(${ANY_DAY})`))) {
    const day = dayNumber(m[1]!)
    if (day !== null) result.dueDate = nextWeekday(todayKey, [day], true)
  } else if ((m = take(state, '(\\d{4})-(\\d{2})-(\\d{2})'))) {
    result.dueDate = `${m[1]}-${m[2]}-${m[3]}`
  } else if ((m = take(state, '(?:el\\s+)?(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?'))) {
    const day = Number(m[1])
    const month = Number(m[2])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      let year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : now.getFullYear()
      let key = `${year}-${pad(month)}-${pad(day)}`
      // Sin año y ya pasó: es el del año que viene.
      if (!m[3] && key < todayKey) key = `${++year}-${pad(month)}-${pad(day)}`
      result.dueDate = key
    }
  }

  // Una tarea repetida o con recordatorio necesita una fecha de inicio.
  if (!result.dueDate && result.recurrence === 'weekdays') result.dueDate = nextWeekday(todayKey, result.recurrenceDays, false)
  if (!result.dueDate && (result.recurrence || result.remindAt)) result.dueDate = todayKey

  const cleaned = state.text.replace(/\s{2,}/g, ' ').trim()
  result.text = cleaned || input.trim()
  return result
}

/** ¿Se reconoció algo además del texto? */
export function hasQuickAddMeta(r: QuickAddResult) {
  return !!(r.dueDate || r.priority || r.assignee || r.recurrence || r.remindAt)
}
