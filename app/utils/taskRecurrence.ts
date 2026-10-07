import { addDays, daysInMonth, fromDateKey, toDateKey } from '~/utils/calendarDate'

/**
 * - 'interval': cada `recurrenceInterval` días.
 * - 'weekdays': los días de la semana de `recurrenceDays` (0 = domingo … 6 = sábado, como Date.getDay()).
 */
export type TaskRecurrence = 'daily' | 'weekly' | 'monthly' | 'interval' | 'weekdays' | null

export type TaskRecurrenceRule = {
  recurrence: TaskRecurrence
  recurrenceInterval: number
  recurrenceDays: number[]
}

export const TASK_RECURRENCES = ['daily', 'weekly', 'monthly', 'interval', 'weekdays'] as const

export const RECURRENCE_LABELS: Record<Exclude<TaskRecurrence, null>, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
  interval: 'Cada X días',
  weekdays: 'Días de la semana',
}

/** En orden de lunes a domingo, con su número de Date.getDay(). */
export const TASK_WEEKDAYS: { day: number; short: string; name: string }[] = [
  { day: 1, short: 'L', name: 'lunes' },
  { day: 2, short: 'M', name: 'martes' },
  { day: 3, short: 'X', name: 'miércoles' },
  { day: 4, short: 'J', name: 'jueves' },
  { day: 5, short: 'V', name: 'viernes' },
  { day: 6, short: 'S', name: 'sábado' },
  { day: 0, short: 'D', name: 'domingo' },
]

export function sanitizeDays(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return Array.from(new Set(raw.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))).sort()
}

export function sanitizeInterval(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(365, Math.max(1, Math.round(raw))) : 2
}

/** Texto corto para mostrar la regla, p. ej. "Cada 3 días" o "L · X · V". */
export function describeRecurrence(rule: TaskRecurrenceRule): string {
  if (!rule.recurrence) return ''
  if (rule.recurrence === 'interval') return rule.recurrenceInterval === 1 ? 'Diaria' : `Cada ${rule.recurrenceInterval} días`
  if (rule.recurrence === 'weekdays') {
    const days = sanitizeDays(rule.recurrenceDays)
    if (!days.length) return 'Semanal'
    if (days.join() === '1,2,3,4,5') return 'Entre semana'
    if (days.join() === '0,6') return 'Fines de semana'
    return TASK_WEEKDAYS.filter((w) => days.includes(w.day)).map((w) => w.short).join(' · ')
  }
  return RECURRENCE_LABELS[rule.recurrence]
}

/** Primer día >= `fromKey` (o > si `strict`) que cae en uno de `days`. */
export function nextWeekday(fromKey: string, days: number[], strict: boolean): string {
  const base = fromDateKey(fromKey)
  if (!days.length) return toDateKey(addDays(base, strict ? 7 : 0))
  for (let i = strict ? 1 : 0; i <= 7; i++) {
    const d = addDays(base, i)
    if (days.includes(d.getDay())) return toDateKey(d)
  }
  return toDateKey(addDays(base, 7))
}

/** Fecha de la siguiente ocurrencia después de `fromKey` ('YYYY-MM-DD'), o null si no repite. */
export function nextDueDate(fromKey: string, rule: TaskRecurrenceRule): string | null {
  const base = fromDateKey(fromKey)
  switch (rule.recurrence) {
    case 'daily':
      return toDateKey(addDays(base, 1))
    case 'weekly':
      return toDateKey(addDays(base, 7))
    case 'interval':
      return toDateKey(addDays(base, sanitizeInterval(rule.recurrenceInterval)))
    case 'weekdays':
      return nextWeekday(fromKey, sanitizeDays(rule.recurrenceDays), true)
    case 'monthly': {
      // Mismo día del mes siguiente, recortado si el mes es más corto (31 ene → 28/29 feb).
      const year = base.getFullYear() + (base.getMonth() === 11 ? 1 : 0)
      const month = (base.getMonth() + 1) % 12
      return toDateKey(new Date(year, month, Math.min(base.getDate(), daysInMonth(year, month))))
    }
    default:
      return null
  }
}
