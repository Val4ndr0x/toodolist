<script setup lang="ts">
import { categoryEmoji, EXPENSE_CATEGORIES, money } from '~/composables/useFinance'

const props = defineProps<{ month: string }>()

const { budgets, categoryTotals, usedCategories, setBudget } = useFinance()

const spentBy = computed(() => new Map(categoryTotals(props.month, 'gasto').map((c) => [c.category, c.total])))

const rows = computed(() =>
  budgets.value
    .map((b) => {
      const spent = spentBy.value.get(b.category) ?? 0
      return { ...b, spent, pct: b.limit > 0 ? spent / b.limit : 0, left: b.limit - spent }
    })
    .sort((a, b) => b.pct - a.pct),
)

const totalLimit = computed(() => rows.value.reduce((s, r) => s + r.limit, 0))
const totalSpent = computed(() => rows.value.reduce((s, r) => s + r.spent, 0))

const categoryOptions = computed(() => {
  const set = new Set([...Object.keys(EXPENSE_CATEGORIES), ...usedCategories.value])
  for (const b of budgets.value) set.delete(b.category)
  return Array.from(set)
})

const newCategory = ref('')
const newLimit = ref<number | null>(null)

function add() {
  if (!newCategory.value.trim() || !newLimit.value || newLimit.value <= 0) return
  setBudget(newCategory.value, Number(newLimit.value))
  newCategory.value = ''
  newLimit.value = null
}

function edit(category: string, current: number) {
  const value = prompt(`Nuevo límite mensual para ${category} (0 para quitarlo):`, String(current))
  if (value === null) return
  const n = Number(value.replace(/[^\d.]/g, ''))
  if (Number.isFinite(n)) setBudget(category, n)
}

function barColor(pct: number) {
  if (pct >= 1) return 'bg-rose-500'
  if (pct >= 0.8) return 'bg-amber-400'
  return 'bg-emerald-500'
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-black/55 dark:text-muted">
      Ponle un límite mensual a cada categoría de gasto y mira cuánto te queda.
    </p>

    <div v-if="rows.length" class="fin-card">
      <div class="flex justify-between text-sm font-semibold text-black/70 dark:text-ink mb-2">
        <span>Total presupuestado</span>
        <span>{{ money(totalSpent) }} / {{ money(totalLimit) }}</span>
      </div>
      <div class="h-2.5 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
        <div class="h-full rounded-full transition-all" :class="barColor(totalLimit ? totalSpent / totalLimit : 0)" :style="{ width: `${Math.min(100, totalLimit ? (totalSpent / totalLimit) * 100 : 0)}%` }" />
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <button v-for="r in rows" :key="r.category" type="button" class="fin-card text-left hover:-translate-y-0.5 transition-transform" title="Editar límite" @click="edit(r.category, r.limit)">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="font-semibold text-black/75 dark:text-ink truncate">{{ categoryEmoji(r.category) }} {{ r.category }}</span>
          <span class="text-xs font-semibold" :class="r.left < 0 ? 'text-rose-500' : 'text-black/45 dark:text-muted'">
            {{ r.left < 0 ? `Excedido ${money(-r.left)}` : `Quedan ${money(r.left)}` }}
          </span>
        </div>
        <div class="h-2 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
          <div class="h-full rounded-full transition-all" :class="barColor(r.pct)" :style="{ width: `${Math.min(100, r.pct * 100)}%` }" />
        </div>
        <p class="mt-1.5 text-xs text-black/50 dark:text-muted">{{ money(r.spent) }} de {{ money(r.limit) }} · {{ Math.round(r.pct * 100) }}%</p>
      </button>
    </div>

    <form class="fin-card flex flex-col sm:flex-row gap-2" @submit.prevent="add">
      <input v-model="newCategory" type="text" list="budget-categories" maxlength="40" placeholder="Categoría" :class="[inputCls, 'flex-1']" />
      <datalist id="budget-categories">
        <option v-for="c in categoryOptions" :key="c" :value="c" />
      </datalist>
      <input v-model.number="newLimit" type="number" min="0" step="any" placeholder="Límite mensual" :class="[inputCls, 'sm:w-40']" />
      <button type="submit" class="px-4 py-2 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5] transition-colors">
        Agregar
      </button>
    </form>
  </div>
</template>
