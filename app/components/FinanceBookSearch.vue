<script setup lang="ts">
import type { AccessFilter, BookResult, BookTopicId } from '~/utils/financeBooksApi'
import { ACCESS_FILTERS, BOOK_TOPICS, searchFinanceBooks } from '~/utils/financeBooksApi'

const emit = defineEmits<{ read: [bookId: string] }>()

const { hasBook, addBook } = useReadingTracker()

const access = ref<AccessFilter>('leer')
const accessHint = computed(() => ACCESS_FILTERS.find((f) => f.id === access.value)!.hint)

const topic = ref<BookTopicId>('personales')
const text = ref('')
const results = ref<BookResult[]>([])
const loading = ref(false)
const error = ref('')
let requestId = 0

async function run() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const found = await searchFinanceBooks({ topic: topic.value, text: text.value, access: access.value })
    if (id === requestId) results.value = found
  } catch {
    if (id === requestId) {
      results.value = []
      error.value = 'No se pudo conectar con la biblioteca en línea. Revisa tu conexión e inténtalo de nuevo.'
    }
  } finally {
    if (id === requestId) loading.value = false
  }
}

function pickTopic(id: BookTopicId) {
  topic.value = id
  text.value = ''
  run()
}

function pickAccess(id: AccessFilter) {
  access.value = id
  run()
}

/** Leer ya: lo agrega a la lista (como "leyendo") y abre el lector. */
function read(b: BookResult) {
  if (!hasBook(b.id)) addBook(b, 'leyendo')
  emit('read', b.id)
}

onMounted(run)
</script>

<template>
  <div class="flex flex-col gap-3">
    <form class="flex gap-2" @submit.prevent="run">
      <input
        v-model="text"
        type="search"
        placeholder="Buscar libro, autor o tema (p. ej. inversión, Kiyosaki)…"
        class="flex-1 min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent"
      />
      <button type="submit" class="px-4 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5]">
        <AppIcon name="search" :size="16" />
      </button>
    </form>

    <div class="flex flex-col gap-1">
      <div class="grid grid-cols-3 gap-1 bg-white/50 dark:bg-surface-soft rounded-full p-1">
        <button
          v-for="f in ACCESS_FILTERS"
          :key="f.id"
          type="button"
          class="py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors truncate"
          :class="access === f.id ? 'bg-white dark:bg-surface text-black/75 dark:text-ink shadow-sm' : 'text-black/45 dark:text-muted'"
          @click="pickAccess(f.id)"
        >
          {{ f.label }}
        </button>
      </div>
      <p class="text-[11px] text-black/45 dark:text-muted px-1">{{ accessHint }}</p>
    </div>

    <div class="flex gap-1.5 overflow-x-auto pb-1">
      <button
        v-for="t in BOOK_TOPICS"
        :key="t.id"
        type="button"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        :class="topic === t.id && !text ? 'bg-black/75 dark:bg-accent text-white' : 'bg-white/60 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
        @click="pickTopic(t.id)"
      >
        {{ t.label }}
      </button>
    </div>

    <p v-if="loading" class="text-sm text-black/45 dark:text-muted text-center py-6">Buscando libros… 📚</p>
    <p v-else-if="error" class="text-sm text-rose-500 text-center py-6">{{ error }}</p>
    <p v-else-if="!results.length" class="text-sm text-black/45 dark:text-muted text-center py-6">No encontramos libros de finanzas con esa búsqueda.</p>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="b in results" :key="b.id" class="fin-card !p-2.5 flex flex-col gap-2">
        <a :href="b.link" target="_blank" rel="noopener" class="relative block aspect-[2/3] rounded-xl overflow-hidden bg-black/5 dark:bg-surface-soft">
          <span
            v-if="b.access"
            class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow"
            :class="b.access === 'public' ? 'bg-emerald-600' : 'bg-amber-500'"
          >
            {{ b.access === 'public' ? '📖 Gratis' : '🔐 Préstamo' }}
          </span>
          <img v-if="b.cover" :src="b.cover" :alt="b.title" loading="lazy" class="w-full h-full object-cover" />
          <span v-else class="w-full h-full flex items-center justify-center text-4xl">📘</span>
        </a>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-black/80 dark:text-ink leading-tight line-clamp-2">{{ b.title }}</p>
          <p class="text-xs text-black/50 dark:text-muted truncate">{{ b.author }}</p>
          <p class="text-[11px] text-black/40 dark:text-muted">
            <span v-if="b.pages">{{ b.pages }} págs.</span>
            <span v-if="b.rating"> · ⭐ {{ b.rating.toFixed(1) }}</span>
            <span v-if="b.year"> · {{ b.year }}</span>
          </p>
        </div>
        <button
          v-if="b.ia"
          type="button"
          class="py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
          @click="read(b)"
        >
          📖 Leer ahora
        </button>
        <button
          v-if="!hasBook(b.id)"
          type="button"
          class="py-1.5 rounded-full text-xs font-semibold"
          :class="b.ia ? 'bg-black/5 dark:bg-surface-soft text-black/60 dark:text-muted hover:text-black/85 dark:hover:text-ink' : 'bg-[#f4a8c4] text-white hover:bg-[#ef8fb5]'"
          @click="addBook(b)"
        >
          + A mi lista
        </button>
        <span v-else class="py-1.5 text-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">✓ En tu lista</span>
      </div>
    </div>

    <p class="text-[11px] text-black/35 dark:text-muted text-center">Datos y lector: Open Library e Internet Archive. Los préstamos piden una cuenta gratuita de archive.org.</p>
  </div>
</template>
