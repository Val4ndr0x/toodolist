<script setup lang="ts">
import type { PaymentMethod } from '~/composables/useClients'
import { PAYMENT_METHODS } from '~/composables/useClients'
import type { RecurringInput, RecurringTx, TxType } from '~/composables/useFinance'
import { categoryEmoji, EXPENSE_CATEGORIES, INCOME_CATEGORIES, money, todayISO } from '~/composables/useFinance'
import { RECURRING_FREQ_LABELS, type RecurringFreq } from '~/utils/financeCalc'

const { recurring, addRecurring, updateRecurring, toggleRecurring, deleteRecurring, upcomingRecurring } = useFinance()

/** Equivalente mensual, para sumar fijos de distinta frecuencia. */
const MONTHLY_FACTOR: Record<RecurringFreq, number> = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, yearly: 1 / 12 }

const monthlyTotals = computed(() => {
  let expense = 0
  let income = 0
  for (const r of recurring.value) {
    if (!r.active) continue
    const m = r.amount * MONTHLY_FACTOR[r.freq]
    if (r.type === 'gasto') expense += m
    else income += m
  }
  return { expense, income }
})

const upcoming = computed(() => upcomingRecurring(14).slice(0, 6))

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  type: 'gasto' as TxType,
  amount: null as number | null,
  category: '',
  note: '',
  method: null as PaymentMethod | null,
  freq: 'monthly' as RecurringFreq,
  startDate: todayISO(),
})

const presets = computed(() => (form.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES))

function openCreate() {
  editingId.value = null
  Object.assign(form, { type: 'gasto', amount: null, category: '', note: '', method: null, freq: 'monthly', startDate: todayISO() })
  showForm.value = true
}

function openEdit(r: RecurringTx) {
  editingId.value = r.id
  Object.assign(form, { type: r.type, amount: r.amount, category: r.category, note: r.note, method: r.method, freq: r.freq, startDate: r.startDate })
  showForm.value = true
}

function save() {
  if (!form.amount || form.amount <= 0 || !form.startDate) return
  const input: RecurringInput = { ...form, amount: Number(form.amount), category: form.category || 'Otros' }
  if (editingId.value) updateRecurring(editingId.value, input)
  else addRecurring(input)
  showForm.value = false
}

function remove(r: RecurringTx) {
  if (confirm(`¿Eliminar «${r.note || r.category}»? Los movimientos ya registrados se conservan.`)) deleteRecurring(r.id)
}

function shortDate(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
const chipCls = (on: boolean) =>
  on ? 'bg-[#f4a8c4] text-white shadow-sm' : 'bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink'
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-black/55 dark:text-muted">
      Arriendo, suscripciones, salario… Regístralos una vez y se anotarán solos en su fecha.
    </p>

    <div class="grid grid-cols-2 gap-3">
      <div class="fin-card">
        <p class="text-xs text-black/50 dark:text-muted">Gastos fijos al mes</p>
        <p class="text-lg font-bold text-rose-500">{{ money(monthlyTotals.expense) }}</p>
      </div>
      <div class="fin-card">
        <p class="text-xs text-black/50 dark:text-muted">Ingresos fijos al mes</p>
        <p class="text-lg font-bold text-emerald-600">{{ money(monthlyTotals.income) }}</p>
      </div>
    </div>

    <div v-if="upcoming.length" class="fin-card">
      <h3 class="text-sm font-bold text-black/70 dark:text-ink mb-2">Próximos 14 días</h3>
      <div v-for="u in upcoming" :key="`${u.recurring.id}-${u.date}`" class="flex items-center justify-between gap-2 py-1 text-sm">
        <span class="truncate text-black/70 dark:text-ink/85">
          <span class="capitalize text-black/45 dark:text-muted">{{ shortDate(u.date) }}</span> · {{ categoryEmoji(u.recurring.category) }} {{ u.recurring.note || u.recurring.category }}
        </span>
        <span class="font-semibold tabular-nums shrink-0" :class="u.recurring.type === 'gasto' ? 'text-rose-500' : 'text-emerald-600'">
          {{ u.recurring.type === 'gasto' ? '−' : '+' }}{{ money(u.recurring.amount) }}
        </span>
      </div>
    </div>

    <div class="fin-card !p-1">
      <p v-if="!recurring.length" class="text-sm text-center text-black/45 dark:text-muted py-6">Aún no tienes movimientos fijos.</p>
      <div v-for="r in recurring" :key="r.id" class="flex items-center gap-3 px-3 py-2.5 rounded-xl" :class="r.active ? '' : 'opacity-50'">
        <span class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-lg" :class="r.type === 'gasto' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'">
          {{ categoryEmoji(r.category) }}
        </span>
        <button type="button" class="flex-1 min-w-0 text-left" @click="openEdit(r)">
          <span class="block text-sm font-semibold text-black/75 dark:text-ink truncate">{{ r.note || r.category }}</span>
          <span class="block text-xs text-black/45 dark:text-muted truncate">
            {{ RECURRING_FREQ_LABELS[r.freq] }} · {{ r.active ? `próximo ${shortDate(r.nextDate)}` : 'en pausa' }}
          </span>
        </button>
        <span class="text-sm font-bold tabular-nums" :class="r.type === 'gasto' ? 'text-rose-500' : 'text-emerald-600'">
          {{ r.type === 'gasto' ? '−' : '+' }}{{ money(r.amount) }}
        </span>
        <button type="button" class="text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink" :title="r.active ? 'Pausar' : 'Reanudar'" @click="toggleRecurring(r.id)">
          {{ r.active ? '⏸' : '▶' }}
        </button>
        <button type="button" class="text-black/30 dark:text-muted hover:text-danger px-1" aria-label="Eliminar" @click="remove(r)">✕</button>
      </div>
    </div>

    <button v-if="!showForm" type="button" class="py-2.5 rounded-2xl bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] transition-colors" @click="openCreate">
      + Nuevo gasto o ingreso fijo
    </button>

    <form v-else class="fin-card" @submit.prevent="save">
      <div class="flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-1.5 bg-black/5 dark:bg-surface-soft rounded-full p-1">
        <button
          v-for="t in (['gasto', 'ingreso'] as const)"
          :key="t"
          type="button"
          class="py-1.5 rounded-full text-sm font-semibold transition-colors"
          :class="form.type === t ? (t === 'gasto' ? 'bg-rose-400 text-white' : 'bg-emerald-500 text-white') : 'text-black/50 dark:text-muted'"
          @click="form.type = t; form.category = ''"
        >
          {{ t === 'gasto' ? '− Gasto' : '+ Ingreso' }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input v-model.number="form.amount" type="number" min="0" step="any" placeholder="Monto" :class="[inputCls, 'font-bold']" />
        <input v-model="form.note" type="text" maxlength="80" placeholder="Nombre (p. ej. Netflix)" :class="inputCls" />
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="(emoji, name) in presets" :key="name" type="button" class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" :class="chipCls(form.category === name)" @click="form.category = name">
          {{ emoji }} {{ name }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1 text-xs font-medium text-black/55 dark:text-muted">
          Se repite
          <select v-model="form.freq" :class="inputCls">
            <option v-for="(label, key) in RECURRING_FREQ_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-xs font-medium text-black/55 dark:text-muted">
          Primera fecha
          <input v-model="form.startDate" type="date" :class="inputCls" />
        </label>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="(m, key) in PAYMENT_METHODS" :key="key" type="button" class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" :class="chipCls(form.method === key)" @click="form.method = form.method === key ? null : key">
          {{ m.emoji }} {{ m.label }}
        </button>
      </div>
      <p v-if="!editingId && form.startDate < todayISO()" class="text-xs text-amber-600 dark:text-amber-300">
        La fecha ya pasó: se registrarán también las repeticiones atrasadas hasta hoy.
      </p>
      <div class="flex justify-end gap-2">
        <button type="button" class="px-4 py-2 rounded-lg text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink" @click="showForm = false">Cancelar</button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5]">{{ editingId ? 'Guardar' : 'Agregar' }}</button>
      </div>
      </div>
    </form>
  </div>
</template>
