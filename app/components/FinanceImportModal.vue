<script setup lang="ts">
import type { TransactionInput } from '~/composables/useFinance'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, money } from '~/composables/useFinance'
import { detectDateFormat, findColumn, guessCategory, parseAmount, parseCsv, parseDate, type DateFormat } from '~/utils/csvImport'

const emit = defineEmits<{ close: []; imported: [month: string] }>()

const { importTransactions } = useFinance()

const fileName = ref('')
const rows = ref<string[][]>([])
const hasHeader = ref(true)
const dateCol = ref(-1)
const descCol = ref(-1)
/** 'signed': una columna con signo. 'split': columnas separadas de débito y crédito. */
const amountMode = ref<'signed' | 'split'>('signed')
const amountCol = ref(-1)
const debitCol = ref(-1)
const creditCol = ref(-1)
/** Algunos bancos exportan los gastos en positivo: esto invierte el signo. */
const invertSign = ref(false)
const dateFormat = ref<DateFormat>('auto')
const error = ref('')
const result = ref<{ added: number; skipped: number } | null>(null)
/** Índices (en `parsed`) que el usuario desmarcó. */
const excluded = ref(new Set<number>())
/** Categoría elegida a mano por fila. */
const overrides = ref(new Map<number, string>())

const headers = computed(() => {
  const first = rows.value[0] ?? []
  return hasHeader.value ? first.map((h, i) => h || `Columna ${i + 1}`) : first.map((_, i) => `Columna ${i + 1}`)
})
const body = computed(() => (hasHeader.value ? rows.value.slice(1) : rows.value))

function autoDetect() {
  const h = rows.value[0] ?? []
  dateCol.value = Math.max(0, findColumn(h, /fecha|date|dia/))
  descCol.value = findColumn(h, /descrip|concepto|detalle|referencia|movimiento|description|memo|nombre/)
  const debit = findColumn(h, /debito|cargo|retiro|egreso|salida|debit|withdraw/)
  const credit = findColumn(h, /credito|abono|deposito|ingreso|entrada|credit|deposit/)
  const amount = findColumn(h, /valor|monto|importe|amount|cantidad/)
  if (debit >= 0 && credit >= 0) {
    amountMode.value = 'split'
    debitCol.value = debit
    creditCol.value = credit
  } else {
    amountMode.value = 'signed'
    amountCol.value = amount >= 0 ? amount : h.length - 1
  }
  if (descCol.value < 0) descCol.value = h.findIndex((_, i) => i !== dateCol.value && i !== amountCol.value)
  const values = body.value.map((r) => r[dateCol.value] ?? '').filter(Boolean).slice(0, 50)
  dateFormat.value = detectDateFormat(values)
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  result.value = null
  excluded.value = new Set()
  overrides.value = new Map()
  fileName.value = file.name
  try {
    let text = await file.text()
    // Extractos en Latin-1 (muy comunes) se ven con "�": se vuelve a leer con esa codificación.
    if (text.includes('�')) text = new TextDecoder('windows-1252').decode(await file.arrayBuffer())
    rows.value = parseCsv(text)
    if (rows.value.length < 1) throw new Error('vacío')
    // Si la primera fila ya trae una fecha, es un movimiento y no títulos.
    hasHeader.value = !rows.value[0]!.some((c) => parseDate(c) !== null)
    autoDetect()
  } catch {
    rows.value = []
    error.value = 'No se pudo leer el archivo. Debe ser un .csv exportado de tu banco.'
  }
}

type Parsed = { input: TransactionInput; ok: true } | { ok: false; reason: string; raw: string[] }

const parsed = computed<Parsed[]>(() =>
  body.value.map((r) => {
    const date = parseDate(r[dateCol.value] ?? '', dateFormat.value)
    let amount: number | null
    if (amountMode.value === 'split') {
      const debit = Math.abs(parseAmount(r[debitCol.value] ?? '') ?? 0)
      const credit = Math.abs(parseAmount(r[creditCol.value] ?? '') ?? 0)
      amount = credit - debit || null
    } else {
      amount = parseAmount(r[amountCol.value] ?? '')
      if (amount !== null && invertSign.value) amount = -amount
    }
    if (!date) return { ok: false, reason: 'fecha', raw: r }
    if (!amount) return { ok: false, reason: 'monto', raw: r }
    const type = amount < 0 ? 'gasto' : 'ingreso'
    const note = (r[descCol.value] ?? '').replace(/\s+/g, ' ').slice(0, 120)
    return { ok: true, input: { type, amount: Math.abs(amount), category: guessCategory(note, type), note, date, method: null } }
  }),
)

const valid = computed(() => parsed.value.flatMap((p, i) => (p.ok ? [{ i, input: { ...p.input, category: overrides.value.get(i) ?? p.input.category } }] : [])))
const invalidCount = computed(() => parsed.value.length - valid.value.length)
const selected = computed(() => valid.value.filter((v) => !excluded.value.has(v.i)))
const totals = computed(() =>
  selected.value.reduce(
    (acc, v) => (v.input.type === 'gasto' ? { ...acc, expense: acc.expense + v.input.amount } : { ...acc, income: acc.income + v.input.amount }),
    { expense: 0, income: 0 },
  ),
)

function toggleRow(i: number) {
  const next = new Set(excluded.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  excluded.value = next
}

function setCategory(i: number, category: string) {
  overrides.value = new Map(overrides.value).set(i, category)
}

function runImport() {
  if (!selected.value.length) return
  result.value = importTransactions(selected.value.map((v) => v.input))
  const latest = selected.value.reduce((max, v) => (v.input.date > max ? v.input.date : max), '')
  if (result.value.added && latest) emit('imported', latest.slice(0, 7))
}

const selectCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink rounded-xl px-2.5 py-2 text-sm outline-none border border-black/10 dark:border-border'
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <div class="w-full sm:max-w-2xl bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-black/80 dark:text-ink">Importar extracto (CSV) 🏦</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <template v-if="result">
        <div class="fin-card text-center py-6">
          <p class="text-3xl mb-2">🎉</p>
          <p class="font-bold text-black/80 dark:text-ink">{{ result.added }} movimiento{{ result.added === 1 ? '' : 's' }} importado{{ result.added === 1 ? '' : 's' }}</p>
          <p v-if="result.skipped" class="text-sm text-black/50 dark:text-muted mt-1">{{ result.skipped }} se omitieron porque ya estaban registrados.</p>
        </div>
        <button type="button" class="py-2.5 rounded-2xl bg-[#f4a8c4] text-white font-semibold" @click="emit('close')">Listo</button>
      </template>

      <template v-else>
        <label class="flex flex-col items-center gap-2 py-6 rounded-[20px] bg-white/75 dark:bg-surface-soft cursor-pointer border-2 border-dashed border-black/10 dark:border-border text-center">
          <span class="text-2xl">📄</span>
          <span class="text-sm font-semibold text-black/70 dark:text-ink">{{ fileName || 'Elige el archivo .csv de tu banco' }}</span>
          <span class="text-xs text-black/45 dark:text-muted">Los datos no salen de tu dispositivo.</span>
          <input type="file" accept=".csv,text/csv,text/plain" class="sr-only" @change="onFile" />
        </label>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <template v-if="rows.length">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium text-black/55 dark:text-muted">
            <label class="flex flex-col gap-1">
              Fecha
              <select v-model="dateCol" :class="selectCls"><option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option></select>
            </label>
            <label class="flex flex-col gap-1">
              Descripción
              <select v-model="descCol" :class="selectCls"><option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option></select>
            </label>
            <label class="flex flex-col gap-1">
              Formato de fecha
              <select v-model="dateFormat" :class="selectCls">
                <option value="auto">Automático</option>
                <option value="dmy">día/mes/año</option>
                <option value="mdy">mes/día/año</option>
                <option value="ymd">año-mes-día</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              Montos
              <select v-model="amountMode" :class="selectCls">
                <option value="signed">Una columna (− gasto, + ingreso)</option>
                <option value="split">Débito y crédito separados</option>
              </select>
            </label>
            <template v-if="amountMode === 'signed'">
              <label class="flex flex-col gap-1">
                Columna del monto
                <select v-model="amountCol" :class="selectCls"><option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option></select>
              </label>
              <label class="flex items-center gap-2 pt-5">
                <input v-model="invertSign" type="checkbox" class="accent-[#f4a8c4]" /> Los gastos vienen en positivo
              </label>
            </template>
            <template v-else>
              <label class="flex flex-col gap-1">
                Débito (gastos)
                <select v-model="debitCol" :class="selectCls"><option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option></select>
              </label>
              <label class="flex flex-col gap-1">
                Crédito (ingresos)
                <select v-model="creditCol" :class="selectCls"><option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option></select>
              </label>
            </template>
            <label class="flex items-center gap-2 col-span-2 sm:col-span-3">
              <input v-model="hasHeader" type="checkbox" class="accent-[#f4a8c4]" /> La primera fila son títulos
            </label>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/55 dark:text-muted">
            <span>{{ selected.length }} de {{ valid.length }} seleccionados</span>
            <span class="text-rose-500">− {{ money(totals.expense) }}</span>
            <span class="text-emerald-600">+ {{ money(totals.income) }}</span>
            <span v-if="invalidCount" class="text-amber-600 dark:text-amber-300">{{ invalidCount }} fila{{ invalidCount === 1 ? '' : 's' }} sin fecha o monto válidos (se ignoran)</span>
          </div>

          <div class="fin-card !p-1 max-h-72 overflow-y-auto">
            <div v-for="v in valid" :key="v.i" class="flex items-center gap-2 px-2 py-1.5 text-sm" :class="excluded.has(v.i) ? 'opacity-40' : ''">
              <input type="checkbox" class="accent-[#f4a8c4] shrink-0" :checked="!excluded.has(v.i)" @change="toggleRow(v.i)" />
              <span class="text-xs text-black/45 dark:text-muted tabular-nums shrink-0 w-[4.5rem]">{{ v.input.date }}</span>
              <span class="flex-1 min-w-0 truncate text-black/75 dark:text-ink">{{ v.input.note || '—' }}</span>
              <select
                :value="v.input.category"
                class="text-xs bg-transparent text-black/60 dark:text-muted outline-none max-w-[7.5rem]"
                @change="setCategory(v.i, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="(emoji, name) in (v.input.type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)" :key="name" :value="name">{{ emoji }} {{ name }}</option>
              </select>
              <span class="font-semibold tabular-nums shrink-0" :class="v.input.type === 'gasto' ? 'text-rose-500' : 'text-emerald-600'">
                {{ v.input.type === 'gasto' ? '−' : '+' }}{{ money(v.input.amount) }}
              </span>
            </div>
            <p v-if="!valid.length" class="text-sm text-center text-black/45 dark:text-muted py-6">
              Ninguna fila tiene fecha y monto válidos. Revisa qué columna es cada cosa.
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <button type="button" class="px-4 py-2 rounded-lg text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink" @click="emit('close')">Cancelar</button>
            <button type="button" class="px-4 py-2 rounded-lg bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] disabled:opacity-50" :disabled="!selected.length" @click="runImport">
              Importar {{ selected.length }}
            </button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
