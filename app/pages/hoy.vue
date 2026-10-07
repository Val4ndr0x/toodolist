<script setup lang="ts">
import type { Task } from '~/composables/useLists'
import { amountDue } from '~/composables/useClients'
import { categoryEmoji, currentMonth, money, todayISO } from '~/composables/useFinance'
import { addDays, formatFullDate, toDateKey } from '~/utils/calendarDate'

const router = useRouter()
const { userName } = useCompanion()
const { lists, addTask, editTask, updateTaskMeta, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useLists()
const { eventsForDate } = useCalendar()
const { clients, toggleDelivered } = useClients()
const { monthTransactions, budgets, categoryTotals, debts, upcomingRecurring } = useFinance()
const { pagesToday, dailyGoal, streak, streakAtRisk, books: readingBooks } = useReadingTracker()
const { open: searchOpen } = useGlobalSearch()

const today = todayISO()
const now = new Date()
const soonKey = toDateKey(addDays(now, 3))
const weekKey = toDateKey(addDays(now, 7))

const greeting = computed(() => {
  const h = now.getHours()
  const base = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return userName.value ? `${base}, ${userName.value}` : base
})

// --- Tareas ---
type TaskRow = { task: Task; listId: string; listName: string }
const allPending = computed<TaskRow[]>(() =>
  lists.value.flatMap((l) => l.tasks.filter((t) => !t.completed).map((task) => ({ task, listId: l.id, listName: l.name }))),
)
const byDue = (a: TaskRow, b: TaskRow) => (a.task.dueDate ?? '').localeCompare(b.task.dueDate ?? '') || (a.task.remindAt ?? '99').localeCompare(b.task.remindAt ?? '99')
const overdue = computed(() => allPending.value.filter((r) => r.task.dueDate && r.task.dueDate < today).sort(byDue))
const dueToday = computed(() => allPending.value.filter((r) => r.task.dueDate === today).sort(byDue))
const important = computed(() => allPending.value.filter((r) => !r.task.dueDate && r.task.priority === 'high').slice(0, 5))
/** Completadas hoy, para que no desaparezcan de golpe al marcarlas. */
const doneToday = computed(() =>
  lists.value.flatMap((l) =>
    l.tasks
      .filter((t) => t.completed && t.completedAt && toDateKey(new Date(t.completedAt)) === today && (t.dueDate ?? today) <= today)
      .map((task) => ({ task, listId: l.id, listName: l.name })),
  ),
)
const taskGroups = computed(() =>
  [
    { id: 'overdue', title: '⚠️ Atrasadas', rows: overdue.value },
    { id: 'today', title: '📌 Para hoy', rows: dueToday.value },
    { id: 'important', title: '🔴 Importantes sin fecha', rows: important.value },
    { id: 'done', title: '✨ Hechas hoy', rows: doneToday.value },
  ].filter((g) => g.rows.length),
)

const targetListId = ref<string>('')
watchEffect(() => {
  if (!lists.value.some((l) => l.id === targetListId.value)) targetListId.value = lists.value[0]?.id ?? ''
})

function onAdd(text: string, assignee: string | null, meta: Parameters<typeof addTask>[3]) {
  if (!targetListId.value) return
  // Lo que se agrega desde Hoy vence hoy, salvo que se escriba otra fecha.
  addTask(targetListId.value, text, assignee, { dueDate: today, ...meta })
}

// --- Agenda ---
const events = eventsForDate(today)

// --- Clientes ---
const deliveries = computed(() =>
  clients.value
    .filter((c) => !c.delivered && c.deliveryDate && c.deliveryDate <= soonKey)
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
)
function deliveryLabel(date: string) {
  if (date < today) return 'atrasado'
  if (date === today) return 'hoy'
  return new Date(`${date}T00:00:00`).toLocaleDateString('es', { weekday: 'long' })
}

// --- Dinero ---
const spentToday = computed(() => monthTransactions(currentMonth()).filter((t) => t.date === today && t.type === 'gasto').reduce((s, t) => s + t.amount, 0))
const upcoming = computed(() => upcomingRecurring(7).slice(0, 5))
const debtsDue = computed(() => debts.value.filter((d) => d.dueDate && d.paid < d.amount && d.dueDate <= weekKey).sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
const budgetAlerts = computed(() => {
  const spent = new Map(categoryTotals(currentMonth(), 'gasto').map((c) => [c.category, c.total]))
  return budgets.value
    .map((b) => ({ ...b, spent: spent.get(b.category) ?? 0 }))
    .filter((b) => b.limit > 0 && b.spent / b.limit >= 0.8)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
})

// --- Lectura ---
const readingNow = computed(() => readingBooks.value.filter((b) => b.status === 'leyendo').slice(0, 2))
const readingPct = computed(() => Math.min(1, pagesToday.value / Math.max(1, dailyGoal.value)))

function shortDate(key: string) {
  if (key === today) return 'hoy'
  return new Date(`${key}T00:00:00`).toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
}

const nothingToday = computed(
  () => !taskGroups.value.length && !events.value.length && !deliveries.value.length && !upcoming.value.length && !debtsDue.value.length && !budgetAlerts.value.length,
)
</script>

<template>
  <div class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0 pb-24 sm:pb-8">
      <AppHeader title="Hoy" />

      <div class="mx-3 sm:mx-6 flex flex-col gap-4 max-w-4xl">
        <div class="hoy-hero rounded-[28px] p-5 sm:p-6">
          <p class="text-sm font-medium text-black/50 dark:text-muted capitalize">{{ formatFullDate(now) }}</p>
          <h2 class="text-2xl font-bold text-black/80 dark:text-ink mt-0.5">{{ greeting }} ☀️</h2>
          <p class="text-sm text-black/55 dark:text-muted mt-1">
            <template v-if="nothingToday">Nada urgente por hoy. ¡Disfruta el día!</template>
            <template v-else>
              {{ overdue.length + dueToday.length }} tarea{{ overdue.length + dueToday.length === 1 ? '' : 's' }} para hoy<template v-if="events.length"> · {{ events.length }} evento{{ events.length === 1 ? '' : 's' }}</template><template v-if="deliveries.length"> · {{ deliveries.length }} entrega{{ deliveries.length === 1 ? '' : 's' }}</template>
            </template>
          </p>
          <button
            type="button"
            class="mt-4 w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-surface-soft text-sm text-black/45 dark:text-muted hover:text-black/70 dark:hover:text-ink transition-colors"
            @click="searchOpen = true"
          >
            <AppIcon name="search" :size="16" /> Buscar en toda la app…
            <span class="ml-auto hidden sm:inline text-[11px] px-1.5 py-0.5 rounded border border-black/10 dark:border-border">Ctrl K</span>
          </button>
        </div>

        <div class="grid lg:grid-cols-[1fr_20rem] gap-4 items-start">
          <!-- Tareas -->
          <section class="hoy-sky rounded-[28px] p-4 sm:p-5">
            <div class="flex items-center justify-between gap-2 mb-1">
              <h3 class="text-base font-bold text-white/85">Tareas</h3>
              <label v-if="lists.length > 1" class="flex items-center gap-1.5 text-xs text-white/50">
                Agregar a
                <select v-model="targetListId" class="bg-white/10 text-white/85 rounded-full px-2.5 py-1 outline-none max-w-[10rem]">
                  <option v-for="l in lists" :key="l.id" :value="l.id" class="text-black">{{ l.name }}</option>
                </select>
              </label>
            </div>
            <AddTaskForm v-if="targetListId" @add="onAdd" />

            <div v-for="g in taskGroups" :key="g.id" class="mb-4 last:mb-0">
              <p class="text-xs font-semibold text-white/55 mb-2 px-1">{{ g.title }} <span class="text-white/35">({{ g.rows.length }})</span></p>
              <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
                <template v-for="r in g.rows" :key="r.task.id">
                  <TaskItem
                    :task="r.task"
                    @toggle="(id) => toggleTask(r.listId, id)"
                    @edit="(id, text) => editTask(r.listId, id, text)"
                    @update-meta="(id, patch) => updateTaskMeta(r.listId, id, patch)"
                    @delete="(id) => deleteTask(r.listId, id)"
                    @add-subtask="(id, text) => addSubtask(r.listId, id, text)"
                    @toggle-subtask="(id, sid) => toggleSubtask(r.listId, id, sid)"
                    @delete-subtask="(id, sid) => deleteSubtask(r.listId, id, sid)"
                  />
                  <li class="-mt-1.5 ml-10 list-none">
                    <button type="button" class="text-[11px] text-white/35 hover:text-white/70" @click="router.push(`/list/${r.listId}`)">
                      en {{ r.listName }} →
                    </button>
                  </li>
                </template>
              </ul>
            </div>
            <p v-if="!taskGroups.length" class="text-sm text-white/50 text-center py-6">No tienes tareas para hoy 🌙</p>
          </section>

          <div class="flex flex-col gap-4">
            <!-- Agenda -->
            <section class="hoy-card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="hoy-title">📅 Agenda</h3>
                <NuxtLink to="/calendario" class="hoy-link">Calendario →</NuxtLink>
              </div>
              <p v-if="!events.length" class="hoy-empty">Sin eventos hoy.</p>
              <div v-for="e in events" :key="e.id" class="flex items-center gap-2.5 py-1.5 text-sm">
                <span class="w-1.5 self-stretch rounded-full" :style="{ background: e.color }" />
                <span class="text-xs tabular-nums text-black/50 dark:text-muted w-11 shrink-0">{{ e.time ?? 'Todo' }}</span>
                <span class="flex-1 min-w-0 truncate text-black/75 dark:text-ink">{{ e.title }}</span>
                <span v-if="e.alarmEnabled" title="Con alarma">⏰</span>
              </div>
            </section>

            <!-- Entregas -->
            <section v-if="deliveries.length" class="hoy-card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="hoy-title">🎀 Entregas</h3>
                <NuxtLink to="/clientes" class="hoy-link">Clientes →</NuxtLink>
              </div>
              <div v-for="c in deliveries" :key="c.id" class="flex items-center gap-2 py-1.5 text-sm">
                <button
                  type="button"
                  class="w-5 h-5 shrink-0 rounded-md border border-black/20 dark:border-border hover:border-emerald-500 flex items-center justify-center text-xs"
                  title="Marcar como entregado"
                  @click="toggleDelivered(c.id)"
                />
                <NuxtLink :to="`/clientes?id=${c.id}`" class="flex-1 min-w-0">
                  <span class="block truncate text-black/75 dark:text-ink font-medium">{{ c.name }}</span>
                  <span class="block truncate text-xs text-black/45 dark:text-muted">{{ c.order || 'Pedido' }}<template v-if="amountDue(c) > 0"> · falta {{ money(amountDue(c)) }}</template></span>
                </NuxtLink>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" :class="c.deliveryDate < today ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted'">
                  {{ deliveryLabel(c.deliveryDate) }}
                </span>
              </div>
            </section>

            <!-- Dinero -->
            <section class="hoy-card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="hoy-title">💸 Dinero</h3>
                <NuxtLink to="/finanzas" class="hoy-link">Finanzas →</NuxtLink>
              </div>
              <p class="text-sm text-black/65 dark:text-ink/80">Gastado hoy: <strong class="tabular-nums">{{ money(spentToday) }}</strong></p>

              <div v-if="budgetAlerts.length" class="mt-2.5 flex flex-col gap-1">
                <p v-for="b in budgetAlerts" :key="b.category" class="text-xs" :class="b.spent >= b.limit ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300'">
                  {{ b.spent >= b.limit ? '⛔' : '⚠️' }} {{ categoryEmoji(b.category) }} {{ b.category }}: {{ money(b.spent) }} de {{ money(b.limit) }} ({{ Math.round((b.spent / b.limit) * 100) }}%)
                </p>
              </div>

              <div v-if="upcoming.length" class="mt-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-muted mb-1">Fijos esta semana</p>
                <div v-for="u in upcoming" :key="`${u.recurring.id}-${u.date}`" class="flex justify-between gap-2 py-0.5 text-sm">
                  <span class="truncate text-black/70 dark:text-ink/85"><span class="text-black/45 dark:text-muted">{{ shortDate(u.date) }}</span> · {{ u.recurring.note || u.recurring.category }}</span>
                  <span class="tabular-nums font-semibold shrink-0" :class="u.recurring.type === 'gasto' ? 'text-rose-500' : 'text-emerald-600'">{{ u.recurring.type === 'gasto' ? '−' : '+' }}{{ money(u.recurring.amount) }}</span>
                </div>
              </div>

              <div v-if="debtsDue.length" class="mt-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-muted mb-1">Deudas por vencer</p>
                <div v-for="d in debtsDue" :key="d.id" class="flex justify-between gap-2 py-0.5 text-sm">
                  <span class="truncate text-black/70 dark:text-ink/85">
                    <span :class="d.dueDate < today ? 'text-rose-500' : 'text-black/45 dark:text-muted'">{{ shortDate(d.dueDate) }}</span>
                    · {{ d.kind === 'debo' ? 'Le debo a' : 'Me debe' }} {{ d.person }}
                  </span>
                  <span class="tabular-nums font-semibold shrink-0 text-black/70 dark:text-ink">{{ money(d.amount - d.paid) }}</span>
                </div>
              </div>
            </section>

            <!-- Lectura -->
            <section v-if="readingBooks.length" class="hoy-card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="hoy-title">📚 Lectura</h3>
                <NuxtLink to="/finanzas?tab=libros" class="hoy-link">Libros →</NuxtLink>
              </div>
              <p class="text-sm text-black/65 dark:text-ink/80">
                {{ pagesToday }} de {{ dailyGoal }} páginas
                <span v-if="streak" class="ml-1">· 🔥 {{ streak }} día{{ streak === 1 ? '' : 's' }}</span>
              </p>
              <div class="h-2 mt-1.5 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
                <div class="h-full rounded-full bg-[#f4a8c4]" :style="{ width: `${readingPct * 100}%` }" />
              </div>
              <p v-if="streakAtRisk" class="text-xs text-amber-600 dark:text-amber-300 mt-1.5">Lee aunque sea una página para no perder la racha.</p>
              <p v-for="b in readingNow" :key="b.id" class="text-xs text-black/50 dark:text-muted mt-1.5 truncate">
                📖 {{ b.title }} · pág. {{ b.currentPage }}<template v-if="b.pages">/{{ b.pages }}</template>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hoy-hero {
  background: linear-gradient(135deg, #fff6e2 0%, #fdeef4 50%, #eaf1fb 100%);
}
:global(.dark) .hoy-hero {
  background: linear-gradient(135deg, #24211c 0%, #201f26 55%, #1c1c21 100%);
}
.hoy-sky {
  background: radial-gradient(150% 170% at 50% -15%, #1c2158 0%, #0d0f2b 45%, #05060f 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 12px 30px rgba(0, 0, 0, 0.25);
}
.hoy-card {
  border-radius: 22px;
  padding: 1rem 1.1rem;
  background: #fff;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.05);
}
:global(.dark) .hoy-card {
  background: rgb(var(--c-surface));
  box-shadow: none;
}
.hoy-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(0 0 0 / 0.75);
}
:global(.dark) .hoy-title {
  color: rgb(var(--c-ink));
}
.hoy-link {
  font-size: 0.72rem;
  color: rgb(0 0 0 / 0.4);
}
.hoy-link:hover {
  text-decoration: underline;
}
:global(.dark) .hoy-link {
  color: rgb(var(--c-muted));
}
.hoy-empty {
  font-size: 0.8rem;
  color: rgb(0 0 0 / 0.45);
}
:global(.dark) .hoy-empty {
  color: rgb(var(--c-muted));
}
</style>
