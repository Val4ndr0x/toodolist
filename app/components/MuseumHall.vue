<script setup lang="ts">
import type { Collection, CollectionItem } from '~/composables/useCollections'
import { museumStyle } from '~/composables/useCollections'
import { youtubeId, youtubeThumbnail } from '~/utils/youtube'

/** Vista de museo: entrada con el nombre y la frase, pestañas por sala y cada pieza en su vitrina con reflector. */
const props = defineProps<{ collection: Collection; items: CollectionItem[] }>()
const emit = defineEmits<{ open: [id: string]; add: [categoryId: string] }>()

const { play } = useSound()

const museum = computed(() => props.collection.museum!)
const style = computed(() => museumStyle(museum.value.style))
const styleVars = computed(() => ({
  '--wall': style.value.wall,
  '--floor': style.value.floor,
  '--text': style.value.text,
  '--muted': style.value.muted,
  '--accent': style.value.accent,
  '--plaque': style.value.plaque,
  '--plaque-text': style.value.plaqueText,
  '--light': style.value.light,
}))

const UNSORTED = '__sin-sala'

type Room = { id: string; name: string; emoji: string; items: CollectionItem[] }
const rooms = computed<Room[]>(() => {
  const known = new Set(museum.value.categories.map((c) => c.id))
  const list: Room[] = museum.value.categories.map((c) => ({ ...c, items: props.items.filter((i) => i.category === c.id) }))
  const loose = props.items.filter((i) => !known.has(i.category))
  if (loose.length || !list.length) list.push({ id: UNSORTED, name: list.length ? 'Sin sala' : 'Galería principal', emoji: museum.value.pieceEmoji, items: loose })
  return list
})

const activeRoom = ref('todas')
watch(rooms, (list) => {
  if (activeRoom.value !== 'todas' && !list.some((r) => r.id === activeRoom.value)) activeRoom.value = 'todas'
})
const visibleRooms = computed(() => (activeRoom.value === 'todas' ? rooms.value : rooms.value.filter((r) => r.id === activeRoom.value)))

const total = computed(() => props.collection.items.length)
const legends = computed(() => props.collection.items.filter((i) => i.rating === 5).length)

function pick(id: string) {
  activeRoom.value = id
  play('pop')
}

const cover = (i: CollectionItem) => i.image ?? (youtubeId(i.link) ? youtubeThumbnail(youtubeId(i.link)!) : null)
const plaqueOf = (i: CollectionItem) => [i.details.equipo, i.details.anio].filter(Boolean).join(' · ') || i.creator
</script>

<template>
  <div class="museum rounded-[28px] overflow-hidden" :style="styleVars">
    <!-- Entrada -->
    <div class="entrance relative px-5 sm:px-10 pt-8 pb-6 text-center">
      <div class="columns" aria-hidden="true">
        <span class="column" />
        <span class="column" />
      </div>
      <p class="text-[11px] font-bold uppercase tracking-[0.3em]" :style="{ color: 'var(--accent)' }">★ Museo de la fama ★</p>
      <h2 class="museum-title mt-1">{{ collection.name }}</h2>
      <p v-if="museum.motto" class="muted italic mt-1">«{{ museum.motto }}»</p>
      <div class="flex flex-wrap justify-center gap-2 mt-4 text-xs font-semibold">
        <span class="stat">{{ museum.pieceEmoji }} {{ total }} {{ total === 1 ? museum.pieceLabel : `${museum.pieceLabel}s` }}</span>
        <span class="stat">🗂️ {{ museum.categories.length }} {{ museum.categories.length === 1 ? 'sala' : 'salas' }}</span>
        <span v-if="legends" class="stat">🏆 {{ legends }} {{ legends === 1 ? 'leyenda' : 'leyendas' }}</span>
      </div>
    </div>

    <!-- Pestañas por sala -->
    <div class="tabs flex gap-1.5 overflow-x-auto px-4 sm:px-8 py-3">
      <button type="button" class="tab" :class="{ active: activeRoom === 'todas' }" @click="pick('todas')">🏛️ Todas las salas</button>
      <button v-for="r in rooms" :key="r.id" type="button" class="tab" :class="{ active: activeRoom === r.id }" @click="pick(r.id)">
        {{ r.emoji }} {{ r.name }} <span class="opacity-60 tabular-nums">{{ r.items.length }}</span>
      </button>
    </div>

    <!-- Salas -->
    <section v-for="r in visibleRooms" :key="r.id" class="room">
      <div class="flex items-center gap-3 px-5 sm:px-8 pt-6">
        <span class="room-sign">{{ r.emoji }} Sala {{ r.name }}</span>
        <span class="muted text-xs">{{ r.items.length }} en exhibición</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 px-5 sm:px-8 pt-6 pb-10">
        <button
          v-for="item in r.items"
          :key="item.id"
          type="button"
          class="exhibit relative text-left"
          :title="item.title"
          @click="emit('open', item.id)"
        >
          <span class="spotlight" aria-hidden="true" />
          <span v-if="item.rating === 5" class="legend-badge" title="Leyenda: 5 estrellas">🏆</span>
          <CollectionItemPreview
            kind="museo"
            :title="item.title"
            :creator="item.creator"
            :cover="cover(item)"
            :rating="0"
            :color="collection.color"
            :emoji="museum.pieceEmoji"
            :plaque="plaqueOf(item)"
          />
          <span v-if="item.rating" class="block text-center text-[11px] mt-1.5 tracking-wider" :style="{ color: 'var(--accent)' }">
            {{ '★'.repeat(item.rating) }}<span class="opacity-25">{{ '★'.repeat(5 - item.rating) }}</span>
          </span>
        </button>

        <!-- Pedestal vacío para agregar -->
        <button type="button" class="empty-pedestal flex flex-col items-center justify-center gap-2" @click="emit('add', r.id === UNSORTED ? '' : r.id)">
          <span class="w-11 h-11 rounded-full flex items-center justify-center add-circle">
            <AppIcon name="plus" :size="20" />
          </span>
          <span class="text-xs font-semibold text-center px-2">Exhibir {{ museum.pieceLabel }}</span>
        </button>
      </div>
      <div class="floor" aria-hidden="true" />
    </section>
  </div>
</template>

<style scoped>
.museum {
  color: var(--text);
  background: var(--wall);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.muted {
  color: var(--muted);
}
.entrance {
  border-bottom: 3px solid color-mix(in srgb, var(--accent) 50%, transparent);
}
.museum-title {
  font-family: 'Merriweather', serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  line-height: 1.1;
  text-shadow: 0 2px 22px color-mix(in srgb, var(--accent) 45%, transparent);
}
.columns {
  position: absolute;
  inset: 16px 16px 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}
.column {
  width: 22px;
  border-radius: 6px 6px 0 0;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.22) 0 3px, rgba(0, 0, 0, 0.08) 3px 6px);
  opacity: 0.6;
}
@media (max-width: 640px) {
  .columns {
    display: none;
  }
}
.stat {
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--plaque);
  color: var(--plaque-text);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.tabs {
  background: rgba(0, 0, 0, 0.15);
  scrollbar-width: none;
}
.tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.15s, transform 0.15s;
}
.tab:hover {
  transform: translateY(-1px);
}
.tab.active {
  background: var(--accent);
  color: var(--plaque-text);
}
.room + .room {
  border-top: 1px dashed color-mix(in srgb, var(--accent) 30%, transparent);
}
.room-sign {
  font-family: 'Merriweather', serif;
  font-weight: 700;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 6px;
  background: var(--plaque);
  color: var(--plaque-text);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}
.floor {
  height: 18px;
  background: var(--floor);
  box-shadow: inset 0 6px 10px rgba(0, 0, 0, 0.3);
}
.exhibit {
  transition: transform 0.25s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.exhibit:hover {
  transform: translateY(-6px);
}
.spotlight {
  position: absolute;
  left: -12%;
  right: -12%;
  top: -30px;
  height: 75%;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 0%, var(--light), transparent 70%);
  clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
  opacity: 0.8;
  transition: opacity 0.3s;
}
.exhibit:hover .spotlight {
  opacity: 1;
}
.legend-badge {
  position: absolute;
  z-index: 5;
  top: -10px;
  right: -6px;
  font-size: 24px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
  animation: shine 2.6s ease-in-out infinite;
}
.empty-pedestal {
  min-height: 180px;
  border-radius: 10px;
  border: 2px dashed color-mix(in srgb, var(--text) 25%, transparent);
  color: var(--muted);
  transition: border-color 0.15s, background 0.15s;
}
.empty-pedestal:hover {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}
.add-circle {
  background: var(--plaque);
  color: var(--plaque-text);
}
@keyframes shine {
  0%,
  100% {
    transform: rotate(-8deg) scale(1);
  }
  50% {
    transform: rotate(8deg) scale(1.12);
  }
}
@media (prefers-reduced-motion: reduce) {
  .legend-badge {
    animation: none;
  }
}
</style>
