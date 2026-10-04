<script setup lang="ts">
import { COLLECTION_KINDS, MUSEUM_FIELDS, RATING_REACTIONS, itemBoardScope } from '~/composables/useCollections'
import { CARD_THEME_GROUPS, CARD_THEMES, cardThemeVars, getCardTheme, type CardTheme } from '~/utils/cardThemes'
import { youtubeEmbedUrl, youtubeId, youtubeThumbnail } from '~/utils/youtube'

/** Ficha inmersiva de un elemento: tarjeta que se voltea, reacción editable, modo cine, estilos y navegación entre elementos. */
const props = defineProps<{ collectionId: string; itemId: string; itemIds: string[] }>()
const emit = defineEmits<{ close: []; edit: [id: string]; delete: [id: string]; navigate: [id: string] }>()

const { getCollection, updateItem, setItemTheme, setCollectionTheme } = useCollections()
const { play } = useSound()
const { burstFromEl } = useConfetti()

const collection = getCollection(props.collectionId)
const item = computed(() => collection.value?.items.find((i) => i.id === props.itemId) ?? null)
const kind = computed(() => collection.value?.kind ?? 'otro')
const kindInfo = computed(() => COLLECTION_KINDS[kind.value])

// --- Museo: sala y ficha técnica ---
const museumRoom = computed(() => collection.value?.museum?.categories.find((c) => c.id === item.value?.category) ?? null)
const museumDetails = computed(() => MUSEUM_FIELDS.filter((f) => item.value?.details[f.id]).map((f) => ({ ...f, value: item.value!.details[f.id]! })))

const videoId = computed(() => youtubeId(item.value?.link))
const cover = computed(() => item.value?.image ?? (videoId.value ? youtubeThumbnail(videoId.value) : null))
const playLabel = computed(() => ({ peliculas: 'Ver tráiler', series: 'Ver tráiler', musica: 'Escuchar', libros: 'Ver video', museo: 'Ver video', otro: 'Ver video' })[kind.value])

// --- Estilo de la ficha ---
const theme = computed(() => getCardTheme(item.value?.theme ?? collection.value?.cardTheme, kind.value))
const themeStyle = computed(() => cardThemeVars(theme.value, collection.value?.color ?? '#fbe4ec'))
const showThemes = ref(false)
const collectionTheme = computed(() => getCardTheme(collection.value?.cardTheme, kind.value))
const hasOverrides = computed(() => collection.value?.items.some((i) => i.theme) ?? false)

function pickTheme(t: CardTheme) {
  if (!item.value) return
  // Elegir el mismo estilo que ya tiene la colección quita el estilo propio.
  setItemTheme(props.collectionId, item.value.id, t.id === collectionTheme.value.id ? null : t.id)
  play('sparkle')
}

function applyToCollection() {
  setCollectionTheme(props.collectionId, theme.value.id)
  play('chime')
}

const themeGroup = ref('todos')
const visibleThemes = computed(() => {
  const group = CARD_THEME_GROUPS.find((g) => g.id === themeGroup.value)
  return group ? CARD_THEMES.filter((t) => group.ids.includes(t.id)) : CARD_THEMES
})

const swatchBg = (t: CardTheme) => (t.pattern ? `${t.pattern}, ${t.bg}` : t.bg)

// Partículas que caen: posiciones fijas por estilo para que no salten al re-renderizar.
const particles = computed(() => {
  const list = theme.value.particles
  if (!list?.length) return []
  return Array.from({ length: 12 }, (_, i) => ({
    emoji: list[i % list.length]!,
    left: (i * 37 + 11) % 100,
    delay: -((i * 1.7) % 12),
    duration: 9 + ((i * 3) % 7),
    size: 14 + ((i * 5) % 12),
  }))
})

const PAPEL_COLORS = ['#e6007e', '#ff8c00', '#ffd400', '#00a650', '#00a6a6', '#7b3fa0', '#e6007e', '#ff8c00']

// --- Navegación entre elementos ---
const index = computed(() => props.itemIds.indexOf(props.itemId))
const direction = ref<1 | -1>(1)
function go(delta: 1 | -1) {
  const id = props.itemIds[index.value + delta]
  if (!id) return
  direction.value = delta
  flipped.value = false
  cinema.value = false
  play('pop')
  emit('navigate', id)
}

let touchX: number | null = null
function onTouchStart(e: TouchEvent) {
  touchX = (e.target as HTMLElement).closest('.theme-strip') ? null : (e.touches[0]?.clientX ?? null)
}
function onTouchEnd(e: TouchEvent) {
  if (touchX === null || cinema.value) return
  const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX
  touchX = null
  if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1)
}

// --- Tarjeta que se voltea ---
const flipped = ref(false)
function flip() {
  flipped.value = !flipped.value
  play('pop')
}

// --- Reacción editable al instante ---
const reactionButtons = ref<HTMLElement[]>([])
function rate(n: number) {
  const it = item.value
  if (!it) return
  const rating = it.rating === n ? 0 : n
  updateItem(props.collectionId, it.id, { ...it, rating })
  if (!rating) return
  play(n === 5 ? 'levelup' : n >= 4 ? 'chime' : 'ding')
  if (n >= 4) burstFromEl(reactionButtons.value[n - 1], undefined, n === 5 ? 20 : 10)
}
const reaction = computed(() => (item.value?.rating ? RATING_REACTIONS[item.value.rating - 1] : null))

// --- Datos curiosos ---
const finished = computed(() => {
  if (!item.value?.finishedAt) return null
  const d = new Date(`${item.value.finishedAt}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((d.getTime() - today.getTime()) / 86400000)
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  const rel =
    Math.abs(days) < 30 ? rtf.format(days, 'day') : Math.abs(days) < 365 ? rtf.format(Math.round(days / 30), 'month') : rtf.format(Math.round(days / 365), 'year')
  return { date: d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }), rel }
})

const favorites = computed(() => collection.value?.items.filter((i) => i.rating === 5).length ?? 0)
const position = computed(() => {
  const all = collection.value?.items ?? []
  // Los elementos se guardan del más nuevo al más viejo: el #1 es el primero que se agregó.
  const i = all.findIndex((x) => x.id === props.itemId)
  return i === -1 ? 0 : all.length - i
})

const linkHost = computed(() => {
  try {
    return new URL(item.value?.link ?? '').hostname.replace(/^www\./, '')
  } catch {
    return item.value?.link ?? ''
  }
})

// --- Tablero propio (muro de investigación) ---
const boardScope = computed(() => itemBoardScope(props.itemId))
const wallLabel = computed(
  () => ({ libros: 'Muro de teorías', peliculas: 'Muro de investigación', series: 'Muro de pistas', musica: 'Muro de inspiración', museo: 'Muro de la historia', otro: 'Muro de ideas' })[kind.value],
)
const boardOpen = ref(false)
const boardOrigin = ref<DOMRect | null>(null)
function openBoard(rect: DOMRect) {
  boardOrigin.value = rect
  boardOpen.value = true
}

// --- Modo cine ---
const cinema = ref(false)
function openCinema() {
  cinema.value = true
  play('sparkle')
}

function onDelete() {
  if (!item.value || !confirm(`¿Eliminar "${item.value.title}" de la colección?`)) return
  emit('delete', item.value.id)
}

function onKey(e: KeyboardEvent) {
  // Dentro del tablero las teclas son del tablero.
  if (boardOpen.value) return
  if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return
  if (e.key === 'Escape') {
    if (cinema.value) cinema.value = false
    else if (showThemes.value) showThemes.value = false
    else emit('close')
  } else if (cinema.value) return
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === ' ' || e.key.toLowerCase() === 'f') {
    e.preventDefault()
    flip()
  } else if (e.key.toLowerCase() === 'e') showThemes.value = !showThemes.value
  else if (/^[1-5]$/.test(e.key)) rate(Number(e.key))
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(item, (it) => {
  if (!it) emit('close')
})
</script>

<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:px-4" @click.self="emit('close')">
    <div
      v-if="item"
      class="detail relative w-full sm:max-w-4xl h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
      :style="themeStyle"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Fondo: la portada difuminada + capa del estilo -->
      <Transition name="fade">
        <img v-if="cover" :key="cover" :src="cover" alt="" class="backdrop-img" aria-hidden="true" />
      </Transition>
      <div class="backdrop-shade" aria-hidden="true" />

      <!-- Partículas que caen -->
      <div v-if="particles.length" :key="theme.id" class="absolute inset-0 overflow-hidden pointer-events-none z-[5]" aria-hidden="true">
        <span
          v-for="(p, i) in particles"
          :key="i"
          class="particle"
          :class="{ rise: theme.rise }"
          :style="{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, fontSize: `${p.size}px` }"
        >{{ p.emoji }}</span>
      </div>

      <!-- Adornos de las esquinas -->
      <template v-if="theme.corners">
        <span class="corner left-3 sm:left-5" aria-hidden="true">{{ theme.corners[0] }}</span>
        <span class="corner right-3 sm:right-5 [animation-delay:-2s]" aria-hidden="true">{{ theme.corners[1] }}</span>
      </template>

      <!-- Flechas laterales -->
      <button v-if="index > 0" type="button" class="nav-arrow left-2" title="Anterior (←)" @click="go(-1)">‹</button>
      <button v-if="index < itemIds.length - 1" type="button" class="nav-arrow right-2" title="Siguiente (→)" @click="go(1)">›</button>

      <div class="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <!-- Adorno colgante del estilo -->
        <div v-if="theme.banner === 'faroles'" class="flex justify-around px-16 h-14 pointer-events-none" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="lantern" :style="{ animationDelay: `${-n * 0.6}s`, height: `${30 + (n % 3) * 10}px` }">🏮</span>
        </div>
        <div v-else-if="theme.banner === 'papel-picado' || theme.banner === 'banderines'" class="papel" :class="{ prayer: theme.banner === 'banderines' }" aria-hidden="true">
          <span
            v-for="(c, i) in theme.bannerColors ?? PAPEL_COLORS"
            :key="i"
            class="papel-flag"
            :style="{ backgroundColor: c, animationDelay: `${-i * 0.4}s` }"
          />
        </div>
        <div v-else-if="theme.banner === 'noren'" class="flex justify-center gap-1 px-24 pointer-events-none" aria-hidden="true">
          <span v-for="n in 4" :key="n" class="noren" :style="{ animationDelay: `${-n * 0.5}s` }">{{ n === 2 ? '映' : n === 3 ? '画' : '' }}</span>
        </div>

        <!-- Barra superior -->
        <div class="flex items-center gap-2 px-4 sm:px-6 pt-4">
          <span class="chip px-3 py-1 rounded-full text-xs font-semibold">{{ kindInfo.emoji }} {{ collection?.name }}</span>
          <span v-if="itemIds.length > 1" class="muted text-xs tabular-nums">{{ index + 1 }} / {{ itemIds.length }}</span>
          <div class="flex-1" />
          <button type="button" class="icon-btn" :class="{ active: showThemes }" title="Cambiar estilo (E)" @click="showThemes = !showThemes"><AppIcon name="palette" :size="17" /></button>
          <button type="button" class="icon-btn" title="Editar" @click="emit('edit', item.id)"><AppIcon name="edit" :size="17" /></button>
          <button type="button" class="icon-btn hover:!bg-rose-500/40" title="Eliminar" @click="onDelete"><AppIcon name="trash" :size="17" /></button>
          <button type="button" class="icon-btn" title="Cerrar (Esc)" @click="emit('close')"><AppIcon name="x" :size="18" /></button>
        </div>

        <Transition :name="direction === 1 ? 'slide-next' : 'slide-prev'" mode="out-in">
          <div :key="item.id" class="grid sm:grid-cols-[230px_1fr] gap-6 sm:gap-10 px-5 sm:px-14 pt-5 pb-16">
            <!-- Tarjeta que se voltea -->
            <div class="flex flex-col items-center gap-2">
              <button type="button" class="flip-scene w-40 sm:w-full" :title="flipped ? 'Ver portada' : 'Ver el reverso'" @click="flip">
                <div class="flip-inner" :class="{ flipped }">
                  <div class="flip-face">
                    <CollectionItemPreview
                      :kind="kind"
                      :title="item.title"
                      :creator="item.creator"
                      :cover="cover"
                      :rating="item.rating"
                      :color="collection?.color ?? '#fff'"
                      :has-video="!!videoId"
                      :emoji="collection?.museum?.pieceEmoji"
                      :plaque="item.details.anio || museumRoom?.name"
                    />
                  </div>
                  <div class="flip-face flip-back" :style="{ backgroundColor: collection?.color }">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-black/40">Reverso</p>
                    <p class="font-bold text-black/80 leading-tight line-clamp-2 text-sm">{{ item.title }}</p>
                    <div class="back-paper">
                      <p v-if="item.notes" class="whitespace-pre-wrap">{{ item.notes }}</p>
                      <p v-else class="text-black/40">Aún no hay notas… ¡edítalo y escribe algo para tu yo del futuro! ✍️</p>
                    </div>
                    <p class="text-[10px] text-black/45 text-center">#{{ position }} de la colección</p>
                  </div>
                </div>
              </button>
              <p class="muted text-[11px]">↻ Toca la tarjeta para darle la vuelta</p>
            </div>

            <!-- Información -->
            <div class="flex flex-col gap-4 min-w-0">
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                  <h2 class="detail-title">{{ item.title }}</h2>
                  <p v-if="item.creator" class="muted mt-1">{{ item.creator }}</p>
                </div>
                <span v-if="theme.seal" class="seal" aria-hidden="true">{{ theme.seal }}</span>
              </div>

              <!-- Reacción editable -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1 sm:gap-1.5">
                  <button
                    v-for="(r, i) in RATING_REACTIONS"
                    :key="r.label"
                    ref="reactionButtons"
                    type="button"
                    class="reaction w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl transition-all"
                    :class="item.rating === i + 1 ? 'picked scale-110' : 'grayscale-[60%] hover:grayscale-0 opacity-70 hover:opacity-100'"
                    :title="`${r.label} (tecla ${i + 1})`"
                    @click="rate(i + 1)"
                  >
                    <span class="emoji">{{ r.emoji }}</span>
                  </button>
                </div>
                <p class="text-sm h-5">
                  <template v-if="reaction">
                    <span class="text-amber-400 tracking-wider">{{ '★'.repeat(item.rating) }}</span><span class="muted opacity-40 tracking-wider">{{ '★'.repeat(5 - item.rating) }}</span>
                    <span class="ml-2 font-semibold">{{ reaction.label }}</span>
                  </template>
                  <span v-else class="muted">¿Qué te pareció? Toca una reacción</span>
                </p>
              </div>

              <!-- Ficha técnica del museo -->
              <div v-if="kind === 'museo' && (museumRoom || museumDetails.length)" class="museum-sheet">
                <p v-if="museumRoom" class="text-xs font-bold uppercase tracking-widest" :style="{ color: 'var(--accent)' }">
                  {{ museumRoom.emoji }} Sala {{ museumRoom.name }}
                </p>
                <dl v-if="museumDetails.length" class="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                  <div v-for="d in museumDetails" :key="d.id" class="min-w-0">
                    <dt class="muted text-[11px]">{{ d.emoji }} {{ d.label }}</dt>
                    <dd class="font-semibold truncate" :title="d.value">{{ d.value }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Datos -->
              <div class="flex flex-wrap gap-2">
                <span v-if="finished" class="fact" :title="finished.date">📅 {{ finished.rel }} · {{ finished.date }}</span>
                <span v-if="item.rating === 5" class="fact">💖 Uno de tus {{ favorites }} favorito{{ favorites === 1 ? '' : 's' }}</span>
                <span class="fact">🏷️ #{{ position }} en tu colección</span>
                <a v-if="item.link && !videoId" :href="item.link" target="_blank" rel="noopener noreferrer" class="fact hover:brightness-110">🔗 {{ linkHost }}</a>
              </div>

              <!-- Video -->
              <button v-if="videoId" type="button" class="play-card group" @click="openCinema">
                <img :src="youtubeThumbnail(videoId)" alt="" class="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                <span class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                <span class="relative flex items-center gap-3 text-white">
                  <span class="play-btn">▶</span>
                  <span class="text-left">
                    <span class="block font-bold text-lg">{{ playLabel }}</span>
                    <span class="block text-xs text-white/70">Modo cine · YouTube</span>
                  </span>
                </span>
              </button>

              <!-- Nota -->
              <div v-if="item.notes" class="sticky-note">
                <span class="tape" />
                <p class="whitespace-pre-wrap">{{ item.notes }}</p>
              </div>
              <button v-else type="button" class="add-note self-start text-sm px-4 py-2.5 rounded-2xl border-2 border-dashed transition-colors" @click="emit('edit', item.id)">
                ✍️ Agregar una nota
              </button>
            </div>

            <!-- Muro de investigación: entrada al tablero propio -->
            <CollectionResearchWall
              class="sm:col-span-2 mt-2"
              :scope="boardScope"
              :title="item.title"
              :cover="cover"
              :label="wallLabel"
              :default-color="theme.bg"
              @enter="openBoard"
            />
          </div>
        </Transition>

        <p class="muted hidden sm:block text-center text-[11px] opacity-70 pb-4 -mt-8">
          <kbd>←</kbd> <kbd>→</kbd> navegar · <kbd>F</kbd> voltear · <kbd>1</kbd>–<kbd>5</kbd> reaccionar · <kbd>E</kbd> estilos · <kbd>Esc</kbd> cerrar
        </p>
      </div>

      <!-- Selector de estilos -->
      <Transition name="drawer">
        <div v-if="showThemes" class="theme-drawer relative z-20 shrink-0 px-4 sm:px-6 pt-3 pb-4">
          <div class="flex items-center gap-2 mb-2.5">
            <p class="font-bold text-sm">🎨 Estilos de ficha</p>
            <span class="muted text-xs truncate">· {{ theme.emoji }} {{ theme.label }}: {{ theme.blurb }}</span>
            <div class="flex-1" />
            <button type="button" class="icon-btn !w-7 !h-7" title="Cerrar estilos" @click="showThemes = false"><AppIcon name="x" :size="14" /></button>
          </div>
          <div class="theme-strip flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 text-xs">
            <button
              v-for="g in [{ id: 'todos', label: `✨ Todos (${CARD_THEMES.length})` }, ...CARD_THEME_GROUPS]"
              :key="g.id"
              type="button"
              class="shrink-0 px-3 py-1 rounded-full font-semibold transition-colors"
              :class="themeGroup === g.id ? 'accent-btn' : 'chip hover:brightness-110'"
              @click="themeGroup = g.id"
            >
              {{ g.label }}
            </button>
          </div>
          <div class="theme-strip flex gap-2.5 overflow-x-auto pt-1 pb-2 -mx-1 px-1">
            <button
              v-for="t in visibleThemes"
              :key="t.id"
              type="button"
              class="swatch shrink-0 w-[88px] h-[104px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
              :class="{ selected: t.id === theme.id }"
              :style="{ background: swatchBg(t), color: t.text }"
              :title="t.blurb"
              @click="pickTheme(t)"
            >
              <span class="text-2xl">{{ t.emoji }}</span>
              <span class="text-lg leading-none" :style="{ fontFamily: t.titleFont, textShadow: t.titleShadow }">Aa</span>
              <span class="text-[10px] font-semibold leading-tight text-center px-1">{{ t.label }}</span>
              <span class="flex gap-0.5 mt-0.5">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: t.accent }" />
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: t.note.bg }" />
              </span>
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span class="muted">
              {{ item.theme ? 'Este elemento tiene su propio estilo.' : `Usa el estilo de la colección (${collectionTheme.emoji} ${collectionTheme.label}).` }}
            </span>
            <div class="flex-1" />
            <button
              v-if="item.theme && item.theme !== collection?.cardTheme"
              type="button"
              class="chip px-3 py-1.5 rounded-full font-semibold hover:brightness-110"
              @click="setItemTheme(collectionId, item.id, null); play('pop')"
            >
              ↺ Volver al de la colección
            </button>
            <button
              v-if="item.theme || hasOverrides"
              type="button"
              class="accent-btn px-3 py-1.5 rounded-full font-semibold"
              @click="applyToCollection"
            >
              🗂️ Usar {{ theme.label }} en toda la colección
            </button>
          </div>
        </div>
      </Transition>

      <!-- Marco decorativo del estilo -->
      <div class="frame" aria-hidden="true" />
    </div>

    <!-- Tablero inmersivo -->
    <CollectionBoardSpace
      v-if="boardOpen && item"
      :scope="boardScope"
      :title="item.title"
      :emoji="kindInfo.emoji"
      :subtitle="`${wallLabel} · ${collection?.name ?? ''}`"
      :cover="cover"
      :theme="theme"
      :tint="collection?.color ?? '#fbe4ec'"
      :origin="boardOrigin"
      @close="boardOpen = false"
    />

    <!-- Modo cine -->
    <Transition name="cinema">
      <div v-if="cinema && videoId" class="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-3 sm:p-10" :style="themeStyle" @click.self="cinema = false">
        <div class="w-full max-w-5xl flex items-center justify-between mb-3 text-white">
          <p class="font-semibold truncate">{{ kindInfo.emoji }} {{ item?.title }}</p>
          <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20" title="Cerrar video (Esc)" @click="cinema = false"><AppIcon name="x" :size="18" /></button>
        </div>
        <div class="cinema-screen w-full max-w-5xl aspect-video rounded-2xl overflow-hidden">
          <iframe
            :src="youtubeEmbedUrl(videoId)"
            :title="item?.title"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.museum-sheet {
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--chip);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
}
.detail {
  color: var(--text);
  background: var(--pattern), var(--bg);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  transition: color 0.4s;
}
.backdrop-img {
  position: absolute;
  inset: -40px;
  width: calc(100% + 80px);
  height: calc(100% + 80px);
  object-fit: cover;
  filter: blur(40px) saturate(1.4);
  opacity: var(--img-opacity);
  pointer-events: none;
}
.backdrop-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--shade);
}
.frame {
  position: absolute;
  inset: 0;
  z-index: 30;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: var(--frame);
}

.muted {
  color: var(--muted);
}
.chip {
  background: var(--chip);
  backdrop-filter: blur(6px);
}
.accent-btn {
  background: var(--accent);
  color: var(--on-accent);
  transition: transform 0.15s;
}
.accent-btn:hover {
  transform: translateY(-1px);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  background: var(--chip);
  transition: background 0.15s, transform 0.15s;
}
.icon-btn:hover {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  transform: scale(1.06);
}
.icon-btn.active {
  background: var(--accent);
  color: var(--on-accent);
}

.nav-arrow {
  position: absolute;
  z-index: 20;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 64px;
  border-radius: 14px;
  font-size: 34px;
  line-height: 1;
  color: var(--text);
  background: var(--chip);
  display: none;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.nav-arrow:hover {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
}
@media (min-width: 640px) {
  .nav-arrow {
    display: flex;
  }
}

.detail-title {
  font-family: var(--title-font);
  font-weight: 700;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  line-height: 1.15;
  text-shadow: var(--title-shadow);
  word-break: break-word;
}
.seal {
  flex-shrink: 0;
  writing-mode: vertical-rl;
  padding: 6px 4px;
  border: 2px solid #c0392b;
  border-radius: 6px;
  color: #c0392b;
  background: rgba(255, 255, 255, 0.55);
  font-family: 'Merriweather', serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 2px;
  transform: rotate(6deg);
  box-shadow: inset 0 0 0 2px rgba(192, 57, 43, 0.25);
  animation: stamp 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
}

.fact {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--chip);
  backdrop-filter: blur(6px);
}

.reaction {
  background: var(--chip);
}
.reaction:hover {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}
.reaction.picked {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  box-shadow: 0 0 0 2px var(--accent);
}
.reaction:hover .emoji {
  animation: wiggle 0.5s ease-in-out;
}
.reaction.picked .emoji {
  animation: jump 0.45s cubic-bezier(0.2, 1.6, 0.4, 1);
}

.add-note {
  color: var(--muted);
  border-color: color-mix(in srgb, var(--muted) 60%, transparent);
}
.add-note:hover {
  color: var(--text);
  border-color: var(--accent);
}

/* Tarjeta volteable */
.flip-scene {
  perspective: 1000px;
  cursor: pointer;
}
.flip-inner {
  position: relative;
  transition: transform 0.7s cubic-bezier(0.3, 1.3, 0.5, 1);
  transform-style: preserve-3d;
  animation: float 4s ease-in-out infinite;
}
.flip-inner.flipped {
  transform: rotateY(180deg);
}
.flip-scene:hover .flip-inner:not(.flipped) {
  transform: rotateY(-8deg) rotateX(4deg);
}
.flip-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}
.back-paper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 8px;
  padding: 2px 8px;
  font-family: 'Patrick Hand', cursive;
  font-size: 15px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.72);
  background: repeating-linear-gradient(to bottom, #fffdf6 0 21px, rgba(120, 160, 220, 0.3) 21px 22px);
  background-attachment: local;
}

/* Botón de video */
.play-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 18px 20px;
  min-height: 92px;
  border-radius: 20px;
  background: #111;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent);
}
.play-btn {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #ff0033;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding-left: 3px;
  animation: ring 2s ease-out infinite;
  transition: transform 0.2s;
}
.play-card:hover .play-btn {
  transform: scale(1.12);
}

/* Nota tipo post-it */
.sticky-note {
  position: relative;
  align-self: flex-start;
  max-width: 100%;
  min-width: 60%;
  padding: 22px 18px 16px;
  background: var(--note-bg);
  color: var(--note-text);
  font-family: 'Patrick Hand', cursive;
  font-size: 18px;
  line-height: 1.45;
  border-radius: 4px 4px 18px 4px;
  transform: rotate(-1.2deg);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.25s;
}
.sticky-note:hover {
  transform: rotate(0deg) scale(1.02);
}
.tape {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 90px;
  height: 22px;
  transform: translateX(-50%) rotate(2deg);
  background: var(--tape);
  border-radius: 2px;
}

/* Adornos del estilo */
.particle {
  position: absolute;
  top: -40px;
  animation: fall linear infinite;
  opacity: 0.85;
}
.particle.rise {
  top: auto;
  bottom: -40px;
  animation-name: rise;
}
.papel.prayer .papel-flag {
  width: 30px;
  height: 34px;
  clip-path: none;
  border-radius: 1px;
}
.corner {
  position: absolute;
  bottom: 10px;
  z-index: 5;
  font-size: 38px;
  pointer-events: none;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
  animation: bob 5s ease-in-out infinite;
}
.lantern {
  position: relative;
  display: flex;
  align-items: flex-end;
  font-size: 26px;
  transform-origin: top center;
  animation: swing 3s ease-in-out infinite;
}
.lantern::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 26px;
  left: 50%;
  width: 1px;
  background: var(--accent);
  opacity: 0.7;
}
.papel {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  border-top: 2px solid var(--muted);
  pointer-events: none;
}
.papel-flag {
  width: 42px;
  height: 40px;
  opacity: 0.88;
  transform-origin: top center;
  clip-path: polygon(0 0, 100% 0, 100% 80%, 87% 100%, 75% 80%, 62% 100%, 50% 80%, 37% 100%, 25% 80%, 12% 100%, 0 80%);
  animation: swing 2.6s ease-in-out infinite;
}
.noren {
  width: 64px;
  height: 46px;
  background: var(--accent);
  color: #fff;
  border-radius: 0 0 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Merriweather', serif;
  font-weight: 700;
  font-size: 18px;
  transform-origin: top center;
  animation: swing 4s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Selector de estilos */
.theme-drawer {
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid color-mix(in srgb, var(--muted) 35%, transparent);
}
.swatch {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.swatch:hover {
  transform: translateY(-4px) rotate(-1.5deg);
}
.swatch.selected {
  box-shadow: 0 0 0 3px var(--accent), 0 8px 18px rgba(0, 0, 0, 0.25);
  transform: translateY(-4px);
}

.cinema-screen {
  box-shadow: 0 0 120px color-mix(in srgb, var(--accent) 40%, transparent);
}

kbd {
  font-family: inherit;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--chip);
}

/* Transiciones */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-next-enter-from,
.slide-prev-leave-to {
  transform: translateX(60px);
  opacity: 0;
}
.slide-next-leave-to,
.slide-prev-enter-from {
  transform: translateX(-60px);
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 1.1, 0.4, 1), opacity 0.2s;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
.cinema-enter-active,
.cinema-leave-active {
  transition: opacity 0.35s ease;
}
.cinema-enter-active .cinema-screen {
  transition: transform 0.45s cubic-bezier(0.2, 1.2, 0.4, 1);
}
.cinema-enter-from,
.cinema-leave-to {
  opacity: 0;
}
.cinema-enter-from .cinema-screen {
  transform: scale(0.6);
}

@keyframes float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -6px;
  }
}
@keyframes bob {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-6px) rotate(4deg);
  }
}
@keyframes swing {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}
@keyframes fall {
  0% {
    transform: translate(0, 0) rotate(0);
  }
  50% {
    transform: translate(30px, 50vh) rotate(180deg);
  }
  100% {
    transform: translate(-10px, 100vh) rotate(360deg);
  }
}
@keyframes rise {
  0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  50% {
    transform: translate(-25px, -50vh) scale(1);
  }
  100% {
    transform: translate(15px, -100vh) scale(1.1);
    opacity: 0;
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
  }
  100% {
    transform: scale(1);
  }
}
@keyframes stamp {
  0% {
    transform: scale(2) rotate(-10deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(6deg);
    opacity: 1;
  }
}
@keyframes ring {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 51, 0.55);
  }
  100% {
    box-shadow: 0 0 0 16px rgba(255, 0, 51, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .flip-inner,
  .play-btn,
  .corner,
  .lantern,
  .papel-flag,
  .noren {
    animation: none;
  }
  .particle {
    display: none;
  }
}
</style>
