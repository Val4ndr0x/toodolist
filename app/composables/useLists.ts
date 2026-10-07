import { combineDateTime, toDateKey } from '~/utils/calendarDate'
import { nextDueDate, sanitizeDays, sanitizeInterval, TASK_RECURRENCES, type TaskRecurrence } from '~/utils/taskRecurrence'
import { notify } from '~/utils/notify'

export type TaskPriority = 'low' | 'medium' | 'high'
/** Estado del pedido en la cafetería: 'new' = recién llegado, 'preparing' = aprobado. */
export type OrderStatus = 'new' | 'preparing'

export type Subtask = { id: string; text: string; done: boolean }

export type Task = {
  id: string
  text: string
  completed: boolean
  createdAt: number
  priority: TaskPriority
  /** 'YYYY-MM-DD', o null si no tiene fecha límite. */
  dueDate: string | null
  recurrence: TaskRecurrence
  /** Días entre repeticiones cuando recurrence es 'interval'. */
  recurrenceInterval: number
  /** Días de la semana (0 = domingo) cuando recurrence es 'weekdays'. */
  recurrenceDays: number[]
  /** Hora 'HH:mm' del recordatorio el día de la fecha límite, o null. */
  remindAt: string | null
  /** Fecha límite para la que ya sonó el recordatorio (para no repetirlo). */
  remindedFor: string | null
  subtasks: Subtask[]
  /** Persona (p. ej. un cliente) a quien le toca completar la tarea; opcional. */
  assignee: string | null
  completedAt: number | null
  /** Evita clonar dos veces la siguiente ocurrencia si se destoggle/completa de nuevo. */
  recurrenceSpawned: boolean
  orderStatus: OrderStatus
}

export type TaskMeta = Pick<Task, 'priority' | 'dueDate' | 'recurrence' | 'recurrenceInterval' | 'recurrenceDays' | 'assignee' | 'remindAt'>

/** Tarea pendiente cuyo recordatorio acaba de sonar (para el aviso dentro de la app). */
export type DueReminder = { listId: string; taskId: string; text: string; listName: string; time: string }

export type TodoList = {
  id: string
  name: string
  category: string | null
  color: string
  sticker: string | null
  /** Clave de fuente (ver app/utils/fonts.ts) para el nombre y las tareas de la lista. */
  font?: string
  createdAt: number
  tasks: Task[]
}

export const CARD_COLORS = ['#f3d9df', '#f4e8cf', '#dbe9dd', '#dbe3f2', '#e8dbf2', '#f2dbe8']

const STORAGE_KEY = 'todo-lists-v1'

const lists = ref<TodoList[]>([])
const dueReminders = ref<DueReminder[]>([])
let loaded = false

function baseTask(text: string, now: number): Task {
  return {
    id: uuid(),
    text,
    completed: false,
    createdAt: now,
    priority: 'medium',
    dueDate: null,
    recurrence: null,
    recurrenceInterval: 2,
    recurrenceDays: [],
    remindAt: null,
    remindedFor: null,
    subtasks: [],
    assignee: null,
    completedAt: null,
    recurrenceSpawned: false,
    orderStatus: 'new',
  }
}

const isTime = (v: unknown): v is string => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)

function seedTask(text: string, completed: boolean, now: number): Task {
  return { ...baseTask(text, now), completed, completedAt: completed ? now : null }
}

function seedDefault(): TodoList[] {
  const now = Date.now()
  return [
    {
      id: uuid(),
      name: 'Compras semanales',
      category: null,
      color: CARD_COLORS[0],
      sticker: null,
      createdAt: now,
      tasks: [
        seedTask('Comprar leche y pan', false, now),
        seedTask('Frutas y verduras', true, now),
      ],
    },
    {
      id: uuid(),
      name: 'Proyecto Nuxt',
      category: 'Work',
      color: CARD_COLORS[3],
      sticker: null,
      createdAt: now,
      tasks: [
        seedTask('Configurar Tailwind', true, now),
        seedTask('Diseñar pantalla principal', false, now),
        seedTask('Conectar con backend', false, now),
      ],
    },
  ]
}

function sanitize(raw: unknown): TodoList[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((l): l is Record<string, any> => !!l && typeof l === 'object' && typeof l.id === 'string')
    .map((l) => ({
      id: l.id,
      name: typeof l.name === 'string' ? l.name : 'Sin título',
      category: typeof l.category === 'string' ? l.category : null,
      color: typeof l.color === 'string' ? l.color : CARD_COLORS[0],
      sticker: typeof l.sticker === 'string' ? l.sticker : null,
      font: typeof l.font === 'string' ? l.font : undefined,
      createdAt: typeof l.createdAt === 'number' ? l.createdAt : Date.now(),
      tasks: Array.isArray(l.tasks)
        ? l.tasks
            .filter((t: any) => !!t && typeof t === 'object' && typeof t.id === 'string')
            .map((t: any) => ({
              id: t.id,
              text: typeof t.text === 'string' ? t.text : '',
              completed: !!t.completed,
              createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
              priority: (['low', 'medium', 'high'] as const).includes(t.priority) ? t.priority : 'medium',
              dueDate: typeof t.dueDate === 'string' ? t.dueDate : null,
              recurrence: (TASK_RECURRENCES as readonly string[]).includes(t.recurrence) ? t.recurrence : null,
              recurrenceInterval: sanitizeInterval(t.recurrenceInterval),
              recurrenceDays: sanitizeDays(t.recurrenceDays),
              remindAt: isTime(t.remindAt) ? t.remindAt : null,
              remindedFor: typeof t.remindedFor === 'string' ? t.remindedFor : null,
              subtasks: Array.isArray(t.subtasks)
                ? t.subtasks
                    .filter((st: any) => st && typeof st.id === 'string' && typeof st.text === 'string')
                    .map((st: any) => ({ id: st.id, text: st.text, done: !!st.done }))
                : [],
              assignee: typeof t.assignee === 'string' && t.assignee.trim() ? t.assignee.trim() : null,
              completedAt: typeof t.completedAt === 'number' ? t.completedAt : null,
              recurrenceSpawned: !!t.recurrenceSpawned,
              orderStatus: t.orderStatus === 'preparing' ? 'preparing' : 'new',
            }))
        : [],
    }))
}

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    lists.value = raw ? sanitize(JSON.parse(raw)) : seedDefault()
  } catch {
    lists.value = seedDefault()
  }
  if (!lists.value.length) lists.value = seedDefault()
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists.value))
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

export function useLists() {
  load()

  const categories = computed(() => {
    const set = new Set<string>()
    for (const l of lists.value) if (l.category) set.add(l.category)
    return Array.from(set)
  })

  /** Responsables ya usados en tareas, para sugerirlos sin mezclarlos con la lista de clientes. */
  const assignees = computed(() => {
    const set = new Set<string>()
    for (const l of lists.value) for (const t of l.tasks) if (t.assignee) set.add(t.assignee)
    return Array.from(set)
  })

  function nextColor() {
    return CARD_COLORS[lists.value.length % CARD_COLORS.length]
  }

  function addList(name: string, category: string | null = null) {
    const trimmed = name.trim()
    if (!trimmed) return
    const list: TodoList = {
      id: uuid(),
      name: trimmed,
      category: category?.trim() || null,
      color: nextColor(),
      sticker: null,
      createdAt: Date.now(),
      tasks: [],
    }
    lists.value.unshift(list)
    persist()
    return list.id
  }

  function setListSticker(id: string, sticker: string | null) {
    const list = lists.value.find((l) => l.id === id)
    if (!list) return
    list.sticker = sticker
    persist()
  }

  function setListFont(id: string, font: string) {
    const list = lists.value.find((l) => l.id === id)
    if (!list) return
    list.font = font
    persist()
  }

  function editList(id: string, input: { name: string; category: string | null; color: string }) {
    const list = lists.value.find((l) => l.id === id)
    if (!list) return
    const name = input.name.trim()
    if (!name) return
    list.name = name
    list.category = input.category?.trim() || null
    list.color = input.color
    persist()
  }

  function renameList(id: string, name: string) {
    const list = lists.value.find((l) => l.id === id)
    const trimmed = name.trim()
    if (!list || !trimmed) return
    list.name = trimmed
    persist()
  }

  function deleteList(id: string) {
    lists.value = lists.value.filter((l) => l.id !== id)
    persist()
  }

  function getList(id: string) {
    return computed(() => lists.value.find((l) => l.id === id) ?? null)
  }

  function findTask(listId: string, taskId: string) {
    const list = lists.value.find((l) => l.id === listId)
    return { list, task: list?.tasks.find((t) => t.id === taskId) }
  }

  function addTask(listId: string, text: string, assignee: string | null = null, meta: Partial<TaskMeta> = {}) {
    const trimmed = text.trim()
    if (!trimmed) return
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    const task = baseTask(trimmed, Date.now())
    Object.assign(task, meta)
    task.assignee = (meta.assignee ?? assignee)?.trim() || null
    list.tasks.unshift(task)
    persist()
    return task.id
  }

  function updateTaskMeta(listId: string, taskId: string, patch: Partial<TaskMeta>) {
    const { task } = findTask(listId, taskId)
    if (!task) return
    // Si cambia cuándo vence o a qué hora avisar, el recordatorio vuelve a quedar pendiente.
    if (('dueDate' in patch && patch.dueDate !== task.dueDate) || ('remindAt' in patch && patch.remindAt !== task.remindAt)) {
      task.remindedFor = null
    }
    Object.assign(task, patch)
    persist()
  }

  // --- Subtareas ---
  function addSubtask(listId: string, taskId: string, text: string) {
    const { task } = findTask(listId, taskId)
    const trimmed = text.trim()
    if (!task || !trimmed) return
    task.subtasks.push({ id: uuid(), text: trimmed, done: false })
    persist()
  }

  function toggleSubtask(listId: string, taskId: string, subtaskId: string) {
    const st = findTask(listId, taskId).task?.subtasks.find((s) => s.id === subtaskId)
    if (!st) return
    st.done = !st.done
    persist()
  }

  function deleteSubtask(listId: string, taskId: string, subtaskId: string) {
    const { task } = findTask(listId, taskId)
    if (!task) return
    task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId)
    persist()
  }

  /** Mueve la tarea `taskId` al lugar que ocupa `overId` (para reordenar arrastrando). */
  function moveTask(listId: string, taskId: string, overId: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list || taskId === overId) return
    const from = list.tasks.findIndex((t) => t.id === taskId)
    const to = list.tasks.findIndex((t) => t.id === overId)
    if (from < 0 || to < 0) return
    const [task] = list.tasks.splice(from, 1)
    list.tasks.splice(to, 0, task!)
    persist()
  }

  function editTask(listId: string, taskId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const list = lists.value.find((l) => l.id === listId)
    const task = list?.tasks.find((t) => t.id === taskId)
    if (!task) return
    task.text = trimmed
    persist()
  }

  function toggleTask(listId: string, taskId: string) {
    const list = lists.value.find((l) => l.id === listId)
    const task = list?.tasks.find((t) => t.id === taskId)
    if (!task || !list) return

    const wasCompleted = task.completed
    task.completed = !task.completed

    if (!wasCompleted && task.completed) {
      task.completedAt = Date.now()
      useCompanion().awardTaskCompletion()
      usePointsLedger().record(task.id, task.assignee, POINTS_PER_TASK)

      if (task.recurrence && !task.recurrenceSpawned) {
        const fromKey = task.dueDate ?? toDateKey(new Date())
        list.tasks.unshift({
          ...baseTask(task.text, Date.now()),
          priority: task.priority,
          dueDate: nextDueDate(fromKey, task),
          recurrence: task.recurrence,
          recurrenceInterval: task.recurrenceInterval,
          recurrenceDays: [...task.recurrenceDays],
          remindAt: task.remindAt,
          assignee: task.assignee,
          subtasks: task.subtasks.map((st) => ({ id: uuid(), text: st.text, done: false })),
        })
        task.recurrenceSpawned = true
      }
    } else if (wasCompleted && !task.completed) {
      task.completedAt = null
      task.orderStatus = 'new'
    }

    persist()
  }

  function setOrderStatus(listId: string, taskId: string, status: OrderStatus) {
    const list = lists.value.find((l) => l.id === listId)
    const task = list?.tasks.find((t) => t.id === taskId)
    if (!task) return
    task.orderStatus = status
    persist()
  }

  function deleteTask(listId: string, taskId: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    list.tasks = list.tasks.filter((t) => t.id !== taskId)
    persist()
  }

  function clearCompleted(listId: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    list.tasks = list.tasks.filter((t) => !t.completed)
    persist()
  }

  /** Hace sonar los recordatorios de tareas que ya llegaron a su hora. Se llama periódicamente desde un plugin. */
  function checkTaskReminders(now: Date = new Date()) {
    if (!import.meta.client) return
    let changed = false
    for (const list of lists.value) {
      for (const task of list.tasks) {
        if (task.completed || !task.dueDate || !task.remindAt || task.remindedFor === task.dueDate) continue
        const at = combineDateTime(task.dueDate, task.remindAt).getTime()
        if (now.getTime() < at) continue
        task.remindedFor = task.dueDate
        changed = true
        // Si la app estuvo cerrada y ya pasaron más de 12 h, no avisar de algo tan viejo.
        if (now.getTime() - at > 12 * 3600_000) continue
        dueReminders.value.push({ listId: list.id, taskId: task.id, text: task.text, listName: list.name, time: task.remindAt })
        notify(`⏰ ${task.text}`, `${list.name} · ${task.remindAt}`, `task-${task.id}`, `/list/${list.id}`)
      }
    }
    if (changed) persist()
  }

  function dismissReminder(taskId: string) {
    dueReminders.value = dueReminders.value.filter((r) => r.taskId !== taskId)
  }

  /** Pospone el recordatorio `minutes` minutos (lo mueve a hoy, a la nueva hora). */
  function snoozeReminder(listId: string, taskId: string, minutes = 10) {
    const { task } = findTask(listId, taskId)
    dismissReminder(taskId)
    if (!task) return
    const at = new Date(Date.now() + minutes * 60_000)
    task.dueDate = toDateKey(at)
    task.remindAt = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
    task.remindedFor = null
    persist()
  }

  return {
    lists,
    categories,
    assignees,
    addList,
    setListSticker,
    setListFont,
    editList,
    renameList,
    deleteList,
    getList,
    addTask,
    editTask,
    updateTaskMeta,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    moveTask,
    toggleTask,
    setOrderStatus,
    deleteTask,
    clearCompleted,
    dueReminders,
    checkTaskReminders,
    dismissReminder,
    snoozeReminder,
  }
}
