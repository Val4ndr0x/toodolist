<script setup lang="ts">
import { money } from '~/composables/useFinance'

const { goals, addGoal, contributeToGoal, deleteGoal } = useFinance()

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '💻', '🎓', '💍', '🐶', '🛟', '✈️']

const name = ref('')
const emoji = ref('🎯')
const target = ref<number | null>(null)
const deadline = ref('')

function add() {
  if (!name.value.trim() || !target.value || target.value <= 0) return
  addGoal({ name: name.value, emoji: emoji.value, target: Number(target.value), deadline: deadline.value })
  name.value = ''
  target.value = null
  deadline.value = ''
}

function contribute(id: string, sign: 1 | -1) {
  const value = prompt(sign > 0 ? '¿Cuánto vas a ahorrar?' : '¿Cuánto vas a retirar?')
  if (!value) return
  const n = Number(value.replace(/[^\d.]/g, ''))
  if (n > 0) contributeToGoal(id, n * sign)
}

function remove(id: string, goalName: string) {
  if (confirm(`¿Eliminar la meta "${goalName}"?`)) deleteGoal(id)
}

/** Cuánto hay que ahorrar al mes para llegar a la meta en la fecha límite. */
function perMonth(g: { target: number; saved: number; deadline: string }) {
  if (!g.deadline || g.saved >= g.target) return null
  const months = monthsUntil(g.deadline)
  return months ? (g.target - g.saved) / months : null
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid sm:grid-cols-2 gap-3">
      <div v-for="g in goals" :key="g.id" class="fin-card flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ g.emoji }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-black/75 dark:text-ink truncate">{{ g.name }}</p>
            <p class="text-xs text-black/45 dark:text-muted">
              {{ money(g.saved) }} de {{ money(g.target) }}
              <span v-if="g.deadline"> · hasta {{ formatDate(g.deadline) }}</span>
            </p>
          </div>
          <button type="button" class="w-7 h-7 rounded-full flex items-center justify-center text-black/35 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" title="Eliminar" @click="remove(g.id, g.name)">
            <AppIcon name="trash" :size="15" />
          </button>
        </div>
        <div class="h-2.5 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${Math.min(100, (g.saved / g.target) * 100)}%` }" />
        </div>
        <p class="text-xs text-black/55 dark:text-muted">
          <template v-if="g.saved >= g.target">🎉 ¡Meta cumplida!</template>
          <template v-else>
            {{ Math.round((g.saved / g.target) * 100) }}% · faltan {{ money(g.target - g.saved) }}
            <span v-if="perMonth(g) !== null"> · ahorra {{ money(perMonth(g)!) }}/mes</span>
          </template>
        </p>
        <div class="flex gap-2">
          <button type="button" class="flex-1 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold hover:bg-emerald-500" @click="contribute(g.id, 1)">+ Ahorrar</button>
          <button type="button" class="flex-1 py-1.5 rounded-full bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted text-xs font-semibold hover:text-black/80 dark:hover:text-ink" @click="contribute(g.id, -1)">− Retirar</button>
        </div>
      </div>
    </div>

    <p v-if="!goals.length" class="text-sm text-black/50 dark:text-muted text-center py-2">Aún no tienes metas de ahorro. ¡Crea la primera! 🐷</p>

    <form class="fin-card flex flex-col gap-2" @submit.prevent="add">
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="e in EMOJIS"
          :key="e"
          type="button"
          class="w-9 h-9 rounded-xl text-lg transition-colors"
          :class="emoji === e ? 'bg-[#f4a8c4]/60' : 'bg-black/5 dark:bg-surface-soft hover:bg-black/10'"
          @click="emoji = e"
        >
          {{ e }}
        </button>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model="name" type="text" maxlength="40" placeholder="Nombre de la meta" :class="[inputCls, 'flex-1']" />
        <input v-model.number="target" type="number" min="0" step="any" placeholder="Monto objetivo" :class="[inputCls, 'sm:w-36']" />
        <input v-model="deadline" type="date" title="Fecha límite (opcional)" :class="[inputCls, 'sm:w-40']" />
      </div>
      <button type="submit" class="self-end px-4 py-2 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5] transition-colors">
        Crear meta
      </button>
    </form>
  </div>
</template>
