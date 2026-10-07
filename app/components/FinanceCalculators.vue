<script setup lang="ts">
import { money } from '~/composables/useFinance'

type CalcId = 'credito' | 'ahorro' | 'dividir' | 'porcentaje'
const CALCS: { id: CalcId; label: string }[] = [
  { id: 'credito', label: '🏦 Crédito' },
  { id: 'ahorro', label: '🐷 Ahorro e interés' },
  { id: 'dividir', label: '🍕 Dividir cuenta' },
  { id: 'porcentaje', label: '％ Porcentajes' },
]
const active = ref<CalcId>('credito')

// Crédito / préstamo
const loanAmount = ref<number | null>(1000000)
const loanRate = ref<number | null>(24)
const loanMonths = ref<number | null>(12)
const showTable = ref(false)
const loanPay = computed(() => loanPayment(loanAmount.value ?? 0, loanRate.value ?? 0, Math.round(loanMonths.value ?? 0)))
const loanTotal = computed(() => loanPay.value * Math.round(loanMonths.value ?? 0))
const loanRows = computed(() => (showTable.value ? amortization(loanAmount.value ?? 0, loanRate.value ?? 0, Math.round(loanMonths.value ?? 0)) : []))

// Ahorro con interés compuesto
const saveInitial = ref<number | null>(0)
const saveMonthly = ref<number | null>(100000)
const saveRate = ref<number | null>(10)
const saveYears = ref<number | null>(3)
const savings = computed(() => compoundSavings(saveInitial.value ?? 0, saveMonthly.value ?? 0, saveRate.value ?? 0, saveYears.value ?? 0))

// Dividir cuenta
const billTotal = ref<number | null>(null)
const billPeople = ref<number | null>(2)
const billTip = ref<number | null>(10)
const billWithTip = computed(() => (billTotal.value ?? 0) * (1 + (billTip.value ?? 0) / 100))
const billEach = computed(() => (billPeople.value && billPeople.value > 0 ? billWithTip.value / billPeople.value : 0))

// Porcentajes
const pctValue = ref<number | null>(null)
const pctRate = ref<number | null>(10)
const pctOf = computed(() => ((pctValue.value ?? 0) * (pctRate.value ?? 0)) / 100)

const inputCls =
  'w-full min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
const labelCls = 'flex flex-col gap-1 text-xs font-medium text-black/55 dark:text-muted'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-1.5 overflow-x-auto pb-1">
      <button
        v-for="c in CALCS"
        :key="c.id"
        type="button"
        class="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
        :class="active === c.id ? 'bg-white dark:bg-surface-soft text-black/75 dark:text-ink shadow-sm' : 'text-black/45 dark:text-muted hover:text-black/70 dark:hover:text-ink'"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- Crédito -->
    <div v-if="active === 'credito'" class="fin-card flex flex-col gap-3">
      <p class="text-sm text-black/55 dark:text-muted">Calcula la cuota mensual fija de un préstamo (sistema francés).</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label :class="labelCls">Monto del préstamo<input v-model.number="loanAmount" type="number" min="0" step="any" :class="inputCls" /></label>
        <label :class="labelCls">Tasa de interés anual (%)<input v-model.number="loanRate" type="number" min="0" step="any" :class="inputCls" /></label>
        <label :class="labelCls">Plazo (meses)<input v-model.number="loanMonths" type="number" min="1" step="1" :class="inputCls" /></label>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Cuota mensual</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ money(loanPay) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Total a pagar</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ money(loanTotal) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Intereses</p>
          <p class="font-bold text-rose-500">{{ money(Math.max(0, loanTotal - (loanAmount ?? 0))) }}</p>
        </div>
      </div>
      <button type="button" class="self-start text-xs font-semibold text-accent-deep hover:underline" @click="showTable = !showTable">
        {{ showTable ? 'Ocultar' : 'Ver' }} tabla de amortización
      </button>
      <div v-if="loanRows.length" class="max-h-72 overflow-auto rounded-xl bg-white/60 dark:bg-surface-soft/60">
        <table class="w-full text-xs text-right tabular-nums">
          <thead class="sticky top-0 bg-white dark:bg-surface-soft text-black/50 dark:text-muted">
            <tr><th class="p-2 text-left">Mes</th><th class="p-2">Cuota</th><th class="p-2">Interés</th><th class="p-2">Capital</th><th class="p-2">Saldo</th></tr>
          </thead>
          <tbody class="text-black/70 dark:text-ink/85">
            <tr v-for="r in loanRows" :key="r.month" class="border-t border-black/5 dark:border-border">
              <td class="p-2 text-left">{{ r.month }}</td>
              <td class="p-2">{{ money(r.payment) }}</td>
              <td class="p-2">{{ money(r.interest) }}</td>
              <td class="p-2">{{ money(r.capital) }}</td>
              <td class="p-2">{{ money(r.balance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ahorro -->
    <div v-else-if="active === 'ahorro'" class="fin-card flex flex-col gap-3">
      <p class="text-sm text-black/55 dark:text-muted">¿Cuánto tendrás si ahorras cada mes con interés compuesto?</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <label :class="labelCls">Ahorro inicial<input v-model.number="saveInitial" type="number" min="0" step="any" :class="inputCls" /></label>
        <label :class="labelCls">Aporte mensual<input v-model.number="saveMonthly" type="number" min="0" step="any" :class="inputCls" /></label>
        <label :class="labelCls">Interés anual (%)<input v-model.number="saveRate" type="number" min="0" step="any" :class="inputCls" /></label>
        <label :class="labelCls">Años<input v-model.number="saveYears" type="number" min="0" step="any" :class="inputCls" /></label>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Tendrás</p>
          <p class="font-bold text-emerald-600">{{ money(savings.total) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Aportaste</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ money(savings.contributed) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Intereses ganados</p>
          <p class="font-bold text-emerald-600">{{ money(savings.interest) }}</p>
        </div>
      </div>
    </div>

    <!-- Dividir cuenta -->
    <div v-else-if="active === 'dividir'" class="fin-card flex flex-col gap-3">
      <div class="grid grid-cols-3 gap-2">
        <label :class="labelCls">Total de la cuenta<input v-model.number="billTotal" type="number" min="0" step="any" placeholder="0" :class="inputCls" /></label>
        <label :class="labelCls">Personas<input v-model.number="billPeople" type="number" min="1" step="1" :class="inputCls" /></label>
        <label :class="labelCls">Propina (%)<input v-model.number="billTip" type="number" min="0" step="any" :class="inputCls" /></label>
      </div>
      <div class="grid grid-cols-2 gap-2 text-center">
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Total con propina</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ money(billWithTip) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Cada persona paga</p>
          <p class="font-bold text-accent-deep">{{ money(billEach) }}</p>
        </div>
      </div>
    </div>

    <!-- Porcentajes -->
    <div v-else class="fin-card flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-2">
        <label :class="labelCls">Valor<input v-model.number="pctValue" type="number" min="0" step="any" placeholder="0" :class="inputCls" /></label>
        <label :class="labelCls">Porcentaje (%)<input v-model.number="pctRate" type="number" step="any" :class="inputCls" /></label>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">{{ pctRate ?? 0 }}% del valor</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ money(pctOf) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Con descuento</p>
          <p class="font-bold text-emerald-600">{{ money((pctValue ?? 0) - pctOf) }}</p>
        </div>
        <div class="rounded-xl bg-white/70 dark:bg-surface-soft p-2.5">
          <p class="text-[11px] text-black/45 dark:text-muted">Con aumento / IVA</p>
          <p class="font-bold text-rose-500">{{ money((pctValue ?? 0) + pctOf) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
