import type { PaymentMethod } from '~/composables/useClients'
import { isPaymentMethod } from '~/composables/useClients'
import { advanceRecurring, occurrencesUntil, type RecurringFreq } from '~/utils/financeCalc'

export type TxType = 'gasto' | 'ingreso'

export type Transaction = {
  id: string
  type: TxType
  amount: number
  category: string
  note: string
  /** Fecha del movimiento en formato YYYY-MM-DD. */
  date: string
  method: PaymentMethod | null
  /** Gasto/ingreso fijo que lo generó, o null si se registró a mano. */
  recurringId: string | null
  /** Cliente al que corresponde (p. ej. el pago de un pedido), o null. */
  clientId: string | null
  createdAt: number
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'recurringId' | 'clientId'> &
  Partial<Pick<Transaction, 'recurringId' | 'clientId'>>

/** Gasto o ingreso que se repite solo (arriendo, suscripciones, salario…). */
export type RecurringTx = {
  id: string
  type: TxType
  amount: number
  category: string
  note: string
  method: PaymentMethod | null
  freq: RecurringFreq
  /** Primera fecha (YYYY-MM-DD); su día del mes se conserva en mensual/anual. */
  startDate: string
  /** Próxima fecha que aún no se ha registrado. */
  nextDate: string
  active: boolean
  createdAt: number
}

export type RecurringInput = Pick<RecurringTx, 'type' | 'amount' | 'category' | 'note' | 'method' | 'freq' | 'startDate'>

/** Límite mensual de gasto para una categoría. */
export type Budget = { category: string; limit: number }

export type SavingsGoal = {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
  /** Fecha límite (YYYY-MM-DD) o '' si no tiene. */
  deadline: string
  createdAt: number
}

export type DebtKind = 'debo' | 'me_deben'

export type Debt = {
  id: string
  kind: DebtKind
  person: string
  amount: number
  paid: number
  dueDate: string
  note: string
  createdAt: number
}

export const EXPENSE_CATEGORIES: Record<string, string> = {
  Comida: '🍔',
  Transporte: '🚌',
  Hogar: '🏠',
  Servicios: '💡',
  Salud: '💊',
  Ocio: '🎉',
  Compras: '🛍️',
  Educación: '📚',
  Insumos: '🧁',
  Otros: '✨',
}

export const INCOME_CATEGORIES: Record<string, string> = {
  Ventas: '💰',
  Salario: '💼',
  Regalo: '🎁',
  Otros: '✨',
}

export function categoryEmoji(category: string) {
  return EXPENSE_CATEGORIES[category] ?? INCOME_CATEGORIES[category] ?? '🏷️'
}

export const money = (n: number) => `$${Math.round(n).toLocaleString('es')}`

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM' del mes actual. */
export function currentMonth() {
  return todayISO().slice(0, 7)
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y!, m! - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  const label = new Date(y!, m! - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const STORAGE_KEY = 'todo-finance-v1'

type FinanceState = {
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  debts: Debt[]
  recurring: RecurringTx[]
}

const state = ref<FinanceState>({ transactions: [], budgets: [], goals: [], debts: [], recurring: [] })
let loaded = false

const positive = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0)
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object'

function sanitize(raw: unknown): FinanceState {
  const r = isObj(raw) ? raw : {}
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : [])
  return {
    transactions: arr(r.transactions)
      .filter((t) => typeof t.id === 'string')
      .map((t) => ({
        id: t.id,
        type: t.type === 'ingreso' ? 'ingreso' : 'gasto',
        amount: positive(t.amount),
        category: str(t.category, 'Otros') || 'Otros',
        note: str(t.note),
        date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : todayISO(),
        method: isPaymentMethod(t.method) ? t.method : null,
        recurringId: typeof t.recurringId === 'string' ? t.recurringId : null,
        clientId: typeof t.clientId === 'string' ? t.clientId : null,
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      })),
    budgets: arr(r.budgets)
      .filter((b) => typeof b.category === 'string' && b.category.trim())
      .map((b) => ({ category: b.category.trim(), limit: positive(b.limit) })),
    goals: arr(r.goals)
      .filter((g) => typeof g.id === 'string')
      .map((g) => ({
        id: g.id,
        name: str(g.name, 'Meta') || 'Meta',
        emoji: str(g.emoji, '🎯') || '🎯',
        target: positive(g.target),
        saved: positive(g.saved),
        deadline: str(g.deadline),
        createdAt: typeof g.createdAt === 'number' ? g.createdAt : Date.now(),
      })),
    debts: arr(r.debts)
      .filter((d) => typeof d.id === 'string')
      .map((d) => ({
        id: d.id,
        kind: d.kind === 'me_deben' ? 'me_deben' : 'debo',
        person: str(d.person, 'Sin nombre') || 'Sin nombre',
        amount: positive(d.amount),
        paid: positive(d.paid),
        dueDate: str(d.dueDate),
        note: str(d.note),
        createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
      })),
    recurring: arr(r.recurring)
      .filter((x) => typeof x.id === 'string' && isDateKey(x.startDate))
      .map((x) => ({
        id: x.id,
        type: x.type === 'ingreso' ? 'ingreso' : 'gasto',
        amount: positive(x.amount),
        category: str(x.category, 'Otros') || 'Otros',
        note: str(x.note),
        method: isPaymentMethod(x.method) ? x.method : null,
        freq: (['weekly', 'biweekly', 'monthly', 'yearly'] as const).includes(x.freq) ? x.freq : 'monthly',
        startDate: x.startDate,
        nextDate: isDateKey(x.nextDate) ? x.nextDate : x.startDate,
        active: x.active !== false,
        createdAt: typeof x.createdAt === 'number' ? x.createdAt : Date.now(),
      })),
  }
}

const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const anchorDay = (r: Pick<RecurringTx, 'startDate'>) => Number(r.startDate.slice(8, 10))

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    state.value = sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    state.value = sanitize(null)
  }
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

function normalizeTx(input: TransactionInput): TransactionInput {
  return {
    recurringId: input.recurringId ?? null,
    clientId: input.clientId ?? null,
    type: input.type === 'ingreso' ? 'ingreso' : 'gasto',
    amount: positive(input.amount),
    category: input.category.trim() || 'Otros',
    note: input.note.trim(),
    date: input.date || todayISO(),
    method: isPaymentMethod(input.method) ? input.method : null,
  }
}

export function useFinance() {
  load()

  const transactions = computed(() =>
    [...state.value.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
  )
  const budgets = computed(() => state.value.budgets)
  const goals = computed(() => state.value.goals)
  const debts = computed(() => state.value.debts)

  const usedCategories = computed(() => {
    const set = new Set<string>()
    for (const t of state.value.transactions) set.add(t.category)
    return Array.from(set)
  })

  function monthTransactions(month: string) {
    return transactions.value.filter((t) => t.date.startsWith(month))
  }

  function monthSummary(month: string) {
    let income = 0
    let expense = 0
    for (const t of monthTransactions(month)) {
      if (t.type === 'ingreso') income += t.amount
      else expense += t.amount
    }
    return { income, expense, balance: income - expense }
  }

  /** Totales por categoría del mes, de mayor a menor. */
  function categoryTotals(month: string, type: TxType) {
    const totals = new Map<string, number>()
    for (const t of monthTransactions(month)) {
      if (t.type === type) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
    }
    return Array.from(totals, ([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  }

  // --- Movimientos ---
  function addTransaction(input: TransactionInput) {
    const tx = normalizeTx(input)
    if (!tx.amount) return
    state.value.transactions.push({ ...tx, recurringId: tx.recurringId ?? null, clientId: tx.clientId ?? null, id: uuid(), createdAt: Date.now() })
    persist()
  }

  function updateTransaction(id: string, input: TransactionInput) {
    const tx = state.value.transactions.find((t) => t.id === id)
    const next = normalizeTx(input)
    if (!tx || !next.amount) return
    // El formulario no conoce estos vínculos: se conservan salvo que se indiquen.
    Object.assign(tx, next, { recurringId: input.recurringId ?? tx.recurringId, clientId: input.clientId ?? tx.clientId })
    persist()
  }

  function deleteTransaction(id: string) {
    state.value.transactions = state.value.transactions.filter((t) => t.id !== id)
    persist()
  }

  /** Agrega varios movimientos de una vez (importación) y omite los que ya existen. */
  function importTransactions(inputs: TransactionInput[]) {
    const seen = new Set(state.value.transactions.map((t) => `${t.date}|${t.type}|${t.amount}|${t.note.toLowerCase()}`))
    let added = 0
    let skipped = 0
    const now = Date.now()
    for (const input of inputs) {
      const tx = normalizeTx(input)
      const key = `${tx.date}|${tx.type}|${tx.amount}|${tx.note.toLowerCase()}`
      if (!tx.amount || seen.has(key)) {
        skipped++
        continue
      }
      seen.add(key)
      state.value.transactions.push({ ...tx, recurringId: null, clientId: null, id: uuid(), createdAt: now + added })
      added++
    }
    if (added) persist()
    return { added, skipped }
  }

  /** Total ya registrado en finanzas como ingreso de un cliente. */
  function clientIncome(clientId: string) {
    return state.value.transactions.filter((t) => t.clientId === clientId && t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  }

  // --- Gastos e ingresos fijos ---
  const recurring = computed(() => [...state.value.recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate)))

  /** Registra los movimientos fijos cuya fecha ya llegó (incluye los que se perdieron con la app cerrada). */
  function applyRecurring(today = todayISO()) {
    let created = 0
    for (const r of state.value.recurring) {
      if (!r.active || !r.amount) continue
      const dates = occurrencesUntil(r.nextDate, today, r.freq, anchorDay(r))
      for (const date of dates) {
        state.value.transactions.push({
          id: uuid(),
          type: r.type,
          amount: r.amount,
          category: r.category,
          note: r.note,
          date,
          method: r.method,
          recurringId: r.id,
          clientId: null,
          createdAt: Date.now() + created,
        })
        created++
      }
      if (dates.length) r.nextDate = advanceRecurring(dates[dates.length - 1]!, r.freq, anchorDay(r))
    }
    if (created) persist()
    return created
  }

  function addRecurring(input: RecurringInput) {
    const amount = positive(input.amount)
    if (!amount || !isDateKey(input.startDate)) return
    state.value.recurring.push({
      id: uuid(),
      type: input.type === 'ingreso' ? 'ingreso' : 'gasto',
      amount,
      category: input.category.trim() || 'Otros',
      note: input.note.trim(),
      method: isPaymentMethod(input.method) ? input.method : null,
      freq: input.freq,
      startDate: input.startDate,
      nextDate: input.startDate,
      active: true,
      createdAt: Date.now(),
    })
    persist()
    applyRecurring()
  }

  function updateRecurring(id: string, input: RecurringInput) {
    const r = state.value.recurring.find((x) => x.id === id)
    const amount = positive(input.amount)
    if (!r || !amount || !isDateKey(input.startDate)) return
    // Si cambia el calendario, la próxima fecha se recalcula desde el nuevo inicio sin repetir lo ya registrado.
    if (input.startDate !== r.startDate || input.freq !== r.freq) {
      const lastDone = state.value.transactions.filter((t) => t.recurringId === id).reduce((max, t) => (t.date > max ? t.date : max), '')
      let next = input.startDate
      while (lastDone && next <= lastDone) next = advanceRecurring(next, input.freq, Number(input.startDate.slice(8, 10)))
      r.nextDate = next
    }
    Object.assign(r, {
      type: input.type === 'ingreso' ? 'ingreso' : 'gasto',
      amount,
      category: input.category.trim() || 'Otros',
      note: input.note.trim(),
      method: isPaymentMethod(input.method) ? input.method : null,
      freq: input.freq,
      startDate: input.startDate,
    })
    persist()
    applyRecurring()
  }

  function toggleRecurring(id: string) {
    const r = state.value.recurring.find((x) => x.id === id)
    if (!r) return
    r.active = !r.active
    // Al reactivar no se cobran de golpe los meses en pausa: sigue desde hoy.
    if (r.active) {
      const today = todayISO()
      while (r.nextDate < today) r.nextDate = advanceRecurring(r.nextDate, r.freq, anchorDay(r))
    }
    persist()
    applyRecurring()
  }

  function deleteRecurring(id: string) {
    state.value.recurring = state.value.recurring.filter((x) => x.id !== id)
    persist()
  }

  /** Próximos cobros/ingresos fijos dentro de `days` días (desde mañana si ya se registró hoy). */
  function upcomingRecurring(days = 7) {
    const until = new Date()
    until.setDate(until.getDate() + days)
    const untilKey = `${until.getFullYear()}-${String(until.getMonth() + 1).padStart(2, '0')}-${String(until.getDate()).padStart(2, '0')}`
    return state.value.recurring
      .filter((r) => r.active)
      .flatMap((r) => occurrencesUntil(r.nextDate, untilKey, r.freq, anchorDay(r), 10).map((date) => ({ recurring: r, date })))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /** Ingresos y gastos de los últimos `count` meses (el más antiguo primero). */
  function monthlyHistory(count = 6) {
    const end = currentMonth()
    return Array.from({ length: count }, (_, i) => {
      const month = shiftMonth(end, i - count + 1)
      return { month, ...monthSummary(month) }
    })
  }

  // --- Presupuestos ---
  function setBudget(category: string, limit: number) {
    const name = category.trim()
    if (!name) return
    const existing = state.value.budgets.find((b) => b.category === name)
    if (limit > 0) {
      if (existing) existing.limit = limit
      else state.value.budgets.push({ category: name, limit })
    } else if (existing) {
      state.value.budgets = state.value.budgets.filter((b) => b !== existing)
    }
    persist()
  }

  // --- Metas de ahorro ---
  function addGoal(input: Pick<SavingsGoal, 'name' | 'emoji' | 'target' | 'deadline'>) {
    const name = input.name.trim()
    if (!name || !(input.target > 0)) return
    state.value.goals.push({ id: uuid(), name, emoji: input.emoji || '🎯', target: input.target, saved: 0, deadline: input.deadline, createdAt: Date.now() })
    persist()
  }

  /** Suma (o resta, con monto negativo) al ahorro de la meta. */
  function contributeToGoal(id: string, amount: number) {
    const goal = state.value.goals.find((g) => g.id === id)
    if (!goal || !Number.isFinite(amount)) return
    goal.saved = Math.max(0, goal.saved + amount)
    persist()
  }

  function deleteGoal(id: string) {
    state.value.goals = state.value.goals.filter((g) => g.id !== id)
    persist()
  }

  // --- Deudas ---
  function addDebt(input: Pick<Debt, 'kind' | 'person' | 'amount' | 'dueDate' | 'note'>) {
    const person = input.person.trim()
    if (!person || !(input.amount > 0)) return
    state.value.debts.push({ id: uuid(), ...input, person, note: input.note.trim(), paid: 0, createdAt: Date.now() })
    persist()
  }

  function payDebt(id: string, amount: number) {
    const debt = state.value.debts.find((d) => d.id === id)
    if (!debt || !Number.isFinite(amount)) return
    debt.paid = Math.min(debt.amount, Math.max(0, debt.paid + amount))
    persist()
  }

  function deleteDebt(id: string) {
    state.value.debts = state.value.debts.filter((d) => d.id !== id)
    persist()
  }

  return {
    transactions,
    budgets,
    goals,
    debts,
    usedCategories,
    monthTransactions,
    monthSummary,
    categoryTotals,
    monthlyHistory,
    addTransaction,
    importTransactions,
    clientIncome,
    recurring,
    applyRecurring,
    addRecurring,
    updateRecurring,
    toggleRecurring,
    deleteRecurring,
    upcomingRecurring,
    updateTransaction,
    deleteTransaction,
    setBudget,
    addGoal,
    contributeToGoal,
    deleteGoal,
    addDebt,
    payDebt,
    deleteDebt,
  }
}
