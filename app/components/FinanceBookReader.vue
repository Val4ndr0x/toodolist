<script setup lang="ts">
import { archiveUrl, findReadableEdition, readerUrl } from '~/utils/financeBooksApi'

const props = defineProps<{ bookId: string }>()
const emit = defineEmits<{ close: [] }>()

const { books, logReading, setReadable, setStatus } = useReadingTracker()
const book = computed(() => books.value.find((b) => b.id === props.bookId))

// El lector de Internet Archive es otro sitio: no podemos saber en qué página vas, así que se registra a mano.
const state = ref<'buscando' | 'listo' | 'sin-version' | 'error'>(book.value?.ia ? 'listo' : 'buscando')
const startPage = book.value?.currentPage ?? 0
const openedAt = Date.now()
const minutes = ref(0)
const asking = ref(false)
const pageInput = ref<number | null>(null)

const readPages = computed(() => (book.value?.currentPage ?? 0) - startPage)

let timer: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  timer = setInterval(() => (minutes.value = Math.floor((Date.now() - openedAt) / 60000)), 15000)
  if (book.value?.status === 'quiero') setStatus(book.value.id, 'leyendo')
  if (book.value && !book.value.ia) {
    try {
      const found = await findReadableEdition(book.value.id)
      if (found) {
        setReadable(book.value.id, found.ia, found.access)
        state.value = 'listo'
      } else {
        state.value = 'sin-version'
      }
    } catch {
      state.value = 'error'
    }
  }
})
onBeforeUnmount(() => clearInterval(timer))

function logPage() {
  if (!book.value || !pageInput.value) return
  logReading(book.value.id, { page: pageInput.value })
  pageInput.value = null
}

/** Al cerrar tras un rato leyendo sin registrar, pregunta hasta dónde llegaste (cierra el ciclo del hábito). */
function requestClose() {
  if (!asking.value && state.value === 'listo' && readPages.value <= 0 && Date.now() - openedAt > 60000) {
    asking.value = true
    return
  }
  emit('close')
}

function saveAndClose() {
  logPage()
  emit('close')
}

const inputCls =
  'min-w-0 bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-2 text-sm outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent'
</script>

<template>
  <div v-if="book" class="fixed inset-0 z-[55] flex flex-col bg-[#fff8f3] dark:bg-base">
    <header class="flex items-center gap-3 px-3 sm:px-5 py-2.5 border-b border-black/5 dark:border-border">
      <button type="button" class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-black/50 dark:text-muted hover:bg-black/5 dark:hover:bg-surface" title="Cerrar" @click="requestClose">
        <AppIcon name="arrow-left" :size="19" />
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-black/80 dark:text-ink truncate">{{ book.title }}</p>
        <p class="text-[11px] text-black/45 dark:text-muted truncate">
          ⏱️ {{ minutes }} min leyendo
          <template v-if="readPages > 0"> · +{{ readPages }} págs. en esta sesión 🔥</template>
        </p>
      </div>
      <a v-if="book.ia" :href="archiveUrl(book.ia)" target="_blank" rel="noopener" class="shrink-0 px-3 py-1.5 rounded-full bg-black/5 dark:bg-surface text-xs font-semibold text-black/60 dark:text-muted hover:text-black/85 dark:hover:text-ink">
        Abrir aparte ↗
      </a>
    </header>

    <div
      v-if="book.access === 'borrowable' && state === 'listo'"
      class="px-4 py-2 text-xs bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
    >
      🔐 Este libro es un <b>préstamo digital gratuito</b> de Internet Archive: necesitas una cuenta gratis en archive.org y pulsar <b>«Borrow»</b>.
      Si el inicio de sesión no funciona aquí dentro, usa <b>Abrir aparte ↗</b> y vuelve para registrar tus páginas.
    </div>

    <main class="flex-1 min-h-0 relative">
      <iframe
        v-if="state === 'listo' && book.ia"
        :src="readerUrl(book.ia)"
        :title="`Leer ${book.title}`"
        class="absolute inset-0 w-full h-full border-0 bg-white"
        allowfullscreen
      />
      <div v-else class="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
        <template v-if="state === 'buscando'">
          <span class="text-4xl animate-pulse">📖</span>
          <p class="text-sm text-black/55 dark:text-muted">Buscando una versión gratuita para leer…</p>
        </template>
        <template v-else>
          <span class="text-4xl">📕</span>
          <p class="max-w-sm text-sm text-black/65 dark:text-ink/80">
            {{ state === 'error'
              ? 'No se pudo conectar con la biblioteca en línea. Revisa tu conexión.'
              : 'Este libro no tiene una versión digital gratuita y legal (tiene derechos de autor). Puedes conseguirlo en una biblioteca o librería y seguir registrando tu avance aquí.' }}
          </p>
          <a :href="book.link" target="_blank" rel="noopener" class="text-sm font-semibold text-accent-deep hover:underline">{{ book.id.startsWith('ia:') ? 'Ver en Internet Archive ↗' : 'Ver ediciones en Open Library ↗' }}</a>
        </template>
      </div>
    </main>

    <footer class="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-2.5 border-t border-black/5 dark:border-border">
      <span class="text-xs font-semibold text-black/60 dark:text-muted">
        Pág. {{ book.currentPage }}<template v-if="book.pages">/{{ book.pages }}</template>
      </span>
      <div v-if="book.pages" class="w-16 h-1.5 rounded-full bg-black/10 dark:bg-surface overflow-hidden">
        <div class="h-full bg-emerald-500" :style="{ width: `${(book.currentPage / book.pages) * 100}%` }" />
      </div>
      <span class="flex-1" />
      <template v-if="book.status !== 'leido'">
        <button v-for="n in [5, 10]" :key="n" type="button" class="px-2.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25" @click="logReading(book.id, { addPages: n })">
          +{{ n }}
        </button>
        <form class="flex gap-1.5" @submit.prevent="logPage">
          <input v-model.number="pageInput" type="number" :min="book.currentPage + 1" placeholder="Voy en la pág…" :class="[inputCls, 'w-32 !py-1.5']" />
          <button type="submit" class="px-3 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">✓</button>
        </form>
      </template>
      <span v-else class="text-xs font-semibold text-emerald-600">🎓 ¡Terminado!</span>
    </footer>

    <!-- Cierre del ciclo: registrar el avance antes de salir -->
    <div v-if="asking" class="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
      <form class="w-full max-w-xs bg-[#fff8f3] dark:bg-surface rounded-[22px] p-5 flex flex-col gap-3" @submit.prevent="saveAndClose">
        <p class="font-bold text-black/80 dark:text-ink">¡Buena sesión! ⏱️ {{ minutes }} min</p>
        <p class="text-sm text-black/55 dark:text-muted">¿Hasta qué página llegaste? Así sumas XP y mantienes tu racha 🔥</p>
        <input v-model.number="pageInput" type="number" :min="book.currentPage + 1" autofocus :placeholder="`Ibas en la ${book.currentPage}`" :class="inputCls" />
        <div class="flex gap-2 justify-end">
          <button type="button" class="px-3 py-2 text-sm text-black/50 dark:text-muted" @click="emit('close')">Ahora no</button>
          <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>
