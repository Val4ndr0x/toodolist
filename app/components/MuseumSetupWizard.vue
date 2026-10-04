<script setup lang="ts">
import type { Collection, CollectionInput, MuseumConfig } from '~/composables/useCollections'
import { COLLECTION_COLORS, MUSEUM_EXHIBITS, MUSEUM_FIELDS, MUSEUM_STYLES, defaultMuseumConfig } from '~/composables/useCollections'

/** Preguntas para armar (o rediseñar) un museo de la fama: qué exhibe, cómo se llama, sus salas, su estilo y qué se anota de cada pieza. */
const props = defineProps<{ collection?: Collection | null; name?: string; color?: string }>()
const emit = defineEmits<{ close: []; save: [input: CollectionInput] }>()

const { play } = useSound()
const isEdit = computed(() => !!props.collection?.museum)

const initial: MuseumConfig = props.collection?.museum ? structuredClone(toRaw(props.collection.museum)) : defaultMuseumConfig()
const config = reactive<MuseumConfig>(initial)
const name = ref(props.collection?.name ?? props.name ?? '')
const color = props.collection?.color ?? props.color ?? COLLECTION_COLORS[0]!

const STEPS = [
  { id: 'que', emoji: '🧢', label: 'Qué exhibe' },
  { id: 'nombre', emoji: '🏛️', label: 'Nombre' },
  { id: 'salas', emoji: '🗂️', label: 'Salas' },
  { id: 'estilo', emoji: '🎨', label: 'Estilo' },
  { id: 'ficha', emoji: '📋', label: 'Ficha' },
] as const

const step = ref(0)
const direction = ref<1 | -1>(1)
const stepId = computed(() => STEPS[step.value]!.id)
const isLast = computed(() => step.value === STEPS.length - 1)
const error = ref('')

const exhibit = computed(() => MUSEUM_EXHIBITS.find((e) => e.id === config.exhibit) ?? MUSEUM_EXHIBITS[0]!)

// --- 1. Qué exhibe ---
function pickExhibit(id: string) {
  if (id === config.exhibit) return
  const fresh = defaultMuseumConfig(id)
  config.exhibit = fresh.exhibit
  config.pieceLabel = fresh.pieceLabel
  config.pieceEmoji = fresh.pieceEmoji
  // Si aún no hay piezas, se proponen las salas típicas de lo que se exhibe.
  if (!props.collection?.items.length) config.categories = fresh.categories
  play('pop')
}

const namePlaceholder = computed(() => `p. ej. Salón de la fama de ${exhibit.value.id === 'otro' ? 'mis tesoros' : exhibit.value.label.toLowerCase()}`)
const MOTTOS = ['Cada pieza tiene su historia', 'Solo las leyendas entran aquí', 'Coleccionado con amor', 'Prohibido tocar 🚫✋']

// --- 3. Salas ---
const suggestions = computed(() => exhibit.value.categories.filter(([n]) => !config.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())))
const newRoom = ref('')
const newEmoji = ref('🏷️')
const ROOM_EMOJIS = ['🏷️', '⭐', '💎', '🔥', '🏆', '⚾', '🏀', '🏈', '⚽', '🧢', '🎁', '✍️', '📼', '🌎', '❤️', '🖤']

function addRoom(roomName: string, emoji: string) {
  const n = roomName.trim()
  if (!n || config.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return
  config.categories.push({ id: uuid(), name: n, emoji })
  play('ding')
}

function addCustomRoom() {
  addRoom(newRoom.value, newEmoji.value)
  newRoom.value = ''
}

function removeRoom(id: string) {
  const count = props.collection?.items.filter((i) => i.category === id).length ?? 0
  const room = config.categories.find((c) => c.id === id)
  if (count && !confirm(`La sala «${room?.name}» tiene ${count} pieza${count === 1 ? '' : 's'}. Quedarán sin sala. ¿Quitarla?`)) return
  config.categories = config.categories.filter((c) => c.id !== id)
  play('pop')
}

function moveRoom(i: number, delta: -1 | 1) {
  const j = i + delta
  if (j < 0 || j >= config.categories.length) return
  const list = [...config.categories]
  ;[list[i], list[j]] = [list[j]!, list[i]!]
  config.categories = list
}

// --- 5. Ficha ---
function toggleField(id: string) {
  config.fields = config.fields.includes(id) ? config.fields.filter((f) => f !== id) : MUSEUM_FIELDS.map((f) => f.id).filter((f) => f === id || config.fields.includes(f))
  play('pop')
}

// --- Navegación ---
function goTo(i: number) {
  if (i === step.value || i < 0 || i >= STEPS.length) return
  error.value = ''
  direction.value = i > step.value ? 1 : -1
  step.value = i
  play('pop')
}

function next() {
  if (stepId.value === 'nombre' && !name.value.trim()) {
    error.value = 'Tu museo necesita un nombre ✨'
    play('ouch')
    return
  }
  if (isLast.value) return save()
  goTo(step.value + 1)
}

function save() {
  if (!name.value.trim()) {
    goTo(1)
    error.value = 'Tu museo necesita un nombre ✨'
    return
  }
  if (!config.pieceLabel.trim()) config.pieceLabel = 'pieza'
  play('levelup')
  emit('save', { name: name.value, kind: 'museo', color, museum: { ...toRaw(config), categories: [...config.categories], fields: [...config.fields] } })
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:px-4" @click.self="emit('close')">
    <div class="setup relative w-full sm:max-w-2xl max-h-[94dvh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-[28px] sm:rounded-[28px] flex flex-col">
      <!-- Camino de pasos -->
      <div class="flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div class="flex-1 flex items-center">
          <template v-for="(s, i) in STEPS" :key="s.id">
            <button
              type="button"
              class="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base transition-all"
              :class="i === step ? 'bg-[#e3b04b] shadow-md scale-110' : i < step || isEdit ? 'bg-white/15' : 'bg-white/5 grayscale opacity-60'"
              :title="s.label"
              @click="goTo(i)"
            >
              {{ s.emoji }}
            </button>
            <div v-if="i < STEPS.length - 1" class="flex-1 h-1 mx-0.5 sm:mx-1 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full bg-[#e3b04b] transition-all duration-500" :style="{ width: i < step ? '100%' : '0%' }" />
            </div>
          </template>
        </div>
        <button type="button" class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10" title="Cerrar (Esc)" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="relative px-5 sm:px-8 pt-5 pb-3 min-h-[380px]">
        <Transition :name="direction === 1 ? 'slide-next' : 'slide-prev'" mode="out-in">
          <div :key="stepId" class="flex flex-col gap-4">
            <p class="text-xs font-bold uppercase tracking-widest text-[#e3b04b]">Pregunta {{ step + 1 }} de {{ STEPS.length }}</p>

            <!-- 1. Qué exhibe -->
            <template v-if="stepId === 'que'">
              <h2 class="question">¿Qué vas a exhibir en tu museo?</h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  v-for="e in MUSEUM_EXHIBITS"
                  :key="e.id"
                  type="button"
                  class="option flex flex-col items-center gap-1.5 py-4"
                  :class="{ active: config.exhibit === e.id }"
                  @click="pickExhibit(e.id)"
                >
                  <span class="text-4xl">{{ e.emoji }}</span>
                  <span class="font-semibold text-sm">{{ e.label }}</span>
                </button>
              </div>
              <div v-if="config.exhibit === 'otro'" class="flex gap-2">
                <input v-model="config.pieceEmoji" maxlength="4" class="field w-16 text-center text-xl" title="Emoji de la pieza" />
                <input v-model="config.pieceLabel" maxlength="30" placeholder="¿Cómo se llama cada pieza? (p. ej. llavero)" class="field flex-1 min-w-0" />
              </div>
            </template>

            <!-- 2. Nombre -->
            <template v-else-if="stepId === 'nombre'">
              <h2 class="question">¿Cómo se llama tu museo? 🏛️</h2>
              <input v-model="name" type="text" autofocus maxlength="60" :placeholder="namePlaceholder" class="big-input" @keydown.enter.prevent="next" />
              <label class="flex flex-col gap-1.5">
                <span class="text-sm font-semibold text-white/65">Frase en la entrada <span class="font-normal opacity-70">(opcional)</span></span>
                <input v-model="config.motto" type="text" maxlength="80" placeholder="Lo que leen tus visitantes al entrar" class="field" @keydown.enter.prevent="next" />
              </label>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="m in MOTTOS" :key="m" type="button" class="chip" :class="{ active: config.motto === m }" @click="config.motto = m; play('pop')">{{ m }}</button>
              </div>
            </template>

            <!-- 3. Salas -->
            <template v-else-if="stepId === 'salas'">
              <h2 class="question">¿Cómo quieres dividir tu museo?</h2>
              <p class="text-sm text-white/60 -mt-2">Cada categoría es una sala. Ordénalas como quieras recorrerlas.</p>

              <ul v-if="config.categories.length" class="flex flex-col gap-1.5">
                <li v-for="(c, i) in config.categories" :key="c.id" class="room flex items-center gap-2 pl-3 pr-1.5 py-1.5">
                  <span class="text-xl">{{ c.emoji }}</span>
                  <input v-model="c.name" maxlength="40" class="flex-1 min-w-0 bg-transparent outline-none font-semibold" />
                  <button type="button" class="mini" :disabled="i === 0" title="Subir" @click="moveRoom(i, -1)">↑</button>
                  <button type="button" class="mini" :disabled="i === config.categories.length - 1" title="Bajar" @click="moveRoom(i, 1)">↓</button>
                  <button type="button" class="mini hover:!bg-rose-500/40" title="Quitar sala" @click="removeRoom(c.id)"><AppIcon name="x" :size="14" /></button>
                </li>
              </ul>
              <p v-else class="text-sm text-white/50">Sin salas: todas las piezas irán en una sola galería.</p>

              <div v-if="suggestions.length" class="flex flex-wrap gap-1.5">
                <button v-for="[n, e] in suggestions" :key="n" type="button" class="chip" @click="addRoom(n, e)">+ {{ e }} {{ n }}</button>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                  <input v-model="newRoom" maxlength="40" placeholder="Otra sala (p. ej. Yankees, Regalos de papá…)" class="field flex-1 min-w-0" @keydown.enter.prevent="addCustomRoom" />
                  <button type="button" class="chip active !px-4" @click="addCustomRoom">Agregar</button>
                </div>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="e in ROOM_EMOJIS"
                    :key="e"
                    type="button"
                    class="w-8 h-8 rounded-lg text-lg transition-all"
                    :class="newEmoji === e ? 'bg-[#e3b04b]/40 scale-110' : 'hover:bg-white/10'"
                    @click="newEmoji = e"
                  >
                    {{ e }}
                  </button>
                </div>
              </div>
            </template>

            <!-- 4. Estilo -->
            <template v-else-if="stepId === 'estilo'">
              <h2 class="question">¿Cómo quieres que se vean las salas?</h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  v-for="s in MUSEUM_STYLES"
                  :key="s.id"
                  type="button"
                  class="style-card"
                  :class="{ active: config.style === s.id }"
                  @click="config.style = s.id; play('sparkle')"
                >
                  <span class="block h-20 relative" :style="{ background: s.wall }">
                    <span class="spot" :style="{ background: `radial-gradient(ellipse at 50% 0%, ${s.light}, transparent 70%)` }" />
                    <span class="absolute left-1/2 bottom-1 -translate-x-1/2 text-2xl">{{ config.pieceEmoji }}</span>
                  </span>
                  <span class="block h-3" :style="{ background: s.floor }" />
                  <span class="block px-2 py-2 text-left" :style="{ background: s.plaque, color: s.plaqueText }">
                    <span class="block font-bold text-xs">{{ s.emoji }} {{ s.label }}</span>
                    <span class="block text-[10px] opacity-75 leading-tight">{{ s.blurb }}</span>
                  </span>
                </button>
              </div>
            </template>

            <!-- 5. Ficha -->
            <template v-else-if="stepId === 'ficha'">
              <h2 class="question">¿Qué quieres anotar de cada {{ config.pieceLabel }}?</h2>
              <p class="text-sm text-white/60 -mt-2">Siempre podrás poner foto, marca, calificación y su historia.</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="f in MUSEUM_FIELDS"
                  :key="f.id"
                  type="button"
                  class="option flex items-center gap-2 px-3 py-3 text-left"
                  :class="{ active: config.fields.includes(f.id) }"
                  @click="toggleField(f.id)"
                >
                  <span class="text-xl">{{ f.emoji }}</span>
                  <span class="font-semibold text-sm leading-tight">{{ f.label }}</span>
                </button>
              </div>
            </template>
          </div>
        </Transition>
      </div>

      <!-- Pie -->
      <div class="sticky bottom-0 flex items-center gap-2 px-5 sm:px-8 py-4 setup-footer">
        <button v-if="step > 0" type="button" class="big-btn bg-white/10 text-white/80 hover:bg-white/20" @click="goTo(step - 1)">← Atrás</button>
        <p v-if="error" class="text-xs text-rose-300 flex-1">{{ error }}</p>
        <div v-else class="flex-1" />
        <button v-if="isEdit && !isLast" type="button" class="big-btn bg-white/10 text-white/80 hover:bg-white/20" @click="save">Guardar</button>
        <button type="button" class="big-btn bg-[#e3b04b] text-[#2a1606] hover:brightness-110" @click="next">
          <template v-if="isLast">{{ isEdit ? '💾 Guardar museo' : '🏛️ ¡Abrir el museo!' }}</template>
          <template v-else>Siguiente →</template>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup {
  color: #fbeccb;
  background:
    radial-gradient(ellipse at 50% -10%, rgba(255, 215, 130, 0.2), transparent 55%),
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0 2px, transparent 2px 60px),
    #2e0c17;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), inset 0 0 0 3px rgba(227, 176, 75, 0.4);
}
.setup-footer {
  background: linear-gradient(to top, #2e0c17 70%, transparent);
}
.question {
  font-family: 'Merriweather', serif;
  font-size: clamp(1.35rem, 3.5vw, 1.8rem);
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 0 2px 18px rgba(227, 176, 75, 0.3);
}
.big-input {
  width: 100%;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  font-weight: 700;
  background: transparent;
  border: none;
  border-bottom: 3px dashed rgba(227, 176, 75, 0.35);
  padding: 6px 2px 10px;
  outline: none;
  color: #fff;
}
.big-input:focus {
  border-bottom: 3px solid #e3b04b;
}
.big-input::placeholder,
.field::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
.field {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  border: 1px solid rgba(227, 176, 75, 0.25);
  border-radius: 14px;
  padding: 10px 14px;
  outline: none;
}
.field:focus {
  border-color: #e3b04b;
}
.option {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid transparent;
  transition: transform 0.15s, background 0.15s, border-color 0.15s;
}
.option:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
}
.option.active {
  border-color: #e3b04b;
  background: rgba(227, 176, 75, 0.16);
  box-shadow: 0 6px 18px rgba(227, 176, 75, 0.25);
}
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.15s, background 0.15s;
}
.chip:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.14);
}
.chip.active {
  background: #e3b04b;
  color: #2a1606;
}
.room {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(227, 176, 75, 0.2);
}
.mini {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}
.mini:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}
.mini:disabled {
  opacity: 0.25;
}
.style-card {
  overflow: hidden;
  border-radius: 14px;
  border: 3px solid transparent;
  transition: transform 0.15s, border-color 0.15s;
}
.style-card:hover {
  transform: translateY(-3px);
}
.style-card.active {
  border-color: #e3b04b;
  box-shadow: 0 8px 22px rgba(227, 176, 75, 0.35);
}
.spot {
  position: absolute;
  inset: 0;
}
.big-btn {
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  transition: transform 0.15s, background 0.15s;
}
.big-btn:active {
  transform: scale(0.94);
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
</style>
