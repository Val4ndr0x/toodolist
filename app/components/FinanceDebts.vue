<script setup lang="ts">
import type { DebtKind } from '~/composables/useFinance'
import { money, todayISO } from '~/composables/useFinance'
import { amountDue } from '~/composables/useClients'

const { debts, addDebt, payDebt, deleteDebt } = useFinance()
const { clients } = useClients()

const KIND_LABELS: Record<DebtKind, string> = { debo: 'Yo debo', me_deben: 'Me deben' }

const totals = computed(() => {
  let owe = 0
  let owed = 0
  for (const d of debts.value) {
    const left = d.amount - d.paid
    if (d.kind === 'debo') owe += left
    else owed += left
  }
  return { owe, owed }
})

// Lo que los clientes aún deben de sus pedidos (sección Clientes).
const clientsDue = computed(() => clients.value.reduce((s, c) => s + amountDue(c), 0))

const sorted = computed(() =>
  [...debts.value].sort((a, b) => Number(a.paid >= a.amount) - Number(b.paid >= b.amount) || (a.dueDate || '9').localeCompare(b.dueDate || '9')),
)

const kind = ref<DebtKind>('debo')
const person = ref('')
const amount = ref<number | null>(null)
const dueDate = ref('')
const note = ref('')

function add() {
  if (!person.value.trim() || !amount.value || amount.value <= 0) return
  addDebt({ kind: kind.value, person: person.value, amount: Number(amount.value), dueDate: dueDate.value, note: note.value })
  person.value = ''
  amount.value = null
  dueDate.value = ''
  note.value = ''
}

function pay(id: string) {
  const value = prompt('¿Cuánto se abonó?')
  if (!value) return
  const n = Number(value.replace(/[^\d.]/g, ''))
  if (n > 0) payDebt(id, n)
}

function remove(id: string, who: string) {
  if (confirm(`¿Eliminar la deuda con ${who}?`)) deleteDebt(id)
}

function isOverdue(d: { dueDate: string; paid: number; amount: number }) {
  return !!d.dueDate && d.dueDate < todayISO() && d.paid < d.amount
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="fin-card">
        <p class="text-xs text-black/50 dark:text-muted">Yo debo</p>
        <p class="text-lg font-bold text-rose-500">{{ money(totals.owe) }}</p>
      </div>
      <div class="fin-card">
        <p class="text-xs text-black/50 dark:text-muted">Me deben</p>
        <p class="text-lg font-bold text-emerald-600">{{ money(totals.owed) }}</p>
      </div>
      <NuxtLink to="/clientes" class="fin-card col-span-2 sm:col-span-1 hover:-translate-y-0.5 transition-transform">
        <p class="text-xs text-black/50 dark:text-muted">Por cobrar a clientes 🎀</p>
        <p class="text-lg font-bold text-amber-600">{{ money(clientsDue) }}</p>
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-2">
      <div v-for="d in sorted" :key="d.id" class="fin-card flex flex-col gap-2" :class="{ 'opacity-60': d.paid >= d.amount }">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" :class="d.kind === 'debo' ? 'bg-rose-500/85' : 'bg-emerald-600/85'">
            {{ KIND_LABELS[d.kind] }}
          </span>
          <span class="font-semibold text-black/75 dark:text-ink truncate flex-1">{{ d.person }}</span>
          <span v-if="isOverdue(d)" class="text-[10px] font-bold text-rose-500">VENCIDA</span>
          <button type="button" class="w-7 h-7 rounded-full flex items-center justify-center text-black/35 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" title="Eliminar" @click="remove(d.id, d.person)">
            <AppIcon name="trash" :size="15" />
          </button>
        </div>
        <p v-if="d.note" class="text-xs text-black/55 dark:text-muted">{{ d.note }}</p>
        <div class="h-2 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${(d.paid / d.amount) * 100}%` }" />
        </div>
        <div class="flex items-center justify-between gap-2 text-xs text-black/55 dark:text-muted">
          <span>
            <template v-if="d.paid >= d.amount">✓ Saldada · {{ money(d.amount) }}</template>
            <template v-else>Pagado {{ money(d.paid) }} de {{ money(d.amount) }} · falta {{ money(d.amount - d.paid) }}</template>
            <span v-if="d.dueDate"> · vence {{ d.dueDate }}</span>
          </span>
          <button v-if="d.paid < d.amount" type="button" class="shrink-0 px-3 py-1 rounded-full bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5]" @click="pay(d.id)">
            Abonar
          </button>
        </div>
      </div>
    </div>

    <p v-if="!debts.length" class="text-sm text-black/50 dark:text-muted text-center py-2">Sin deudas registradas. ✨</p>

    <form class="fin-card flex flex-col gap-2" @submit.prevent="add">
      <div class="grid grid-cols-2 gap-1.5 bg-black/5 dark:bg-surface-soft rounded-full p-1">
        <button
          v-for="(label, key) in KIND_LABELS"
          :key="key"
          type="button"
          class="py-1.5 rounded-full text-xs font-semibold transition-colors"
          :class="kind === key ? 'bg-[#f4a8c4] text-white shadow-sm' : 'text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
          @click="kind = key"
        >
          {{ label }}
        </button>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model="person" type="text" maxlength="40" :placeholder="kind === 'debo' ? '¿A quién le debes?' : '¿Quién te debe?'" :class="[inputCls, 'flex-1']" />
        <input v-model.number="amount" type="number" min="0" step="any" placeholder="Monto" :class="[inputCls, 'sm:w-32']" />
        <input v-model="dueDate" type="date" title="Fecha límite (opcional)" :class="[inputCls, 'sm:w-40']" />
      </div>
      <input v-model="note" type="text" maxlength="120" placeholder="Nota (opcional)" :class="inputCls" />
      <button type="submit" class="self-end px-4 py-2 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5] transition-colors">
        Registrar
      </button>
    </form>
  </div>
</template>
