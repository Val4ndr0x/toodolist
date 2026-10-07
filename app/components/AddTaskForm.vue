<script setup lang="ts">
import type { TaskMeta } from '~/composables/useLists'
import { hasQuickAddMeta, parseQuickAdd } from '~/utils/quickAdd'
import { requestNotifyPermission } from '~/utils/notify'
import { describeRecurrence } from '~/utils/taskRecurrence'

const emit = defineEmits<{ add: [text: string, assignee: string | null, meta: Partial<TaskMeta>] }>()

const { assignees } = useLists()

const text = ref('')
const assignee = ref('')
const showAssignee = ref(false)
const showHelp = ref(false)

const PRIORITY_CHIP = { high: '🔴 Alta', medium: '🟡 Media', low: '⚪ Baja' } as const

const parsed = computed(() => parseQuickAdd(text.value))
const hasMeta = computed(() => !!text.value.trim() && hasQuickAddMeta(parsed.value))

function formatDate(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function submit() {
  if (!text.value.trim()) return
  const p = parsed.value
  const meta: Partial<TaskMeta> = {}
  if (p.dueDate) meta.dueDate = p.dueDate
  if (p.priority) meta.priority = p.priority
  if (p.recurrence) {
    meta.recurrence = p.recurrence
    meta.recurrenceInterval = p.recurrenceInterval
    meta.recurrenceDays = p.recurrenceDays
  }
  if (p.remindAt) {
    meta.remindAt = p.remindAt
    requestNotifyPermission()
  }
  // El campo de responsable explícito manda sobre el @nombre escrito en el texto.
  emit('add', p.text, assignee.value.trim() || p.assignee, meta)
  text.value = ''
  assignee.value = ''
}
</script>

<template>
  <form class="relative z-10 flex flex-wrap gap-2 my-4" @submit.prevent="submit">
    <input
      v-model="text"
      type="text"
      placeholder="Agregar una tarea… (p. ej. «pagar luz mañana 6pm !alta»)"
      autocomplete="off"
      class="flex-1 min-w-0 px-4 py-3.5 rounded-2xl border border-border bg-surface/90 backdrop-blur-sm text-ink placeholder-muted text-base outline-none focus:border-accent transition-colors"
    />
    <button
      type="button"
      class="px-3.5 rounded-2xl border border-border bg-surface/90 backdrop-blur-sm transition-colors"
      :class="showAssignee || assignee ? 'text-accent border-accent' : 'text-muted hover:text-ink'"
      title="Asignar un responsable (opcional)"
      aria-label="Asignar un responsable"
      @click="showAssignee = !showAssignee"
    >
      <AppIcon name="user" :size="18" />
    </button>
    <button
      type="submit"
      class="add-star-btn px-5 rounded-2xl bg-[#f4a8c4] text-white text-xl font-semibold active:scale-95 hover:bg-[#ef8fb5] transition-all"
      aria-label="Agregar tarea"
    >
      +
    </button>
    <div v-if="hasMeta" class="basis-full flex flex-wrap items-center gap-1.5 px-1 text-xs">
      <span class="text-white/45">Se guardará como:</span>
      <span class="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">{{ parsed.text }}</span>
      <span v-if="parsed.dueDate" class="px-2 py-0.5 rounded-full bg-sky-300/20 text-sky-200">📅 {{ formatDate(parsed.dueDate) }}</span>
      <span v-if="parsed.remindAt" class="px-2 py-0.5 rounded-full bg-amber-300/20 text-amber-200">⏰ {{ parsed.remindAt }}</span>
      <span v-if="parsed.recurrence" class="px-2 py-0.5 rounded-full bg-violet-300/20 text-violet-200">↻ {{ describeRecurrence(parsed) }}</span>
      <span v-if="parsed.priority" class="px-2 py-0.5 rounded-full bg-rose-300/20 text-rose-200">{{ PRIORITY_CHIP[parsed.priority] }}</span>
      <span v-if="parsed.assignee && !assignee.trim()" class="px-2 py-0.5 rounded-full bg-accent/25 text-accent-soft">👤 {{ parsed.assignee }}</span>
    </div>
    <div v-else class="basis-full px-1 -mt-0.5">
      <button type="button" class="text-[11px] text-white/35 hover:text-white/60 underline-offset-2 hover:underline" @click="showHelp = !showHelp">
        {{ showHelp ? 'Ocultar ayuda' : '¿Cómo escribir fechas, horas y repeticiones?' }}
      </button>
      <ul v-if="showHelp" class="mt-1.5 grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-white/55 list-none p-0">
        <li><b class="text-white/75">Fecha:</b> hoy, mañana, pasado mañana, el viernes, en 3 días, 15/03</li>
        <li><b class="text-white/75">Hora (recordatorio):</b> a las 6pm, 18:30</li>
        <li><b class="text-white/75">Repetir:</b> cada día, cada semana, cada mes, cada 3 días</li>
        <li><b class="text-white/75">Días:</b> cada lunes y jueves, entre semana, los fines de semana</li>
        <li><b class="text-white/75">Prioridad:</b> !alta, !media, !baja (o !!!)</li>
        <li><b class="text-white/75">Responsable:</b> @Ana, @Juan_Pérez</li>
      </ul>
    </div>
    <div v-if="showAssignee || assignee" class="basis-full">
      <input
        v-model="assignee"
        type="text"
        list="task-assignee-options"
        placeholder="Responsable de completarla (opcional)"
        maxlength="40"
        autocomplete="off"
        class="w-full px-4 py-2.5 rounded-2xl border border-border bg-surface/90 backdrop-blur-sm text-ink placeholder-muted text-sm outline-none focus:border-accent transition-colors"
      />
      <datalist id="task-assignee-options">
        <option v-for="a in assignees" :key="a" :value="a" />
      </datalist>
    </div>
  </form>
</template>

<style scoped>
.add-star-btn {
  box-shadow: 0 0 0 rgba(244, 168, 196, 0.6);
}

.add-star-btn:hover {
  box-shadow: 0 0 16px rgba(244, 168, 196, 0.6);
}
</style>
