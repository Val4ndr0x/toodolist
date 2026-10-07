/** Cuota fija mensual de un crédito (sistema francés). Tasa en % anual. */
export function loanPayment(principal: number, annualRate: number, months: number) {
  if (!(principal > 0) || !(months > 0)) return 0
  const r = annualRate / 100 / 12
  if (r <= 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

export type AmortizationRow = { month: number; payment: number; interest: number; capital: number; balance: number }

export function amortization(principal: number, annualRate: number, months: number): AmortizationRow[] {
  const payment = loanPayment(principal, annualRate, months)
  if (!payment) return []
  const r = Math.max(0, annualRate) / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = principal
  for (let month = 1; month <= months; month++) {
    const interest = balance * r
    // La última cuota cierra el saldo para no arrastrar errores de redondeo.
    const capital = month === months ? balance : payment - interest
    balance = Math.max(0, balance - capital)
    rows.push({ month, payment: capital + interest, interest, capital, balance })
  }
  return rows
}

/** Ahorro con aportes mensuales e interés compuesto mensual. Tasa en % anual. */
export function compoundSavings(initial: number, monthly: number, annualRate: number, years: number) {
  const months = Math.max(0, Math.round(years * 12))
  const r = annualRate / 100 / 12
  let total = Math.max(0, initial)
  for (let i = 0; i < months; i++) total = total * (1 + r) + Math.max(0, monthly)
  const contributed = Math.max(0, initial) + Math.max(0, monthly) * months
  return { total, contributed, interest: total - contributed }
}

/** Meses completos entre hoy y una fecha YYYY-MM-DD (mínimo 1). */
export function monthsUntil(date: string) {
  const target = new Date(`${date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(1, months)
}

export type RecurringFreq = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export const RECURRING_FREQ_LABELS: Record<RecurringFreq, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/**
 * Fecha (YYYY-MM-DD) de la ocurrencia siguiente a `dateKey`. En mensual y anual se conserva
 * `anchorDay` (el día del mes original), recortado en meses cortos: 31 ene → 28 feb → 31 mar.
 */
export function advanceRecurring(dateKey: string, freq: RecurringFreq, anchorDay: number): string {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
  if (freq === 'weekly' || freq === 'biweekly') return keyOf(new Date(y, m - 1, d + (freq === 'weekly' ? 7 : 14)))
  const target = new Date(y, m - 1 + (freq === 'monthly' ? 1 : 12), 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(anchorDay, lastDay))
  return keyOf(target)
}

/** Fechas de ocurrencia desde `fromKey` (incluida) hasta `untilKey` (incluida), con tope de seguridad. */
export function occurrencesUntil(fromKey: string, untilKey: string, freq: RecurringFreq, anchorDay: number, max = 400): string[] {
  const out: string[] = []
  let key = fromKey
  while (key <= untilKey && out.length < max) {
    out.push(key)
    key = advanceRecurring(key, freq, anchorDay)
  }
  return out
}
