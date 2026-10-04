<script setup lang="ts">
import type { CollectionItem, CollectionItemInput, CollectionKind } from '~/composables/useCollections'
import { COLLECTION_KINDS, COLLECTION_MILESTONES, MUSEUM_FIELDS, RATING_REACTIONS } from '~/composables/useCollections'
import { imageFileToDataUrl } from '~/utils/imageFile'
import { youtubeId, youtubeThumbnail } from '~/utils/youtube'

/** Asistente tipo juego para agregar (o editar) un elemento: una pregunta por pantalla y una tarjeta que se arma en vivo. */
const props = defineProps<{ collectionId: string; item?: CollectionItem | null; /** Sala inicial (museo). */ category?: string }>()
const emit = defineEmits<{ close: [] }>()

const { getCollection, addItem, updateItem } = useCollections()
const { play } = useSound()
const { burstFromEl, celebrate } = useConfetti()

const collection = getCollection(props.collectionId)
const kind = computed<CollectionKind>(() => collection.value?.kind ?? 'otro')
const kindInfo = computed(() => COLLECTION_KINDS[kind.value])
const isEdit = computed(() => !!props.item)

const COPY: Record<CollectionKind, { title: string; placeholder: string; creator: string; rate: string; when: string }> = {
  libros: { title: '¿Qué libro terminaste?', placeholder: 'p. ej. Cien años de soledad', creator: '¿Quién lo escribió?', rate: '¿Qué tal estuvo la lectura?', when: '¿Cuándo lo terminaste?' },
  peliculas: { title: '¿Qué película viste?', placeholder: 'p. ej. El viaje de Chihiro', creator: '¿Quién la dirigió?', rate: '¿Qué tal estuvo la peli?', when: '¿Cuándo la viste?' },
  series: { title: '¿Qué serie viste?', placeholder: 'p. ej. Dark', creator: '¿Dónde la viste o quién la creó?', rate: '¿Qué tal estuvo la serie?', when: '¿Cuándo la terminaste?' },
  musica: { title: '¿Qué canción o álbum?', placeholder: 'p. ej. Un Verano Sin Ti', creator: '¿De qué artista?', rate: '¿Qué tanto te gusta?', when: '¿Cuándo la descubriste?' },
  museo: { title: '¿Qué pieza vas a exhibir?', placeholder: 'p. ej. Yankees Serie Mundial 2009', creator: '¿De qué marca es?', rate: '¿Qué tan joya es?', when: '¿Cuándo llegó a tu colección?' },
  otro: { title: '¿Qué quieres guardar?', placeholder: 'Ponle un nombre', creator: 'Algún detalle extra', rate: '¿Qué tal estuvo?', when: '¿Cuándo fue?' },
}
const museum = computed(() => (kind.value === 'museo' ? (collection.value?.museum ?? null) : null))
const copy = computed(() =>
  museum.value ? { ...COPY.museo, title: `¿Qué ${museum.value.pieceLabel} vas a exhibir?` } : COPY[kind.value],
)
const pieceEmoji = computed(() => museum.value?.pieceEmoji ?? kindInfo.value.emoji)

const NOTE_PROMPTS_DEFAULT = ['Mi parte favorita fue… ', 'Me hizo sentir… ', 'Se lo recomendaría a… ', 'Frase que me quedó: “', 'Personaje favorito: ', 'Lo que no me gustó: ']
const NOTE_PROMPTS_MUSEO = ['La conseguí cuando… ', 'Me la regaló… ', 'La usé en… ', 'Es especial porque… ', 'Nunca la presto porque… ']
const NOTE_PROMPTS = computed(() => (museum.value ? NOTE_PROMPTS_MUSEO : NOTE_PROMPTS_DEFAULT))

type StepId = 'titulo' | 'sala' | 'portada' | 'ficha' | 'calificacion' | 'momento' | 'notas'
const BASE_STEPS: { id: StepId; emoji: string; label: string }[] = [
  { id: 'titulo', emoji: '✏️', label: 'Título' },
  { id: 'portada', emoji: '🎨', label: 'Portada' },
  { id: 'calificacion', emoji: '⭐', label: 'Reacción' },
  { id: 'momento', emoji: '📅', label: 'Cuándo' },
  { id: 'notas', emoji: '💭', label: 'Notas' },
]
// En el museo se pregunta además la sala y la ficha técnica.
const STEPS = computed(() => {
  if (!museum.value) return BASE_STEPS
  const steps: { id: StepId; emoji: string; label: string }[] = [{ id: 'titulo', emoji: '✏️', label: 'Pieza' }]
  if (museum.value.categories.length) steps.push({ id: 'sala', emoji: '🗂️', label: 'Sala' })
  steps.push({ id: 'portada', emoji: '📸', label: 'Foto' })
  if (museum.value.fields.length) steps.push({ id: 'ficha', emoji: '📋', label: 'Ficha' })
  steps.push({ id: 'calificacion', emoji: '🏆', label: 'Qué tan joya' }, { id: 'momento', emoji: '📅', label: 'Cuándo' }, { id: 'notas', emoji: '📜', label: 'Historia' })
  return steps
})
const museumFields = computed(() => MUSEUM_FIELDS.filter((f) => museum.value?.fields.includes(f.id)))

// --- Estado del elemento ---
const title = ref(props.item?.title ?? '')
const creator = ref(props.item?.creator ?? '')
const image = ref<string | null>(props.item?.image ?? null)
const link = ref(props.item?.link ?? '')
const rating = ref(props.item?.rating ?? 0)
const finishedAt = ref(props.item?.finishedAt ?? '')
const notes = ref(props.item?.notes ?? '')
const category = ref(props.item?.category ?? props.category ?? '')
const details = ref<Record<string, string>>({ ...(props.item?.details ?? {}) })
const roomName = computed(() => museum.value?.categories.find((c) => c.id === category.value)?.name ?? '')

const videoId = computed(() => youtubeId(link.value))
const cover = computed(() => image.value ?? (videoId.value ? youtubeThumbnail(videoId.value) : null))

// --- Navegación ---
const step = ref(0)
const direction = ref<1 | -1>(1)
const maxVisited = ref(isEdit.value ? STEPS.value.length - 1 : 0)
const done = ref(false)
const shake = ref(false)
const saveError = ref('')
const savedCount = ref(0)

const stepId = computed(() => STEPS.value[step.value]!.id)
const isLast = computed(() => step.value === STEPS.value.length - 1)
const stepIsEmpty = computed(() => {
  switch (stepId.value) {
    case 'portada':
      return !image.value && !link.value.trim()
    case 'sala':
      return !category.value
    case 'ficha':
      return !museumFields.value.some((f) => details.value[f.id]?.trim())
    case 'calificacion':
      return !rating.value
    case 'momento':
      return !finishedAt.value
    case 'notas':
      return !notes.value.trim()
    default:
      return false
  }
})

function goTo(i: number) {
  if (i === step.value || i < 0 || i >= STEPS.value.length) return
  if (i > 0 && !title.value.trim()) return nudgeTitle()
  direction.value = i > step.value ? 1 : -1
  step.value = i
  maxVisited.value = Math.max(maxVisited.value, i)
  play('pop')
}

function nudgeTitle() {
  step.value = 0
  shake.value = false
  requestAnimationFrame(() => (shake.value = true))
  play('ouch')
}

function next() {
  if (isLast.value) return save()
  goTo(step.value + 1)
}

// --- Portada: subir, arrastrar, pegar ---
const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const imageError = ref('')
const showImageUrl = ref(false)
const imageUrl = ref('')

async function setImageFile(file: File) {
  imageError.value = ''
  try {
    image.value = await imageFileToDataUrl(file, 600, 0.8)
    play('sparkle')
  } catch (err) {
    imageError.value = err instanceof Error ? err.message : 'No se pudo cargar la imagen'
  }
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) setImageFile(file)
}

/** Un texto soltado o pegado: si es YouTube va al enlace; si parece imagen, a la portada. */
function takeUrl(text: string) {
  const url = text.trim()
  if (!/^https?:\/\//i.test(url)) return false
  if (youtubeId(url)) {
    link.value = url
    play('sparkle')
  } else if (/\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(url)) {
    image.value = url
    play('sparkle')
  } else {
    link.value = url
  }
  return true
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = Array.from(e.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'))
  if (file) return setImageFile(file)
  const text = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain')
  if (text) takeUrl(text.split('\n')[0]!)
}

function applyImageUrl() {
  const url = imageUrl.value.trim()
  if (!/^https?:\/\//i.test(url)) {
    imageError.value = 'Pega un enlace que empiece por http:// o https://'
    return
  }
  imageError.value = ''
  image.value = url
  imageUrl.value = ''
  showImageUrl.value = false
  play('sparkle')
}

function onPaste(e: ClipboardEvent) {
  if (done.value) return
  const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
  if (file) {
    e.preventDefault()
    setImageFile(file)
    return
  }
  // El texto pegado dentro de un campo se queda en el campo.
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea')) return
  const text = e.clipboardData?.getData('text')
  if (text && takeUrl(text)) e.preventDefault()
}

// --- Calificación ---
const reactionButtons = ref<HTMLElement[]>([])
function rate(n: number) {
  rating.value = rating.value === n ? 0 : n
  if (!rating.value) return
  play(n === 5 ? 'levelup' : n >= 4 ? 'chime' : 'ding')
  if (n >= 4) burstFromEl(reactionButtons.value[n - 1], undefined, n === 5 ? 22 : 12)
}

// --- Cuándo ---
function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const WHEN_CHIPS = [
  { emoji: '☀️', label: 'Hoy', days: 0 },
  { emoji: '🌙', label: 'Ayer', days: 1 },
  { emoji: '📆', label: 'Hace una semana', days: 7 },
  { emoji: '🗓️', label: 'Hace un mes', days: 30 },
]
const showDateInput = ref(false)
const activeChip = computed(() => WHEN_CHIPS.findIndex((c) => isoDaysAgo(c.days) === finishedAt.value))
const formattedDate = computed(() => {
  if (!finishedAt.value) return ''
  const d = new Date(`${finishedAt.value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})
function pickDays(days: number) {
  finishedAt.value = isoDaysAgo(days)
  showDateInput.value = false
  play('ding')
}

// --- Notas ---
const notesInput = ref<HTMLTextAreaElement | null>(null)
function addPrompt(p: string) {
  notes.value = `${notes.value.trim() ? `${notes.value.trimEnd()}\n` : ''}${p}`
  play('pop')
  nextTick(() => {
    const el = notesInput.value
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  })
}

// --- Guardar ---
const milestone = computed(() => COLLECTION_MILESTONES[savedCount.value] ?? null)

function save() {
  if (!title.value.trim()) return nudgeTitle()
  const input: CollectionItemInput = {
    title: title.value,
    creator: creator.value,
    image: image.value,
    link: link.value,
    rating: rating.value,
    notes: notes.value,
    finishedAt: finishedAt.value,
    category: category.value,
    details: details.value,
  }
  const ok = props.item ? updateItem(props.collectionId, props.item.id, input) : addItem(props.collectionId, input)
  if (!ok) {
    saveError.value = 'No hay espacio para guardar. Prueba con una imagen más pequeña o un enlace de imagen.'
    play('ouch')
    return
  }
  if (props.item) {
    play('chime')
    emit('close')
    return
  }
  savedCount.value = collection.value?.items.length ?? 0
  done.value = true
  play(milestone.value ? 'levelup' : 'coin')
  celebrate()
}

function addAnother() {
  title.value = ''
  creator.value = ''
  image.value = null
  link.value = ''
  rating.value = 0
  finishedAt.value = ''
  notes.value = ''
  details.value = {}
  saveError.value = ''
  showDateInput.value = false
  direction.value = 1
  step.value = 0
  maxVisited.value = 0
  done.value = false
  play('pop')
}

// --- Teclado ---
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') return emit('close')
  if (done.value) return
  const inField = !!(e.target as HTMLElement | null)?.closest('input, textarea, select')
  if (!inField && stepId.value === 'calificacion' && /^[1-5]$/.test(e.key)) rate(Number(e.key))
  else if (!inField && e.key === 'ArrowRight') next()
  else if (!inField && e.key === 'ArrowLeft') goTo(step.value - 1)
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:px-4" @click.self="emit('close')">
    <div
      class="wizard relative w-full sm:max-w-3xl max-h-[94dvh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-[28px] sm:rounded-[28px] flex flex-col"
      :style="{ '--tint': collection?.color ?? '#fbe4ec' }"
    >
      <!-- Encabezado: camino de pasos -->
      <div class="flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div v-if="!done" class="flex-1 flex items-center">
          <template v-for="(s, i) in STEPS" :key="s.id">
            <button
              type="button"
              class="step-dot shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base transition-all"
              :class="[
                i === step ? 'current bg-white dark:bg-surface-soft shadow-md scale-110' : i <= maxVisited ? 'bg-white/70 dark:bg-surface-soft/70' : 'bg-black/5 dark:bg-white/5 grayscale opacity-60',
              ]"
              :disabled="i > maxVisited && !title.trim()"
              :title="s.label"
              @click="goTo(i)"
            >
              {{ s.emoji }}
            </button>
            <div v-if="i < STEPS.length - 1" class="flex-1 h-1 mx-0.5 sm:mx-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div class="h-full bg-[#f4a8c4] transition-all duration-500" :style="{ width: i < step ? '100%' : '0%' }" />
            </div>
          </template>
        </div>
        <div v-else class="flex-1" />
        <button type="button" class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-black/45 dark:text-muted hover:bg-black/5 dark:hover:bg-white/10" title="Cerrar (Esc)" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <!-- ¡Listo! -->
      <div v-if="done" class="flex flex-col items-center text-center gap-4 px-6 pb-8 pt-2">
        <div class="w-40 drop-in">
          <CollectionItemPreview :kind="kind" :title="title" :creator="creator" :cover="cover" :rating="rating" :color="collection?.color ?? '#fff'" :has-video="!!videoId" :emoji="pieceEmoji" :plaque="details.anio || roomName" />
        </div>
        <div v-if="milestone" class="milestone flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-surface-soft shadow-sm">
          <span class="text-4xl">{{ milestone.emoji }}</span>
          <div class="text-left">
            <p class="text-xs font-bold uppercase tracking-wide text-[#e07aa3]">¡Logro desbloqueado!</p>
            <p class="font-bold text-black/80 dark:text-ink">{{ milestone.title }}</p>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-black/85 dark:text-ink">
            <template v-if="museum">¡Ya está en exhibición! {{ pieceEmoji }}🏛️</template>
            <template v-else>¡Guardado en tu colección! {{ kindInfo.emoji }}</template>
          </h2>
          <p class="text-black/55 dark:text-muted mt-1">
            Ya llevas <strong class="text-black/80 dark:text-ink">{{ savedCount }}</strong> en «{{ collection?.name }}»
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2 mt-1">
          <button type="button" class="big-btn bg-[#f4a8c4] text-white hover:bg-[#ef8fb5]" @click="addAnother">➕ Agregar otro</button>
          <button type="button" class="big-btn bg-white/80 dark:bg-surface-soft text-black/70 dark:text-ink hover:bg-white" @click="emit('close')">Ver mi colección</button>
        </div>
      </div>

      <template v-else>
        <div class="grid sm:grid-cols-[200px_1fr] gap-5 sm:gap-8 px-4 sm:px-8 pt-4 pb-3 flex-1">
          <!-- Tarjeta en vivo -->
          <div class="flex justify-center sm:items-start sm:pt-6">
            <div class="w-32 sm:w-full float">
              <CollectionItemPreview
                :kind="kind"
                :title="title"
                :creator="creator"
                :cover="cover"
                :rating="rating"
                :color="collection?.color ?? '#fff'"
                :has-video="!!videoId"
                :emoji="pieceEmoji"
                :plaque="details.anio || roomName"
                tilt
              />
            </div>
          </div>

          <!-- Pregunta del paso -->
          <div class="relative min-h-[300px] sm:min-h-[340px]">
            <Transition :name="direction === 1 ? 'slide-next' : 'slide-prev'" mode="out-in">
              <div :key="stepId" class="flex flex-col gap-4">
                <p class="text-xs font-bold uppercase tracking-widest text-[#e07aa3]">Paso {{ step + 1 }} de {{ STEPS.length }}</p>

                <!-- 1. Título -->
                <template v-if="stepId === 'titulo'">
                  <h2 class="question">{{ copy.title }} {{ pieceEmoji }}</h2>
                  <input
                    v-model="title"
                    type="text"
                    autofocus
                    maxlength="120"
                    :placeholder="copy.placeholder"
                    class="big-input"
                    :class="{ shake }"
                    @animationend="shake = false"
                    @keydown.enter.prevent="next"
                  />
                  <Transition name="pop">
                    <label v-if="title.trim()" class="flex flex-col gap-1.5">
                      <span class="text-sm font-semibold text-black/55 dark:text-muted">{{ copy.creator }} <span class="font-normal opacity-70">(opcional)</span></span>
                      <input v-model="creator" type="text" maxlength="80" class="mid-input" @keydown.enter.prevent="next" />
                    </label>
                  </Transition>
                  <p class="text-xs text-black/40 dark:text-muted">Pulsa <kbd>Enter</kbd> para seguir</p>
                </template>

                <!-- Museo: sala -->
                <template v-else-if="stepId === 'sala'">
                  <h2 class="question">¿En qué sala la exhibimos? 🗂️</h2>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="c in museum?.categories ?? []"
                      :key="c.id"
                      type="button"
                      class="when-chip"
                      :class="{ active: category === c.id }"
                      @click="category = category === c.id ? '' : c.id; play('ding')"
                    >
                      <span class="text-2xl">{{ c.emoji }}</span><span class="truncate">{{ c.name }}</span>
                    </button>
                  </div>
                  <p class="text-xs text-black/40 dark:text-muted">Puedes crear o cambiar salas desde «Editar museo».</p>
                </template>

                <!-- Museo: ficha técnica -->
                <template v-else-if="stepId === 'ficha'">
                  <h2 class="question">Ficha técnica 📋</h2>
                  <div class="grid sm:grid-cols-2 gap-3">
                    <label v-for="f in museumFields" :key="f.id" class="flex flex-col gap-1">
                      <span class="text-sm font-semibold text-black/55 dark:text-muted">{{ f.emoji }} {{ f.label }}</span>
                      <input v-model="details[f.id]" type="text" maxlength="60" :placeholder="f.placeholder" class="mid-input !py-2" @keydown.enter.prevent="next" />
                    </label>
                  </div>
                </template>

                <!-- 2. Portada y enlace -->
                <template v-else-if="stepId === 'portada'">
                  <h2 class="question">{{ museum ? `Tómale una foto a tu ${museum.pieceLabel} 📸` : 'Dale una cara 🎨' }}</h2>
                  <div
                    class="dropzone rounded-2xl border-2 border-dashed p-5 flex flex-col items-center gap-3 text-center transition-all"
                    :class="dragging ? 'border-[#f4a8c4] bg-[#f4a8c4]/15 scale-[1.02]' : 'border-black/15 dark:border-white/15 bg-white/50 dark:bg-white/5'"
                    @dragover.prevent="dragging = true"
                    @dragleave="dragging = false"
                    @drop.prevent="onDrop"
                  >
                    <span class="text-4xl" :class="{ 'animate-bounce': dragging }">{{ dragging ? '🫳' : '🖼️' }}</span>
                    <p class="text-sm text-black/60 dark:text-muted">
                      Arrastra una imagen aquí, pégala con <kbd>Ctrl</kbd>+<kbd>V</kbd> o…
                    </p>
                    <div class="flex flex-wrap justify-center gap-2">
                      <button type="button" class="chip" @click="fileInput?.click()">📁 Elegir imagen</button>
                      <button type="button" class="chip" :class="{ active: showImageUrl }" @click="showImageUrl = !showImageUrl">🔗 Enlace de imagen</button>
                      <button v-if="image" type="button" class="chip" @click="image = null">🗑️ Quitar</button>
                    </div>
                    <div v-if="showImageUrl" class="flex gap-2 w-full">
                      <input v-model="imageUrl" type="url" placeholder="https://…/portada.jpg" class="mid-input flex-1 min-w-0 !py-2 text-sm" @keydown.enter.prevent="applyImageUrl" />
                      <button type="button" class="chip active" @click="applyImageUrl">Usar</button>
                    </div>
                    <p v-if="imageError" class="text-xs text-danger">{{ imageError }}</p>
                  </div>
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />

                  <label class="flex flex-col gap-1.5">
                    <span class="text-sm font-semibold text-black/60 dark:text-muted">
                      {{ museum ? '🔗 ¿Tienes un enlace o video de esta pieza?' : '🎬 ¿Tiene tráiler, video o canción en YouTube?' }}
                      <span class="font-normal opacity-70">(o cualquier enlace)</span>
                    </span>
                    <input v-model="link" type="url" placeholder="https://youtube.com/watch?v=…" class="mid-input" @keydown.enter.prevent="next" />
                  </label>
                  <Transition name="pop">
                    <p v-if="videoId" :key="videoId" class="found self-start px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                      ▶ ¡Video encontrado! Podrás verlo aquí mismo 🎉
                    </p>
                    <p v-else-if="link.trim()" class="self-start text-sm text-black/50 dark:text-muted">🔗 Enlace guardado</p>
                  </Transition>
                </template>

                <!-- 3. Reacción -->
                <template v-else-if="stepId === 'calificacion'">
                  <h2 class="question">{{ copy.rate }}</h2>
                  <div class="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                    <button
                      v-for="(r, i) in RATING_REACTIONS"
                      :key="r.label"
                      ref="reactionButtons"
                      type="button"
                      class="reaction flex flex-col items-center gap-1.5 py-3 sm:py-4 rounded-2xl transition-all"
                      :class="rating === i + 1 ? 'picked bg-white dark:bg-surface-soft shadow-lg ring-2 ring-[#f4a8c4]' : rating && rating !== i + 1 ? 'opacity-50 hover:opacity-100 bg-white/40 dark:bg-white/5' : 'bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-surface-soft'"
                      :title="`${r.label} (tecla ${i + 1})`"
                      @click="rate(i + 1)"
                    >
                      <span class="emoji text-3xl sm:text-4xl">{{ r.emoji }}</span>
                      <span class="text-[10px] sm:text-xs font-semibold text-black/60 dark:text-muted leading-tight text-center px-0.5">{{ r.label }}</span>
                    </button>
                  </div>
                  <div class="h-8 text-2xl text-center tracking-widest">
                    <span v-for="n in 5" :key="n" class="inline-block transition-all duration-300" :class="n <= rating ? 'text-amber-400 scale-110' : 'text-black/10 dark:text-white/10'" :style="{ transitionDelay: `${n * 50}ms` }">★</span>
                  </div>
                  <p class="text-xs text-black/40 dark:text-muted text-center">Usa las teclas <kbd>1</kbd>–<kbd>5</kbd> · ¿Aún no lo sabes? Puedes saltar este paso</p>
                </template>

                <!-- 4. Cuándo -->
                <template v-else-if="stepId === 'momento'">
                  <h2 class="question">{{ copy.when }}</h2>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="(c, i) in WHEN_CHIPS"
                      :key="c.label"
                      type="button"
                      class="when-chip"
                      :class="{ active: activeChip === i }"
                      @click="pickDays(c.days)"
                    >
                      <span class="text-2xl">{{ c.emoji }}</span>{{ c.label }}
                    </button>
                    <button type="button" class="when-chip" :class="{ active: showDateInput || (finishedAt && activeChip === -1) }" @click="showDateInput = true">
                      <span class="text-2xl">✏️</span>Otra fecha
                    </button>
                    <button type="button" class="when-chip" @click="finishedAt = ''; showDateInput = false">
                      <span class="text-2xl">🤷</span>No me acuerdo
                    </button>
                  </div>
                  <input v-if="showDateInput" v-model="finishedAt" type="date" class="mid-input" />
                  <Transition name="pop">
                    <p v-if="formattedDate" :key="finishedAt" class="text-sm text-black/60 dark:text-muted">📌 {{ formattedDate }}</p>
                  </Transition>
                </template>

                <!-- 5. Notas -->
                <template v-else-if="stepId === 'notas'">
                  <h2 class="question">{{ museum ? `¿Cuál es la historia de esta ${museum.pieceLabel}? 📜` : 'Cuéntale algo a tu yo del futuro ✍️' }}</h2>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="p in NOTE_PROMPTS" :key="p" type="button" class="chip !text-xs" @click="addPrompt(p)">{{ p.replace(/[ “]+$/, '') }}</button>
                  </div>
                  <textarea ref="notesInput" v-model="notes" rows="5" placeholder="Escribe lo que quieras recordar…" class="paper" />
                </template>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Pie -->
        <div class="sticky bottom-0 flex items-center gap-2 px-4 sm:px-8 py-4 wizard-footer">
          <button v-if="step > 0" type="button" class="big-btn bg-white/60 dark:bg-white/10 text-black/60 dark:text-ink hover:bg-white" @click="goTo(step - 1)">← Atrás</button>
          <p v-if="saveError" class="text-xs text-danger flex-1">{{ saveError }}</p>
          <div v-else class="flex-1" />
          <button v-if="isEdit && !isLast" type="button" class="big-btn bg-white/60 dark:bg-white/10 text-black/70 dark:text-ink hover:bg-white" @click="save">Guardar</button>
          <button type="button" class="big-btn next-btn bg-[#f4a8c4] text-white hover:bg-[#ef8fb5]" :class="{ ready: !stepIsEmpty || isLast }" @click="next">
            <template v-if="isLast">{{ isEdit ? '💾 Guardar cambios' : museum ? '🏛️ ¡A la vitrina!' : '✨ ¡A la colección!' }}</template>
            <template v-else-if="stepIsEmpty && step > 0">Saltar →</template>
            <template v-else>Siguiente →</template>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.wizard {
  background:
    radial-gradient(circle at 15% 10%, color-mix(in srgb, var(--tint) 90%, white) 0%, transparent 55%),
    radial-gradient(circle at 90% 90%, #fef6e7 0%, transparent 50%),
    #fff8f3;
}
:global(.dark) .wizard {
  background:
    radial-gradient(circle at 15% 10%, color-mix(in srgb, var(--tint) 14%, transparent) 0%, transparent 55%),
    #1a1a1f;
}
.wizard-footer {
  background: linear-gradient(to top, #fff8f3 70%, transparent);
}
:global(.dark) .wizard-footer {
  background: linear-gradient(to top, #1a1a1f 70%, transparent);
}

.question {
  font-size: clamp(1.4rem, 3.5vw, 1.9rem);
  font-weight: 800;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.82);
}
:global(.dark) .question {
  color: rgb(var(--c-ink));
}

.big-input {
  width: 100%;
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  font-weight: 700;
  background: transparent;
  border: none;
  border-bottom: 3px dashed rgba(0, 0, 0, 0.15);
  padding: 6px 2px 10px;
  outline: none;
  color: rgba(0, 0, 0, 0.85);
  transition: border-color 0.2s;
}
.big-input:focus {
  border-bottom-color: #f4a8c4;
  border-bottom-style: solid;
}
.big-input::placeholder {
  color: rgba(0, 0, 0, 0.25);
}
:global(.dark) .big-input {
  color: #f0f0f5;
  border-bottom-color: rgba(255, 255, 255, 0.15);
}
:global(.dark) .big-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.mid-input {
  background: rgba(255, 255, 255, 0.85);
  color: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  padding: 10px 14px;
  outline: none;
}
.mid-input:focus {
  border-color: #f4a8c4;
}
:global(.dark) .mid-input {
  background: rgba(255, 255, 255, 0.06);
  color: #f0f0f5;
  border-color: rgba(255, 255, 255, 0.12);
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.85);
  color: rgba(0, 0, 0, 0.65);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s, background 0.15s;
}
.chip:hover {
  transform: translateY(-2px);
}
.chip.active {
  background: #f4a8c4;
  color: white;
}
:global(.dark) .chip:not(.active) {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}

.when-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 14px;
  text-align: left;
  background: rgba(255, 255, 255, 0.6);
  color: rgba(0, 0, 0, 0.65);
  transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
}
.when-chip:hover {
  transform: translateY(-2px);
  background: white;
}
.when-chip.active {
  background: white;
  box-shadow: 0 0 0 2px #f4a8c4, 0 6px 14px rgba(0, 0, 0, 0.1);
}
:global(.dark) .when-chip {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}
:global(.dark) .when-chip.active,
:global(.dark) .when-chip:hover {
  background: rgba(255, 255, 255, 0.12);
}

.paper {
  width: 100%;
  resize: none;
  outline: none;
  font-family: 'Patrick Hand', cursive;
  font-size: 19px;
  line-height: 30px;
  padding: 4px 16px 4px 44px;
  border-radius: 14px;
  color: rgba(0, 0, 0, 0.75);
  background:
    linear-gradient(90deg, transparent 32px, rgba(244, 168, 196, 0.6) 32px 34px, transparent 34px),
    repeating-linear-gradient(to bottom, #fffdf6 0 29px, rgba(120, 160, 220, 0.35) 29px 30px);
  background-attachment: local;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.big-btn {
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.big-btn:active {
  transform: scale(0.94);
}
.next-btn.ready {
  box-shadow: 0 6px 16px rgba(244, 168, 196, 0.55);
  animation: nudge 2.4s ease-in-out infinite;
}

kbd {
  font-family: inherit;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.07);
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
}

.step-dot.current {
  animation: pulse 1.8s ease-in-out infinite;
}
.reaction:hover .emoji {
  animation: wiggle 0.5s ease-in-out;
}
.reaction.picked .emoji {
  animation: jump 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.shake {
  animation: shake 0.4s;
}
.float {
  animation: float 4s ease-in-out infinite;
}
.drop-in {
  animation: drop-in 0.7s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.milestone {
  animation: jump 0.6s 0.3s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-next-enter-from,
.slide-prev-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
.slide-next-leave-to,
.slide-prev-enter-from {
  transform: translateX(-40px);
  opacity: 0;
}
.pop-enter-active {
  animation: jump 0.4s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.pop-leave-active {
  transition: opacity 0.15s;
}
.pop-leave-to {
  opacity: 0;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(244, 168, 196, 0.6);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(244, 168, 196, 0);
  }
}
@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-14deg) scale(1.15);
  }
  75% {
    transform: rotate(14deg) scale(1.15);
  }
}
@keyframes jump {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-8px);
  }
  40%,
  80% {
    transform: translateX(8px);
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes nudge {
  0%,
  85%,
  100% {
    transform: translateX(0);
  }
  90% {
    transform: translateX(4px);
  }
  95% {
    transform: translateX(-2px);
  }
}
@keyframes drop-in {
  0% {
    transform: translateY(-120px) rotate(-12deg) scale(0.6);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .float,
  .next-btn.ready,
  .step-dot.current,
  .drop-in,
  .milestone {
    animation: none;
  }
}
</style>
