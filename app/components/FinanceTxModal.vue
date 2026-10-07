<script setup lang="ts">
import type { PaymentMethod } from '~/composables/useClients'
import { PAYMENT_METHODS } from '~/composables/useClients'
import type { Transaction, TransactionInput, TxType } from '~/composables/useFinance'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, todayISO } from '~/composables/useFinance'

const props = defineProps<{ tx?: Transaction | null; defaultType?: TxType }>()
const emit = defineEmits<{ close: []; save: [input: TransactionInput]; delete: [id: string] }>()

const { usedCategories } = useFinance()

const type = ref<TxType>(props.tx?.type ?? props.defaultType ?? 'gasto')
const amount = ref<number | null>(props.tx?.amount ?? null)
const category = ref(props.tx?.category ?? '')
const note = ref(props.tx?.note ?? '')
const date = ref(props.tx?.date ?? todayISO())
const method = ref<PaymentMethod | null>(props.tx?.method ?? null)

const presets = computed(() => (type.value === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES))
const extraCategories = computed(() => usedCategories.value.filter((c) => !(c in presets.value)))

const inputCls =
  'bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3.5 py-2.5 outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'

function submit() {
  if (!amount.value || amount.value <= 0) return
  emit('save', {
    type: type.value,
    amount: Number(amount.value),
    category: category.value || 'Otros',
    note: note.value,
    date: date.value,
    method: method.value,
  })
}

function onDelete() {
  if (props.tx && confirm('¿Eliminar este movimiento?')) emit('delete', props.tx.id)
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <form
      class="w-full sm:max-w-md bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-4 max-h-[88vh] overflow-y-auto"
      @submit.prevent="submit"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-black/80 dark:text-ink">{{ tx ? 'Editar movimiento' : 'Nuevo movimiento' }} 💸</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-1.5 bg-black/5 dark:bg-surface-soft rounded-full p-1">
        <button
          v-for="t in (['gasto', 'ingreso'] as const)"
          :key="t"
          type="button"
          class="py-1.5 rounded-full text-sm font-semibold transition-colors"
          :class="type === t
            ? (t === 'gasto' ? 'bg-rose-400 text-white shadow-sm' : 'bg-emerald-500 text-white shadow-sm')
            : 'text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
          @click="type = t; category = ''"
        >
          {{ t === 'gasto' ? '− Gasto' : '+ Ingreso' }}
        </button>
      </div>

      <label class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
        Monto
        <input v-model.number="amount" type="number" min="0" step="any" placeholder="0" autofocus :class="[inputCls, 'text-lg font-bold']" />
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-black/60 dark:text-muted">Categoría</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(emoji, name) in presets"
            :key="name"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            :class="category === name ? 'bg-[#f4a8c4] text-white shadow-sm' : 'bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
            @click="category = name"
          >
            {{ emoji }} {{ name }}
          </button>
        </div>
        <input v-model="category" type="text" list="finance-categories" maxlength="40" placeholder="…o escribe otra categoría" :class="inputCls" />
        <datalist id="finance-categories">
          <option v-for="c in extraCategories" :key="c" :value="c" />
        </datalist>
      </div>

      <label class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
        Fecha
        <input v-model="date" type="date" :class="inputCls" />
      </label>

      <label class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
        Nota (opcional)
        <input v-model="note" type="text" maxlength="120" placeholder="p. ej. Mercado de la semana" :class="inputCls" />
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-black/60 dark:text-muted">Método (opcional)</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(m, key) in PAYMENT_METHODS"
            :key="key"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            :class="method === key ? 'bg-[#f4a8c4] text-white shadow-sm' : 'bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
            @click="method = method === key ? null : key"
          >
            {{ m.emoji }} {{ m.label }}
          </button>
        </div>
      </div>

      <div class="flex gap-2 items-center mt-1">
        <button v-if="tx" type="button" class="px-3 py-2 rounded-lg text-danger text-sm hover:bg-black/5 dark:hover:bg-surface-soft" @click="onDelete">
          Eliminar
        </button>
        <span class="flex-1" />
        <button type="button" class="px-4 py-2 rounded-lg text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] transition-colors">
          {{ tx ? 'Guardar' : 'Agregar' }}
        </button>
      </div>
    </form>
  </div>
</template>
