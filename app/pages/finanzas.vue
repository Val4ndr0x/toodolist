<script setup lang="ts">
import type { Transaction, TransactionInput, TxType } from '~/composables/useFinance'
import { categoryEmoji, currentMonth, money, monthLabel, shiftMonth } from '~/composables/useFinance'

const { monthTransactions, monthSummary, categoryTotals, addTransaction, updateTransaction, deleteTransaction } = useFinance()
const { clients } = useClients()
const clientName = (id: string | null) => (id ? clients.value.find((c) => c.id === id)?.name ?? null : null)

type Tab = 'resumen' | 'movimientos' | 'fijos' | 'presupuestos' | 'metas' | 'deudas' | 'libros' | 'calculadoras'
const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'fijos', label: '↻ Fijos' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'metas', label: 'Metas' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'libros', label: '📚 Libros' },
  { id: 'calculadoras', label: 'Calculadoras' },
]
// Desde la búsqueda global o la página Hoy se puede llegar con ?tab=…&month=YYYY-MM&q=…
const route = useRoute()
const queryTab = String(route.query.tab ?? '')
const tab = ref<Tab>(TABS.some((t) => t.id === queryTab) ? (queryTab as Tab) : 'resumen')
const month = ref(/^\d{4}-\d{2}$/.test(String(route.query.month ?? '')) ? String(route.query.month) : currentMonth())
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const showImport = ref(false)

function onImported(m: string) {
  month.value = m
  tab.value = 'movimientos'
}

const summary = computed(() => monthSummary(month.value))
const prevSummary = computed(() => monthSummary(shiftMonth(month.value, -1)))
const expenseByCategory = computed(() => categoryTotals(month.value, 'gasto'))
const incomeByCategory = computed(() => categoryTotals(month.value, 'ingreso'))
const savingsRate = computed(() => (summary.value.income > 0 ? summary.value.balance / summary.value.income : null))
const expenseChange = computed(() => {
  const prev = prevSummary.value.expense
  return prev > 0 ? (summary.value.expense - prev) / prev : null
})

/** Gasto promedio por día del mes (hasta hoy si es el mes en curso). */
const dailyAverage = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  const daysInMonth = new Date(y!, m!, 0).getDate()
  const days = month.value === currentMonth() ? new Date().getDate() : daysInMonth
  return summary.value.expense / Math.max(1, days)
})

const typeFilter = ref<'todos' | TxType>('todos')
const visibleTx = computed(() => {
  const q = search.value.trim().toLowerCase()
  return monthTransactions(month.value).filter(
    (t) =>
      (typeFilter.value === 'todos' || t.type === typeFilter.value) &&
      (!q || t.category.toLowerCase().includes(q) || t.note.toLowerCase().includes(q)),
  )
})
const txByDay = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const t of visibleTx.value) {
    if (!groups.has(t.date)) groups.set(t.date, [])
    groups.get(t.date)!.push(t)
  }
  return Array.from(groups, ([date, items]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }),
    net: items.reduce((s, t) => s + (t.type === 'ingreso' ? t.amount : -t.amount), 0),
    items,
  }))
})

const showModal = ref(false)
const editing = ref<Transaction | null>(null)
const defaultType = ref<TxType>('gasto')

function openCreate(type: TxType = 'gasto') {
  editing.value = null
  defaultType.value = type
  showModal.value = true
}

function openEdit(tx: Transaction) {
  editing.value = tx
  showModal.value = true
}

function onSave(input: TransactionInput) {
  if (editing.value) updateTransaction(editing.value.id, input)
  else addTransaction(input)
  // Al registrar en otro mes, salta a ese mes para que se vea el movimiento.
  month.value = input.date.slice(0, 7)
  showModal.value = false
}

function onDelete(id: string) {
  deleteTransaction(id)
  showModal.value = false
}

const pct = (n: number) => `${Math.round(n * 100)}%`
</script>

<template>
  <div class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0 pb-24 sm:pb-6">
      <AppHeader title="Finanzas" searchable search-placeholder="Buscar movimientos..." v-model:search-model="search" />

      <div class="fin-panel mx-3 sm:mx-6 rounded-[28px] p-4 sm:p-6">
        <div class="flex items-center justify-between gap-2 mb-4">
          <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-black/50 dark:text-muted hover:bg-white/60 dark:hover:bg-surface-soft" title="Mes anterior" @click="month = shiftMonth(month, -1)">
            <AppIcon name="arrow-left" :size="18" />
          </button>
          <button type="button" class="font-bold text-black/75 dark:text-ink" title="Ir al mes actual" @click="month = currentMonth()">
            {{ monthLabel(month) }}
          </button>
          <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-black/50 dark:text-muted hover:bg-white/60 dark:hover:bg-surface-soft rotate-180" title="Mes siguiente" @click="month = shiftMonth(month, 1)">
            <AppIcon name="arrow-left" :size="18" />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div class="fin-card">
            <p class="text-xs text-black/50 dark:text-muted">Ingresos</p>
            <p class="text-base sm:text-xl font-bold text-emerald-600 truncate">{{ money(summary.income) }}</p>
          </div>
          <div class="fin-card">
            <p class="text-xs text-black/50 dark:text-muted">Gastos</p>
            <p class="text-base sm:text-xl font-bold text-rose-500 truncate">{{ money(summary.expense) }}</p>
          </div>
          <div class="fin-card">
            <p class="text-xs text-black/50 dark:text-muted">Balance</p>
            <p class="text-base sm:text-xl font-bold truncate" :class="summary.balance >= 0 ? 'text-black/80 dark:text-ink' : 'text-rose-500'">
              {{ summary.balance < 0 ? '−' : '' }}{{ money(Math.abs(summary.balance)) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 pb-4 overflow-x-auto">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            :class="tab === t.id
              ? 'bg-white dark:bg-surface-soft text-black/75 dark:text-ink shadow-sm'
              : 'text-black/45 dark:text-muted hover:text-black/70 dark:hover:text-ink hover:bg-white/50 dark:hover:bg-surface-soft/50'"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Resumen -->
        <div v-if="tab === 'resumen'" class="flex flex-col gap-4">
          <div class="flex gap-2">
            <button type="button" class="flex-1 py-2.5 rounded-2xl bg-rose-400 text-white font-semibold hover:bg-rose-500 transition-colors" @click="openCreate('gasto')">− Gasto</button>
            <button type="button" class="flex-1 py-2.5 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors" @click="openCreate('ingreso')">+ Ingreso</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="fin-card">
              <p class="text-xs text-black/50 dark:text-muted">Tasa de ahorro</p>
              <p class="text-lg font-bold text-black/80 dark:text-ink">{{ savingsRate === null ? '—' : pct(savingsRate) }}</p>
              <p class="text-[11px] text-black/45 dark:text-muted">de tus ingresos te quedó</p>
            </div>
            <div class="fin-card">
              <p class="text-xs text-black/50 dark:text-muted">Gasto diario promedio</p>
              <p class="text-lg font-bold text-black/80 dark:text-ink">{{ money(dailyAverage) }}</p>
            </div>
            <div class="fin-card">
              <p class="text-xs text-black/50 dark:text-muted">vs. mes anterior</p>
              <p class="text-lg font-bold" :class="expenseChange === null ? 'text-black/80 dark:text-ink' : expenseChange > 0 ? 'text-rose-500' : 'text-emerald-600'">
                {{ expenseChange === null ? '—' : `${expenseChange > 0 ? '▲' : '▼'} ${pct(Math.abs(expenseChange))}` }}
              </p>
              <p class="text-[11px] text-black/45 dark:text-muted">en gastos ({{ money(prevSummary.expense) }})</p>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div v-for="block in [
              { title: '¿En qué se fue el dinero?', rows: expenseByCategory, total: summary.expense, bar: 'bg-rose-400', empty: 'Sin gastos este mes' },
              { title: '¿De dónde vino?', rows: incomeByCategory, total: summary.income, bar: 'bg-emerald-500', empty: 'Sin ingresos este mes' },
            ]" :key="block.title" class="fin-card">
              <h3 class="text-sm font-bold text-black/70 dark:text-ink mb-3">{{ block.title }}</h3>
              <p v-if="!block.rows.length" class="text-xs text-black/45 dark:text-muted">{{ block.empty }}</p>
              <div v-for="r in block.rows" :key="r.category" class="mb-2.5 last:mb-0">
                <div class="flex justify-between text-xs text-black/65 dark:text-ink/80 mb-1">
                  <span>{{ categoryEmoji(r.category) }} {{ r.category }}</span>
                  <span class="font-semibold">{{ money(r.total) }} · {{ pct(r.total / block.total) }}</span>
                </div>
                <div class="h-2 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
                  <div class="h-full rounded-full" :class="block.bar" :style="{ width: `${(r.total / block.total) * 100}%` }" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Movimientos -->
        <div v-else-if="tab === 'movimientos'" class="flex flex-col gap-3">
          <div class="flex gap-1.5 items-center">
            <button
              v-for="f in (['todos', 'gasto', 'ingreso'] as const)"
              :key="f"
              type="button"
              class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              :class="typeFilter === f ? 'bg-black/75 dark:bg-accent text-white' : 'bg-white/60 dark:bg-surface-soft text-black/50 dark:text-muted'"
              @click="typeFilter = f"
            >
              {{ f === 'todos' ? 'Todos' : f === 'gasto' ? 'Gastos' : 'Ingresos' }}
            </button>
            <span class="flex-1" />
            <button
              type="button"
              class="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-surface-soft text-black/60 dark:text-muted hover:text-black/85 dark:hover:text-ink"
              title="Importar movimientos desde el CSV de tu banco"
              @click="showImport = true"
            >
              ⬆ Importar CSV
            </button>
          </div>

          <section v-for="day in txByDay" :key="day.date">
            <div class="flex justify-between px-1 mb-1.5 text-xs font-semibold text-black/50 dark:text-muted">
              <span class="capitalize">{{ day.label }}</span>
              <span :class="day.net >= 0 ? 'text-emerald-600' : 'text-rose-500'">{{ day.net >= 0 ? '+' : '−' }}{{ money(Math.abs(day.net)) }}</span>
            </div>
            <div class="fin-card !p-1">
              <button
                v-for="t in day.items"
                :key="t.id"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-black/5 dark:hover:bg-surface-soft transition-colors"
                @click="openEdit(t)"
              >
                <span class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-lg" :class="t.type === 'gasto' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'">
                  {{ categoryEmoji(t.category) }}
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold text-black/75 dark:text-ink truncate">{{ t.note || t.category }}</span>
                  <span class="block text-xs text-black/45 dark:text-muted truncate">
                    {{ t.category }}<template v-if="t.recurringId"> · ↻ fijo</template><template v-if="clientName(t.clientId)"> · 🎀 {{ clientName(t.clientId) }}</template>
                  </span>
                </span>
                <span class="text-sm font-bold tabular-nums" :class="t.type === 'gasto' ? 'text-rose-500' : 'text-emerald-600'">
                  {{ t.type === 'gasto' ? '−' : '+' }}{{ money(t.amount) }}
                </span>
              </button>
            </div>
          </section>

          <p v-if="!txByDay.length" class="text-center text-sm text-black/45 dark:text-muted py-8">
            {{ search ? `No hay movimientos para "${search}"` : 'No hay movimientos este mes. Toca + para agregar uno 💸' }}
          </p>
        </div>

        <FinanceRecurring v-else-if="tab === 'fijos'" />
        <FinanceBudgets v-else-if="tab === 'presupuestos'" :month="month" />
        <FinanceGoals v-else-if="tab === 'metas'" />
        <FinanceDebts v-else-if="tab === 'deudas'" />
        <FinanceReading v-else-if="tab === 'libros'" />
        <FinanceCalculators v-else />
      </div>
    </div>

    <FloatingAddButton label="Nuevo movimiento" @click="openCreate()" />

    <FinanceImportModal v-if="showImport" @close="showImport = false" @imported="onImported" />

    <FinanceTxModal v-if="showModal" :tx="editing" :default-type="defaultType" @close="showModal = false" @save="onSave" @delete="onDelete" />
  </div>
</template>

<style>
.fin-panel {
  background: linear-gradient(135deg, #eaf6f0 0%, #fef6e7 50%, #fdeef4 100%);
}
.dark .fin-panel {
  background: linear-gradient(135deg, #1a1e1c 0%, #201f26 55%, #1c1c21 100%);
}
/* Sin `display` propio: así las utilidades como `flex` de cada tarjeta sí se aplican. */
.fin-card {
  border-radius: 20px;
  padding: 0.9rem 1rem;
  background: rgb(255 255 255 / 0.75);
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.05);
}
.dark .fin-card {
  background: rgb(var(--c-surface));
  box-shadow: none;
}
</style>
