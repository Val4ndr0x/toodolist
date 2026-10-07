<script setup lang="ts">
import gsap from 'gsap'
import type { Task, TaskMeta, TaskPriority } from '~/composables/useLists'
import type { TaskRecurrence } from '~/utils/taskRecurrence'
import { toDateKey } from '~/utils/calendarDate'
import { requestNotifyPermission } from '~/utils/notify'
import { describeRecurrence, RECURRENCE_LABELS, TASK_WEEKDAYS } from '~/utils/taskRecurrence'

const props = withDefaults(defineProps<{ task: Task; index?: number; draggable?: boolean }>(), { index: 0, draggable: false })
const emit = defineEmits<{
  toggle: [id: string]
  edit: [id: string, text: string]
  updateMeta: [id: string, patch: Partial<TaskMeta>]
  delete: [id: string]
  addSubtask: [id: string, text: string]
  toggleSubtask: [id: string, subtaskId: string]
  deleteSubtask: [id: string, subtaskId: string]
  dragStart: [id: string, event: PointerEvent]
}>()

const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Baja', medium: 'Media', high: 'Alta' }
const PRIORITY_DOT: Record<TaskPriority, string> = { low: 'bg-slate-300', medium: 'bg-amber-300', high: 'bg-rose-400' }

const isEditing = ref(false)
const draft = ref(props.task.text)
const draftPriority = ref<TaskPriority>(props.task.priority)
const draftDueDate = ref(props.task.dueDate ?? '')
const draftRecurrence = ref<TaskRecurrence>(props.task.recurrence)
const draftInterval = ref(props.task.recurrenceInterval)
const draftDays = ref<number[]>([...props.task.recurrenceDays])
const draftRemindAt = ref(props.task.remindAt ?? '')
const draftAssignee = ref(props.task.assignee ?? '')
const { assignees } = useLists()

const showSubtaskInput = ref(false)
const subtaskDraft = ref('')
const subtaskInputRef = ref<HTMLInputElement | null>(null)
const subtasksDone = computed(() => props.task.subtasks.filter((s) => s.done).length)
const recurrenceText = computed(() => describeRecurrence(props.task))

function openSubtaskInput() {
  showSubtaskInput.value = true
  nextTick(() => subtaskInputRef.value?.focus())
}

function submitSubtask() {
  if (!subtaskDraft.value.trim()) {
    showSubtaskInput.value = false
    return
  }
  emit('addSubtask', props.task.id, subtaskDraft.value)
  subtaskDraft.value = ''
}

function toggleDraftDay(day: number) {
  draftDays.value = draftDays.value.includes(day) ? draftDays.value.filter((d) => d !== day) : [...draftDays.value, day].sort()
}
const inputRef = ref<HTMLInputElement | null>(null)
const starRef = ref<HTMLElement | null>(null)
const { burstFromEl } = useConfetti()

const isOverdue = computed(
  () => !!props.task.dueDate && !props.task.completed && props.task.dueDate < toDateKey(new Date()),
)

watch(
  () => props.task.completed,
  (completed) => {
    if (!starRef.value || !completed) return
    burstFromEl(starRef.value)
    gsap.fromTo(
      starRef.value,
      { scale: 1 },
      { scale: 1.6, duration: 0.28, ease: 'back.out(3)', yoyo: true, repeat: 1 },
    )
  },
)

function startEdit() {
  draft.value = props.task.text
  draftPriority.value = props.task.priority
  draftDueDate.value = props.task.dueDate ?? ''
  draftRecurrence.value = props.task.recurrence
  draftInterval.value = props.task.recurrenceInterval
  draftDays.value = [...props.task.recurrenceDays]
  draftRemindAt.value = props.task.remindAt ?? ''
  draftAssignee.value = props.task.assignee ?? ''
  isEditing.value = true
  nextTick(() => inputRef.value?.focus())
}

function commitEdit() {
  if (!isEditing.value) return
  isEditing.value = false
  const trimmed = draft.value.trim()
  if (trimmed && trimmed !== props.task.text) emit('edit', props.task.id, trimmed)

  const nextRemindAt = draftRemindAt.value || null
  // Un recordatorio o una repetición sin fecha empiezan hoy.
  const nextDueDate = draftDueDate.value || (nextRemindAt || draftRecurrence.value ? toDateKey(new Date()) : null)
  const nextAssignee = draftAssignee.value.trim() || null
  const nextInterval = Math.min(365, Math.max(1, Math.round(Number(draftInterval.value) || 2)))
  if (
    draftPriority.value !== props.task.priority ||
    nextDueDate !== props.task.dueDate ||
    draftRecurrence.value !== props.task.recurrence ||
    nextInterval !== props.task.recurrenceInterval ||
    draftDays.value.join() !== props.task.recurrenceDays.join() ||
    nextRemindAt !== props.task.remindAt ||
    nextAssignee !== props.task.assignee
  ) {
    emit('updateMeta', props.task.id, {
      priority: draftPriority.value,
      dueDate: nextDueDate,
      recurrence: draftRecurrence.value,
      recurrenceInterval: nextInterval,
      recurrenceDays: draftRecurrence.value === 'weekdays' && !draftDays.value.length && nextDueDate
        ? [new Date(`${nextDueDate}T00:00:00`).getDay()]
        : draftDays.value,
      remindAt: nextRemindAt,
      assignee: nextAssignee,
    })
  }
  if (nextRemindAt) requestNotifyPermission()
}

function cancelEdit() {
  isEditing.value = false
  draft.value = props.task.text
}
</script>

<template>
  <li class="constellation-item relative flex items-start gap-2.5 list-none" :data-index="index">
    <div class="constellation-node-col flex flex-col items-center shrink-0 pt-3.5">
      <button
        ref="starRef"
        type="button"
        class="star-toggle relative w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300"
        :class="task.completed ? 'star-toggle--lit text-amber-200' : 'text-white/35 hover:text-white/60'"
        :aria-pressed="task.completed"
        aria-label="Marcar como completada"
        @click="emit('toggle', task.id)"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" :fill="task.completed ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
          <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7L2 8.2l7.1-.6L12 2.5z" />
        </svg>
      </button>
    </div>

    <div
      class="constellation-card flex-1 min-w-0 flex flex-col gap-2 rounded-2xl px-4 py-3.5 transition-opacity duration-300"
      :class="task.completed ? 'opacity-55' : ''"
    >
      <div class="flex items-center gap-3">
        <input
          v-if="isEditing"
          ref="inputRef"
          v-model="draft"
          type="text"
          class="flex-1 text-[0.98rem] text-white/85 bg-transparent outline-none border-b border-white/20 focus:border-white/40"
          @keyup.enter="commitEdit"
          @keyup.esc="cancelEdit"
        />
        <span
          v-else
          class="flex-1 text-[0.98rem] break-words cursor-text"
          :class="task.completed ? 'line-through text-white/35' : 'text-white/85'"
          @dblclick="startEdit"
        >
          {{ task.text }}
        </span>

        <button
          v-if="!isEditing && !task.completed"
          type="button"
          class="text-white/30 hover:text-white/60 px-1 py-1 text-sm leading-none"
          aria-label="Agregar subtarea"
          title="Agregar subtarea"
          @click="openSubtaskInput"
        >
          ☰<sup class="text-[9px]">+</sup>
        </button>
        <button
          v-if="!isEditing"
          type="button"
          class="text-white/30 hover:text-white/60 px-1 py-1 text-sm leading-none"
          aria-label="Editar tarea"
          title="Editar tarea"
          @click="startEdit"
        >
          ✎
        </button>
        <button
          v-if="isEditing"
          type="button"
          class="text-xs font-semibold text-accent px-1.5 py-1"
          @click="commitEdit"
        >
          Listo
        </button>

        <button
          type="button"
          class="text-white/30 hover:text-danger px-1.5 py-1 text-lg leading-none"
          aria-label="Eliminar tarea"
          @click="emit('delete', task.id)"
        >
          ✕
        </button>
        <span
          v-if="draggable && !isEditing"
          class="drag-handle text-white/25 hover:text-white/60 px-1 py-1 leading-none select-none"
          title="Arrastra para reordenar"
          aria-hidden="true"
          @pointerdown="emit('dragStart', task.id, $event)"
        >
          ⠿
        </span>
      </div>

      <!-- Subtareas -->
      <ul v-if="task.subtasks.length || showSubtaskInput" class="flex flex-col gap-1 pl-0.5 list-none m-0 p-0">
        <li v-for="st in task.subtasks" :key="st.id" class="group flex items-center gap-2 text-sm">
          <button
            type="button"
            class="w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] transition-colors"
            :class="st.done ? 'bg-amber-200/80 border-amber-200 text-black/70' : 'border-white/30 hover:border-white/60'"
            :aria-pressed="st.done"
            :aria-label="`Marcar subtarea ${st.text}`"
            @click="emit('toggleSubtask', task.id, st.id)"
          >
            <span v-if="st.done">✓</span>
          </button>
          <span class="flex-1 min-w-0 break-words" :class="st.done ? 'line-through text-white/35' : 'text-white/70'">{{ st.text }}</span>
          <button
            type="button"
            class="text-white/0 group-hover:text-white/35 hover:!text-danger focus:text-white/35 px-1 text-xs"
            aria-label="Eliminar subtarea"
            @click="emit('deleteSubtask', task.id, st.id)"
          >
            ✕
          </button>
        </li>
        <li v-if="showSubtaskInput" class="flex items-center gap-2">
          <span class="w-4 h-4 shrink-0 rounded border border-dashed border-white/25" />
          <input
            ref="subtaskInputRef"
            v-model="subtaskDraft"
            type="text"
            maxlength="120"
            placeholder="Nuevo paso… (Enter para agregar)"
            class="flex-1 min-w-0 text-sm bg-transparent text-white/80 placeholder-white/30 outline-none border-b border-white/15 focus:border-white/40"
            @keyup.enter="submitSubtask"
            @keyup.esc="showSubtaskInput = false; subtaskDraft = ''"
            @blur="!subtaskDraft.trim() && (showSubtaskInput = false)"
          />
        </li>
      </ul>

      <!-- Meta: prioridad / fecha límite / recurrencia -->
      <div v-if="!isEditing && (task.dueDate || task.recurrence || task.assignee || task.priority !== 'medium' || task.subtasks.length)" class="flex items-center gap-2 text-xs flex-wrap">
        <span class="flex items-center gap-1 text-white/45">
          <span class="w-2 h-2 rounded-full" :class="PRIORITY_DOT[task.priority]" />
          {{ PRIORITY_LABELS[task.priority] }}
        </span>
        <span v-if="task.dueDate" class="px-2 py-0.5 rounded-full" :class="isOverdue ? 'bg-rose-400/20 text-rose-300 font-medium' : 'bg-surface/80 text-muted'">
          {{ isOverdue ? 'Venció' : 'Vence' }} {{ task.dueDate }}<template v-if="task.remindAt"> · ⏰ {{ task.remindAt }}</template>
        </span>
        <span v-if="task.subtasks.length" class="px-2 py-0.5 rounded-full bg-surface/80 text-muted">
          ☰ {{ subtasksDone }}/{{ task.subtasks.length }}
        </span>
        <span v-if="task.assignee" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent-soft">
          <AppIcon name="user" :size="11" /> {{ task.assignee }}
        </span>
        <span v-if="task.recurrence" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface/80 text-muted">
          ↻ {{ recurrenceText }}
        </span>
      </div>

      <div v-if="isEditing" class="flex items-center gap-2.5 flex-wrap text-xs">
        <select v-model="draftPriority" class="bg-surface rounded-full px-2.5 py-1.5 outline-none text-ink border border-border">
          <option v-for="(label, value) in PRIORITY_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
        <input
          v-model="draftDueDate"
          type="date"
          class="bg-surface rounded-full px-2.5 py-1.5 outline-none text-ink border border-border"
        />
        <label class="flex items-center gap-1 bg-surface rounded-full pl-2.5 pr-1 py-0.5 text-muted border border-border" title="Hora del recordatorio">
          ⏰
          <input v-model="draftRemindAt" type="time" class="bg-transparent outline-none text-ink py-1" />
        </label>
        <select v-model="draftRecurrence" class="bg-surface rounded-full px-2.5 py-1.5 outline-none text-ink border border-border">
          <option :value="null">Sin repetir</option>
          <option v-for="(label, value) in RECURRENCE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
        <label v-if="draftRecurrence === 'interval'" class="flex items-center gap-1.5 text-white/60">
          cada
          <input v-model.number="draftInterval" type="number" min="1" max="365" class="w-14 bg-surface rounded-full px-2.5 py-1.5 outline-none text-ink border border-border" />
          días
        </label>
        <div v-if="draftRecurrence === 'weekdays'" class="flex gap-1">
          <button
            v-for="w in TASK_WEEKDAYS"
            :key="w.day"
            type="button"
            class="w-7 h-7 rounded-full text-[11px] font-semibold border transition-colors"
            :class="draftDays.includes(w.day) ? 'bg-accent text-white border-accent' : 'bg-surface text-muted border-border'"
            :title="w.name"
            @click="toggleDraftDay(w.day)"
          >
            {{ w.short }}
          </button>
        </div>
        <input
          v-model="draftAssignee"
          type="text"
          list="task-assignee-options-edit"
          placeholder="Responsable"
          maxlength="40"
          class="bg-surface rounded-full px-3 py-1.5 outline-none text-ink placeholder-muted border border-border w-36"
        />
        <datalist id="task-assignee-options-edit">
          <option v-for="a in assignees" :key="a" :value="a" />
        </datalist>
      </div>
    </div>
  </li>
</template>

<style scoped>
.constellation-node-col {
  width: 28px;
}

.drag-handle {
  cursor: grab;
  touch-action: none;
}

.star-toggle--lit {
  filter: drop-shadow(0 0 6px rgba(255, 214, 130, 0.85)) drop-shadow(0 0 14px rgba(255, 214, 130, 0.45));
}

.constellation-card {
  background: rgba(8, 9, 24, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
</style>
