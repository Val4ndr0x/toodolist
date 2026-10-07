<script setup lang="ts">
import type { ReadingStatus } from '~/composables/useReadingTracker'
import { STATUS_LABELS, XP } from '~/composables/useReadingTracker'

const props = defineProps<{ bookId: string }>()
const emit = defineEmits<{ close: []; read: [id: string] }>()

const { books, logReading, setPages, setStatus, addTakeaway, removeTakeaway, setAction, toggleActionDone, setRating, removeBook, finishEstimate } = useReadingTracker()

const book = computed(() => books.value.find((b) => b.id === props.bookId))
watch(book, (b) => {
  if (!b) emit('close')
})

const pageInput = ref<number | null>(null)
const pagesInput = ref<number | null>(book.value?.pages || null)
const takeaway = ref('')
const action = ref(book.value?.action ?? '')

const progress = computed(() => (book.value?.pages ? book.value.currentPage / book.value.pages : 0))
const eta = computed(() => (book.value ? finishEstimate(book.value) : null))

function savePage() {
  if (!book.value || !pageInput.value) return
  logReading(book.value.id, { page: pageInput.value })
  pageInput.value = null
}

function saveTakeaway() {
  if (!book.value) return
  addTakeaway(book.value.id, takeaway.value)
  takeaway.value = ''
}

function onRemove() {
  if (book.value && confirm(`¿Quitar "${book.value.title}" de tu lista? Se borrará su progreso.`)) removeBook(book.value.id)
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
</script>

<template>
  <div v-if="book" class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <div class="w-full sm:max-w-lg bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      <div class="flex gap-3">
        <div class="w-20 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-black/5 dark:bg-surface-soft">
          <img v-if="book.cover" :src="book.cover" :alt="book.title" class="w-full h-full object-cover" />
          <span v-else class="w-full h-full flex items-center justify-center text-3xl">📘</span>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="font-bold text-black/80 dark:text-ink leading-tight">{{ book.title }}</h2>
          <p class="text-sm text-black/50 dark:text-muted">{{ book.author }}</p>
          <div class="flex gap-0.5 mt-1">
            <button v-for="n in 5" :key="n" type="button" class="text-lg leading-none" :class="n <= book.rating ? '' : 'grayscale opacity-30'" @click="setRating(book.id, n)">⭐</button>
          </div>
          <button
            type="button"
            class="mt-2 mb-1 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
            @click="emit('read', book.id)"
          >
            📖 {{ book.access === 'borrowable' ? 'Leer (préstamo gratis)' : 'Leer el libro' }}
          </button>
          <br />
          <a v-if="book.link" :href="book.link" target="_blank" rel="noopener" class="text-xs text-accent-deep hover:underline">Ver en la biblioteca en línea ↗</a>
        </div>
        <button type="button" class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="grid grid-cols-3 gap-1.5 bg-black/5 dark:bg-surface-soft rounded-full p-1">
        <button
          v-for="(label, key) in STATUS_LABELS"
          :key="key"
          type="button"
          class="py-1.5 rounded-full text-xs font-semibold transition-colors"
          :class="book.status === key ? 'bg-[#f4a8c4] text-white shadow-sm' : 'text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
          @click="setStatus(book.id, key as ReadingStatus)"
        >
          {{ label }}
        </button>
      </div>

      <!-- Progreso -->
      <section class="fin-card flex flex-col gap-2">
        <div class="flex justify-between text-sm font-semibold text-black/70 dark:text-ink">
          <span>Progreso</span>
          <span v-if="book.pages">{{ book.currentPage }} / {{ book.pages }} págs. · {{ Math.round(progress * 100) }}%</span>
          <span v-else>Página {{ book.currentPage }}</span>
        </div>
        <div class="h-2.5 rounded-full bg-black/10 dark:bg-surface-soft overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${progress * 100}%` }" />
        </div>
        <p v-if="eta" class="text-xs text-black/50 dark:text-muted">
          A tu ritmo lo terminas en <b>{{ eta.days }} {{ eta.days === 1 ? 'día' : 'días' }}</b> ({{ eta.date.toLocaleDateString('es', { day: 'numeric', month: 'short' }) }}) 🏁
        </p>
        <div v-if="!book.pages" class="flex gap-2">
          <input v-model.number="pagesInput" type="number" min="1" placeholder="¿Cuántas páginas tiene?" :class="[inputCls, 'flex-1']" />
          <button type="button" class="px-3 rounded-xl bg-black/75 dark:bg-accent text-white text-xs font-semibold" @click="pagesInput && setPages(book.id, pagesInput)">Guardar</button>
        </div>
        <form v-if="book.status !== 'leido'" class="flex gap-2" @submit.prevent="savePage">
          <input v-model.number="pageInput" type="number" :min="book.currentPage + 1" :max="book.pages || undefined" placeholder="Llegué a la página…" :class="[inputCls, 'flex-1']" />
          <button type="submit" class="px-3 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">Registrar</button>
        </form>
        <div v-if="book.status !== 'leido'" class="flex gap-1.5">
          <button v-for="n in [5, 10, 20]" :key="n" type="button" class="flex-1 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25" @click="logReading(book.id, { addPages: n })">
            +{{ n }} págs.
          </button>
        </div>
      </section>

      <!-- Ideas clave -->
      <section class="fin-card flex flex-col gap-2">
        <h3 class="text-sm font-bold text-black/70 dark:text-ink">💡 Ideas clave <span class="text-xs font-normal text-black/40 dark:text-muted">(+{{ XP.takeaway }} XP c/u)</span></h3>
        <ul v-if="book.takeaways.length" class="flex flex-col gap-1">
          <li v-for="(t, i) in book.takeaways" :key="i" class="group flex items-start gap-2 text-sm text-black/70 dark:text-ink/85">
            <span>•</span>
            <span class="flex-1">{{ t }}</span>
            <button type="button" class="opacity-40 hover:opacity-100 text-xs" title="Quitar" @click="removeTakeaway(book.id, i)">✕</button>
          </li>
        </ul>
        <form class="flex gap-2" @submit.prevent="saveTakeaway">
          <input v-model="takeaway" type="text" maxlength="200" placeholder="p. ej. Págate a ti primero: ahorra antes de gastar" :class="[inputCls, 'flex-1']" />
          <button type="submit" class="px-3 rounded-xl bg-[#f4a8c4] text-white text-xs font-semibold hover:bg-[#ef8fb5]">Anotar</button>
        </form>
      </section>

      <!-- Acción -->
      <section class="fin-card flex flex-col gap-2">
        <h3 class="text-sm font-bold text-black/70 dark:text-ink">🎯 Llévalo a tus finanzas <span class="text-xs font-normal text-black/40 dark:text-muted">(+{{ XP.action }} XP)</span></h3>
        <p class="text-xs text-black/50 dark:text-muted">Una acción concreta que harás por lo que aprendiste. Leer sin aplicar no cambia tu bolsillo.</p>
        <div class="flex gap-2">
          <input v-model="action" type="text" maxlength="160" placeholder="p. ej. Automatizar 10% de mi ingreso a ahorro" :class="[inputCls, 'flex-1']" @change="setAction(book.id, action)" />
          <button
            type="button"
            class="px-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            :class="book.actionDone ? 'bg-emerald-500 text-white' : 'bg-black/5 dark:bg-surface-soft text-black/60 dark:text-muted'"
            :disabled="!book.action"
            @click="toggleActionDone(book.id)"
          >
            {{ book.actionDone ? '✓ Hecho' : 'Marcar hecho' }}
          </button>
        </div>
      </section>

      <button type="button" class="self-start text-xs text-danger hover:underline" @click="onRemove">Quitar de mi lista</button>
    </div>
  </div>
</template>
