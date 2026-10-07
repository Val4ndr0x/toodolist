<script setup lang="ts">
import { categoryEmoji, money, monthLabel } from '~/composables/useFinance'

const { monthlyHistory, categoryTotals } = useFinance()

const range = ref<6 | 12>(6)
const history = computed(() => monthlyHistory(range.value))
const maxValue = computed(() => Math.max(1, ...history.value.flatMap((m) => [m.income, m.expense])))
const hasData = computed(() => history.value.some((m) => m.income || m.expense))

const shortMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  return new Date(y!, m! - 1, 1).toLocaleDateString('es', { month: 'short' }).replace('.', '')
}

const totals = computed(() => {
  const income = history.value.reduce((s, m) => s + m.income, 0)
  const expense = history.value.reduce((s, m) => s + m.expense, 0)
  const withExpense = history.value.filter((m) => m.expense > 0).length
  return { income, expense, avgExpense: withExpense ? expense / withExpense : 0, savingsRate: income > 0 ? (income - expense) / income : null }
})

const bestMonth = computed(() => {
  const withData = history.value.filter((m) => m.income || m.expense)
  if (!withData.length) return null
  return withData.reduce((best, m) => (m.balance > best.balance ? m : best))
})

/** Gasto por categoría sumando todo el periodo. */
const topCategories = computed(() => {
  const totalsBy = new Map<string, number>()
  for (const m of history.value) for (const c of categoryTotals(m.month, 'gasto')) totalsBy.set(c.category, (totalsBy.get(c.category) ?? 0) + c.total)
  const rows = Array.from(totalsBy, ([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  return rows.slice(0, 6)
})
const maxCategory = computed(() => Math.max(1, ...topCategories.value.map((c) => c.total)))

const hovered = ref<string | null>(null)
const hoveredMonth = computed(() => history.value.find((m) => m.month === hovered.value) ?? null)
const showTable = ref(false)

const signed = (n: number) => `${n < 0 ? '−' : ''}${money(Math.abs(n))}`
</script>

<template>
  <div class="fs-panel mx-3 sm:mx-6 mb-6 rounded-[28px] p-4 sm:p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-base font-bold fs-ink">💸 Finanzas</h2>
      <div class="flex gap-1 rounded-full p-1 fs-track">
        <button
          v-for="r in ([6, 12] as const)"
          :key="r"
          type="button"
          class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
          :class="range === r ? 'fs-card shadow-sm fs-ink' : 'fs-muted'"
          @click="range = r"
        >
          {{ r }} meses
        </button>
      </div>
    </div>

    <p v-if="!hasData" class="fs-card rounded-2xl p-4 text-sm fs-muted">
      Aún no hay movimientos en estos meses. Regístralos en <NuxtLink to="/finanzas" class="underline">Finanzas</NuxtLink> para ver tu evolución aquí.
    </p>

    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="fs-card rounded-2xl p-3.5">
          <p class="text-xs fs-muted">Ingresos</p>
          <p class="text-lg font-bold fs-ink tabular-nums">{{ money(totals.income) }}</p>
        </div>
        <div class="fs-card rounded-2xl p-3.5">
          <p class="text-xs fs-muted">Gastos</p>
          <p class="text-lg font-bold fs-ink tabular-nums">{{ money(totals.expense) }}</p>
        </div>
        <div class="fs-card rounded-2xl p-3.5">
          <p class="text-xs fs-muted">Gasto mensual promedio</p>
          <p class="text-lg font-bold fs-ink tabular-nums">{{ money(totals.avgExpense) }}</p>
        </div>
        <div class="fs-card rounded-2xl p-3.5">
          <p class="text-xs fs-muted">Tasa de ahorro</p>
          <p class="text-lg font-bold fs-ink tabular-nums">{{ totals.savingsRate === null ? '—' : `${Math.round(totals.savingsRate * 100)}%` }}</p>
          <p v-if="bestMonth" class="text-[11px] fs-muted truncate">Mejor mes: {{ monthLabel(bestMonth.month) }}</p>
        </div>
      </div>

      <div class="fs-card rounded-2xl p-4">
        <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <span class="text-xs font-medium fs-muted">Ingresos y gastos por mes</span>
          <div class="flex items-center gap-3 text-[11px] fs-muted">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm fs-income" /> Ingresos</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm fs-expense" /> Gastos</span>
          </div>
        </div>

        <div class="relative">
          <div class="flex items-end gap-1.5 sm:gap-3 h-40 border-b fs-axis" @mouseleave="hovered = null">
            <button
              v-for="m in history"
              :key="m.month"
              type="button"
              class="flex-1 h-full flex items-end justify-center gap-[2px] rounded-t-md transition-colors"
              :class="hovered === m.month ? 'fs-hover' : ''"
              :aria-label="`${monthLabel(m.month)}: ingresos ${money(m.income)}, gastos ${money(m.expense)}`"
              @mouseenter="hovered = m.month"
              @focus="hovered = m.month"
              @click="hovered = hovered === m.month ? null : m.month"
            >
              <span class="w-full max-w-4 rounded-t-[4px] fs-income" :style="{ height: m.income ? `${Math.max(2, (m.income / maxValue) * 100)}%` : '0' }" />
              <span class="w-full max-w-4 rounded-t-[4px] fs-expense" :style="{ height: m.expense ? `${Math.max(2, (m.expense / maxValue) * 100)}%` : '0' }" />
            </button>
          </div>
          <div class="flex gap-1.5 sm:gap-3 mt-1.5">
            <span v-for="m in history" :key="m.month" class="flex-1 text-center text-[10px] fs-muted capitalize">{{ shortMonth(m.month) }}</span>
          </div>

          <div
            v-if="hoveredMonth"
            class="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none rounded-xl px-3 py-2 text-xs shadow-lg fs-tooltip min-w-[11rem]"
          >
            <p class="font-semibold mb-1">{{ monthLabel(hoveredMonth.month) }}</p>
            <p class="flex justify-between gap-3"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm fs-income" />Ingresos</span><span class="tabular-nums">{{ money(hoveredMonth.income) }}</span></p>
            <p class="flex justify-between gap-3"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm fs-expense" />Gastos</span><span class="tabular-nums">{{ money(hoveredMonth.expense) }}</span></p>
            <p class="flex justify-between gap-3 mt-1 pt-1 border-t border-current/20 font-semibold"><span>Balance</span><span class="tabular-nums">{{ signed(hoveredMonth.balance) }}</span></p>
          </div>
        </div>

        <button type="button" class="mt-3 text-[11px] fs-muted underline-offset-2 hover:underline" @click="showTable = !showTable">
          {{ showTable ? 'Ocultar tabla' : 'Ver como tabla' }}
        </button>
        <table v-if="showTable" class="w-full mt-2 text-sm fs-ink">
          <thead>
            <tr class="text-[11px] fs-muted text-right">
              <th class="text-left font-medium pb-1.5">Mes</th>
              <th class="font-medium pb-1.5">Ingresos</th>
              <th class="font-medium pb-1.5">Gastos</th>
              <th class="font-medium pb-1.5">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in history" :key="m.month" class="border-t fs-axis text-right tabular-nums">
              <td class="text-left py-1.5">{{ monthLabel(m.month) }}</td>
              <td class="py-1.5">{{ money(m.income) }}</td>
              <td class="py-1.5">{{ money(m.expense) }}</td>
              <td class="py-1.5 font-semibold">{{ signed(m.balance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="topCategories.length" class="fs-card rounded-2xl p-4">
        <span class="text-xs font-medium fs-muted block mb-3">¿En qué se fue el dinero? ({{ range }} meses)</span>
        <div v-for="c in topCategories" :key="c.category" class="mb-2.5 last:mb-0">
          <div class="flex justify-between text-xs fs-ink mb-1">
            <span>{{ categoryEmoji(c.category) }} {{ c.category }}</span>
            <span class="font-semibold tabular-nums">{{ money(c.total) }} · {{ Math.round((c.total / totals.expense) * 100) }}%</span>
          </div>
          <div class="h-2 rounded-full fs-track overflow-hidden">
            <div class="h-full rounded-full fs-expense-solid" :style="{ width: `${(c.total / maxCategory) * 100}%` }" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Ingresos/gastos: par validado para daltonismo en la zona límite, así que los gastos llevan además rayado. */
.fs-panel {
  --fs-income: #0d9488;
  --fs-expense: #f472b6;
  background: linear-gradient(135deg, #eaf6f0 0%, #fef6e7 50%, #fdeef4 100%);
}
.fs-card { background: #fff; }
.fs-ink { color: rgb(0 0 0 / 0.8); }
.fs-muted { color: rgb(0 0 0 / 0.5); }
.fs-track { background: rgb(0 0 0 / 0.07); }
.fs-axis { border-color: rgb(0 0 0 / 0.1); }
.fs-hover { background: rgb(0 0 0 / 0.04); }
.fs-tooltip { background: #1f1f24; color: #fff; }
.fs-income { background: var(--fs-income); }
.fs-expense {
  background: repeating-linear-gradient(45deg, var(--fs-expense) 0 4px, color-mix(in srgb, var(--fs-expense) 70%, white) 4px 6px);
}
.fs-expense-solid { background: var(--fs-expense); }

:global(.dark) .fs-panel {
  --fs-expense: #ec4899;
  background: linear-gradient(135deg, #1a1e1c 0%, #201f26 55%, #1c1c21 100%);
}
:global(.dark) .fs-card { background: rgb(var(--c-surface)); }
:global(.dark) .fs-ink { color: rgb(var(--c-ink)); }
:global(.dark) .fs-muted { color: rgb(var(--c-muted)); }
:global(.dark) .fs-track { background: rgb(255 255 255 / 0.08); }
:global(.dark) .fs-axis { border-color: rgb(255 255 255 / 0.1); }
:global(.dark) .fs-hover { background: rgb(255 255 255 / 0.05); }
:global(.dark) .fs-tooltip { background: #f4f4f5; color: #18181b; }
:global(.dark) .fs-expense {
  background: repeating-linear-gradient(45deg, var(--fs-expense) 0 4px, color-mix(in srgb, var(--fs-expense) 60%, black) 4px 6px);
}
</style>
