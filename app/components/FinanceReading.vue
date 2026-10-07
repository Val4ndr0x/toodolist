<script setup lang="ts">
import type { ReadingStatus } from '~/composables/useReadingTracker'

const {
  books, dailyGoal, pagesToday, streak, streakAtRisk, bestStreak, stats, xp, level, badges, lastWeek, pace, freshBadges,
  finishEstimate, logReading, setDailyGoal, dismissBadge,
} = useReadingTracker()

const view = ref<'mis-libros' | 'descubrir'>(books.value.length ? 'mis-libros' : 'descubrir')
const openBookId = ref<string | null>(null)
const readingBookId = ref<string | null>(null)

function openReader(id: string) {
  openBookId.value = null
  readingBookId.value = id
}

const goalProgress = computed(() => Math.min(1, pagesToday.value / Math.max(1, dailyGoal.value)))
const weekMax = computed(() => Math.max(dailyGoal.value, ...lastWeek.value.map((d) => d.pages)))
const unlockedCount = computed(() => badges.value.filter((b) => b.unlocked).length)

const SHELVES: { status: ReadingStatus; title: string }[] = [
  { status: 'leyendo', title: '📖 Leyendo ahora' },
  { status: 'quiero', title: '🔖 Quiero leer' },
  { status: 'leido', title: '🎓 Leídos' },
]
const shelves = computed(() => SHELVES.map((s) => ({ ...s, books: books.value.filter((b) => b.status === s.status) })).filter((s) => s.books.length))

/** Mensaje que empuja a la siguiente acción según el estado del hábito. */
const nudge = computed(() => {
  if (!books.value.length) return 'Agrega tu primer libro de finanzas y empieza tu racha hoy. 🌱'
  if (streakAtRisk.value) return `¡Tu racha de ${streak.value} ${streak.value === 1 ? 'día' : 'días'} está en riesgo! Lee aunque sean 2 páginas hoy. 🔥`
  if (pagesToday.value === 0) return 'Empieza poco a poco: con solo 5 páginas hoy arrancas tu racha. ⏱️'
  if (goalProgress.value < 1) return `Te faltan ${dailyGoal.value - pagesToday.value} páginas para cumplir tu meta de hoy. ¡Tú puedes! 💪`
  return `¡Meta del día cumplida! Llevas ${level.value.toNext} XP para subir a nivel ${level.value.n + 1}. 🚀`
})

function editGoal() {
  const value = prompt('¿Cuántas páginas quieres leer al día?', String(dailyGoal.value))
  const n = Number(value)
  if (value && n > 0) setDailyGoal(n)
}

const RING = 2 * Math.PI * 26

// El aviso de insignia se cierra solo a los pocos segundos.
watch(
  () => freshBadges.value[0]?.id,
  (id) => {
    if (!id) return
    setTimeout(() => {
      if (freshBadges.value[0]?.id === id) dismissBadge()
    }, 4000)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Tablero del hábito -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="fin-card flex items-center gap-3">
        <span class="text-3xl" :class="{ 'grayscale opacity-40': !streak, 'animate-pulse': streakAtRisk }">🔥</span>
        <div>
          <p class="text-xl font-bold text-black/80 dark:text-ink leading-none">{{ streak }}</p>
          <p class="text-[11px] text-black/45 dark:text-muted">días de racha · récord {{ bestStreak }}</p>
        </div>
      </div>

      <button type="button" class="fin-card flex items-center gap-3 text-left" title="Cambiar meta diaria" @click="editGoal">
        <svg width="44" height="44" viewBox="0 0 60 60" class="-rotate-90 shrink-0">
          <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="7" class="text-black/10 dark:text-surface-soft" />
          <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" class="text-emerald-500 transition-all" :stroke-dasharray="RING" :stroke-dashoffset="RING * (1 - goalProgress)" />
        </svg>
        <div>
          <p class="text-xl font-bold text-black/80 dark:text-ink leading-none">{{ pagesToday }}<span class="text-sm text-black/40 dark:text-muted">/{{ dailyGoal }}</span></p>
          <p class="text-[11px] text-black/45 dark:text-muted">páginas hoy ✏️</p>
        </div>
      </button>

      <div class="fin-card col-span-2">
        <div class="flex justify-between items-baseline">
          <p class="text-sm font-bold text-black/75 dark:text-ink">Nivel {{ level.n }} · {{ level.name }}</p>
          <p class="text-[11px] text-black/45 dark:text-muted">{{ xp }} XP</p>
        </div>
        <div class="h-2.5 mt-2 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-[#f4a8c4] to-amber-400 transition-all" :style="{ width: `${level.progress * 100}%` }" />
        </div>
        <p class="mt-1 text-[11px] text-black/45 dark:text-muted">Faltan {{ level.toNext }} XP para el siguiente nivel</p>
      </div>
    </div>

    <p class="fin-card !py-2.5 text-sm font-medium text-black/65 dark:text-ink/85">{{ nudge }}</p>

    <div class="grid sm:grid-cols-2 gap-3">
      <div class="fin-card">
        <div class="flex justify-between mb-2">
          <h3 class="text-sm font-bold text-black/70 dark:text-ink">Últimos 7 días</h3>
          <span class="text-[11px] text-black/45 dark:text-muted">ritmo: {{ pace.toFixed(1) }} págs/día</span>
        </div>
        <div class="flex items-end gap-1.5 h-24">
          <div v-for="d in lastWeek" :key="d.key" class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span class="text-[10px] text-black/45 dark:text-muted">{{ d.pages || '' }}</span>
            <div
              class="w-full rounded-md transition-all"
              :class="d.pages >= dailyGoal ? 'bg-emerald-500' : d.pages ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-black/10 dark:bg-surface-soft'"
              :style="{ height: `${Math.max(6, (d.pages / weekMax) * 100)}%` }"
            />
            <span class="text-[10px] text-black/45 dark:text-muted">{{ d.label }}</span>
          </div>
        </div>
      </div>

      <div class="fin-card">
        <div class="flex justify-between mb-2">
          <h3 class="text-sm font-bold text-black/70 dark:text-ink">Insignias</h3>
          <span class="text-[11px] text-black/45 dark:text-muted">{{ unlockedCount }}/{{ badges.length }}</span>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
          <div
            v-for="b in badges"
            :key="b.id"
            class="aspect-square rounded-xl flex items-center justify-center text-xl"
            :class="b.unlocked ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-black/5 dark:bg-surface-soft grayscale opacity-35'"
            :title="`${b.label}: ${b.hint}`"
          >
            {{ b.emoji }}
          </div>
        </div>
        <p class="mt-2 text-[11px] text-black/45 dark:text-muted">
          {{ stats.totalPages }} págs. leídas · {{ stats.finished }} libros · {{ stats.takeaways }} ideas · {{ stats.actions }} acciones aplicadas
        </p>
      </div>
    </div>

    <!-- Mis libros / descubrir -->
    <div class="grid grid-cols-2 gap-1.5 bg-white/50 dark:bg-surface-soft rounded-full p-1">
      <button
        v-for="v in (['mis-libros', 'descubrir'] as const)"
        :key="v"
        type="button"
        class="py-1.5 rounded-full text-sm font-semibold transition-colors"
        :class="view === v ? 'bg-white dark:bg-surface text-black/75 dark:text-ink shadow-sm' : 'text-black/45 dark:text-muted'"
        @click="view = v"
      >
        {{ v === 'mis-libros' ? `📚 Mis libros (${books.length})` : '🔎 Descubrir libros' }}
      </button>
    </div>

    <FinanceBookSearch v-if="view === 'descubrir'" @read="openReader" />

    <template v-else>
      <p v-if="!books.length" class="text-center text-sm text-black/45 dark:text-muted py-6">
        Tu lista está vacía. <button type="button" class="text-accent-deep font-semibold hover:underline" @click="view = 'descubrir'">Descubre libros de finanzas →</button>
      </p>

      <section v-for="shelf in shelves" :key="shelf.status">
        <h3 class="text-sm font-bold text-black/65 dark:text-ink/80 mb-2 px-0.5">{{ shelf.title }} <span class="text-xs font-medium text-black/40 dark:text-muted">({{ shelf.books.length }})</span></h3>
        <div class="grid sm:grid-cols-2 gap-3">
          <div v-for="b in shelf.books" :key="b.id" class="fin-card !p-3 flex gap-3 cursor-pointer hover:-translate-y-0.5 transition-transform" @click="openBookId = b.id">
            <div class="w-14 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-black/5 dark:bg-surface-soft">
              <img v-if="b.cover" :src="b.cover" :alt="b.title" loading="lazy" class="w-full h-full object-cover" />
              <span v-else class="w-full h-full flex items-center justify-center text-2xl">📘</span>
            </div>
            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <p class="text-sm font-bold text-black/80 dark:text-ink leading-tight line-clamp-2">{{ b.title }}</p>
              <p class="text-xs text-black/50 dark:text-muted truncate">{{ b.author }}</p>
              <template v-if="b.status === 'leyendo'">
                <div class="h-1.5 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden mt-auto">
                  <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${b.pages ? (b.currentPage / b.pages) * 100 : 0}%` }" />
                </div>
                <div class="flex items-center justify-between gap-2 text-[11px] text-black/50 dark:text-muted">
                  <span>{{ b.pages ? `${b.currentPage}/${b.pages}` : `pág. ${b.currentPage}` }}<template v-if="finishEstimate(b)"> · {{ finishEstimate(b)!.days }}d</template></span>
                  <span class="flex gap-1">
                    <button type="button" class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-500/25" @click.stop="logReading(b.id, { addPages: 5 })">+5</button>
                    <button type="button" class="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600" @click.stop="openReader(b.id)">📖 Leer</button>
                  </span>
                </div>
              </template>
              <p v-else-if="b.status === 'leido'" class="mt-auto text-[11px] text-black/50 dark:text-muted">
                {{ '⭐'.repeat(b.rating) || 'Sin valorar' }} · {{ b.takeaways.length }} ideas{{ b.actionDone ? ' · ✅ aplicado' : '' }}
              </p>
              <p v-else class="mt-auto text-[11px] text-black/50 dark:text-muted">
                {{ b.pages ? `${b.pages} págs. · ~${Math.ceil(b.pages / Math.max(1, dailyGoal))} días a tu meta diaria` : 'Toca para empezar' }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <FinanceReadingBookModal v-if="openBookId" :book-id="openBookId" @close="openBookId = null" @read="openReader" />
    <FinanceBookReader v-if="readingBookId" :book-id="readingBookId" @close="readingBookId = null" />

    <Transition name="badge-toast">
      <div
        v-if="freshBadges.length"
        class="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 sm:bottom-8 bg-white dark:bg-surface rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-amber-200 dark:border-border"
        @click="dismissBadge"
      >
        <span class="text-3xl">{{ freshBadges[0]!.emoji }}</span>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">¡Insignia desbloqueada!</p>
          <p class="text-sm font-bold text-black/80 dark:text-ink">{{ freshBadges[0]!.label }}</p>
        </div>
        <button type="button" class="ml-2 text-black/40 dark:text-muted text-sm">✕</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.badge-toast-enter-active,
.badge-toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.badge-toast-enter-from,
.badge-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
