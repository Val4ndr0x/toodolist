<script setup lang="ts">
import type { CollectionKind } from '~/composables/useCollections'
import { COLLECTION_KINDS, RATING_REACTIONS } from '~/composables/useCollections'

/** Tarjeta que se va "fabricando" mientras se llena el asistente; cada tipo de colección tiene su propio formato. */
const props = defineProps<{
  kind: CollectionKind
  title: string
  creator: string
  cover: string | null
  rating: number
  color: string
  hasVideo?: boolean
  /** Emoji propio cuando no hay imagen (p. ej. la pieza del museo). */
  emoji?: string
  /** Texto pequeño de la placa del museo (sala, año…). */
  plaque?: string
  /** Inclina la tarjeta siguiendo el puntero. */
  tilt?: boolean
}>()

const emoji = computed(() => props.emoji || COLLECTION_KINDS[props.kind].emoji)
const reaction = computed(() => (props.rating ? RATING_REACTIONS[props.rating - 1] : null))
const imageFailed = ref(false)
watch(() => props.cover, () => (imageFailed.value = false))
const showImage = computed(() => !!props.cover && !imageFailed.value)

const rx = ref(0)
const ry = ref(0)
function onMove(e: PointerEvent) {
  if (!props.tilt || e.pointerType !== 'mouse') return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  ry.value = ((e.clientX - r.left) / r.width - 0.5) * 18
  rx.value = -((e.clientY - r.top) / r.height - 0.5) * 18
}
function onLeave() {
  rx.value = 0
  ry.value = 0
}
</script>

<template>
  <div class="preview-stage" @pointermove="onMove" @pointerleave="onLeave">
    <div class="preview-card relative" :class="`kind-${kind}`" :style="{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }">
      <!-- Vinilo que asoma detrás de la portada (música) -->
      <div v-if="kind === 'musica'" class="vinyl" :class="{ spinning: rating > 0 }">
        <div class="vinyl-label" :style="{ backgroundColor: color }" />
      </div>

      <div class="cover-frame">
        <!-- Antena del televisor (series) -->
        <template v-if="kind === 'series'">
          <span class="antenna left" />
          <span class="antenna right" />
        </template>

        <div class="cover" :style="{ backgroundColor: color }">
          <img v-if="showImage" :key="cover!" :src="cover!" alt="" class="cover-img" @error="imageFailed = true" />
          <div v-else class="cover-empty">
            <span class="text-5xl drop-shadow-sm">{{ emoji }}</span>
            <span class="cover-title">{{ title || 'Sin título' }}</span>
            <span v-if="creator" class="text-[11px] text-black/50 line-clamp-1">{{ creator }}</span>
          </div>
          <span v-if="hasVideo" class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-[#ff0033] text-white text-[10px] font-bold shadow">▶</span>
        </div>

        <!-- Pie de polaroid / ticket con el título cuando hay imagen -->
        <div v-if="kind === 'otro' || kind === 'peliculas'" class="caption">
          <span class="font-semibold truncate">{{ title || '…' }}</span>
          <span v-if="kind === 'peliculas'" class="ticket-stub">ADMIT ONE</span>
        </div>

        <!-- Pedestal con placa (museo) -->
        <div v-if="kind === 'museo'" class="pedestal">
          <div class="plaque">
            <span class="plaque-title">{{ title || '…' }}</span>
            <span v-if="plaque || creator" class="plaque-sub">{{ plaque || creator }}</span>
          </div>
        </div>
      </div>

      <!-- Sello de calificación -->
      <Transition name="stamp">
        <div v-if="reaction" :key="rating" class="stamp" :title="reaction.label">
          <span class="text-2xl leading-none">{{ reaction.emoji }}</span>
          <span class="text-[9px] font-bold text-amber-500 leading-none mt-0.5">{{ '★'.repeat(rating) }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.preview-stage {
  perspective: 900px;
}
.preview-card {
  width: 100%;
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
}
.cover-frame {
  position: relative;
  z-index: 1;
}
.cover {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
}
.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: cover-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.cover-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  text-align: center;
}
.cover-title {
  font-family: 'Merriweather', serif;
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.75);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Libro: lomo a la izquierda y páginas a la derecha */
.kind-libros .cover {
  border-radius: 4px 12px 12px 4px;
  box-shadow: 6px 0 0 -2px #f3efe6, 7px 0 0 -2px #d9d3c4, 12px 14px 28px rgba(0, 0, 0, 0.28);
}
.kind-libros .cover::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 14px;
  z-index: 1;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.28), rgba(255, 255, 255, 0.18) 60%, rgba(0, 0, 0, 0.08));
}

/* Película: póster con perforaciones de cinta + talón de boleto */
.kind-peliculas .cover-frame {
  background: #1b1b1f;
  padding: 14px 8px 0;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}
.kind-peliculas .cover-frame::before,
.kind-peliculas .cover-frame::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  height: 6px;
  background: repeating-linear-gradient(90deg, #f5f1e8 0 7px, transparent 7px 13px);
  border-radius: 2px;
  opacity: 0.85;
}
.kind-peliculas .cover-frame::before {
  top: 4px;
}
.kind-peliculas .cover-frame::after {
  display: none;
}
.kind-peliculas .cover {
  border-radius: 4px;
  box-shadow: none;
}
.kind-peliculas .caption {
  color: #f5f1e8;
  border-top: 2px dashed rgba(245, 241, 232, 0.35);
  margin-top: 10px;
}

/* Serie: televisor retro */
.kind-series .cover-frame {
  background: linear-gradient(160deg, #7a5c45, #4e3a2c);
  padding: 12px;
  border-radius: 20px;
  margin-top: 26px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.15);
}
.kind-series .cover {
  border-radius: 14px;
  aspect-ratio: 4 / 5;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
}
.kind-series .cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.07) 0 2px, transparent 2px 4px);
  pointer-events: none;
}
.antenna {
  position: absolute;
  top: -24px;
  width: 3px;
  height: 30px;
  background: #4e3a2c;
  border-radius: 3px;
}
.antenna::after {
  content: '';
  position: absolute;
  top: -5px;
  left: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f4a8c4;
}
.antenna.left {
  left: 42%;
  transform: rotate(-28deg);
}
.antenna.right {
  left: 55%;
  transform: rotate(28deg);
}

/* Música: portada cuadrada con vinilo saliendo */
.kind-musica {
  padding-right: 22%;
}
.kind-musica .cover {
  aspect-ratio: 1;
  border-radius: 6px;
}
.vinyl {
  position: absolute;
  top: 4%;
  right: 0;
  width: 74%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, #151515 0 2px, #262626 2px 4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: right 0.5s ease;
}
.preview-stage:hover .vinyl {
  right: -6%;
}
.vinyl.spinning {
  animation: spin 3s linear infinite;
}
.vinyl-label {
  width: 34%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid #111;
}

/* Museo: vitrina de cristal sobre un pedestal */
.kind-museo .cover {
  aspect-ratio: 1;
  border-radius: 6px 6px 0 0;
  background-image: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.55), transparent 65%);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.75),
    inset 0 0 0 4px rgba(0, 0, 0, 0.06),
    0 -6px 30px rgba(255, 224, 150, 0.35);
}
.kind-museo .cover-img {
  object-fit: contain;
  padding: 10%;
  filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.35));
}
.kind-museo .cover::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.4) 36%, transparent 44%);
}
.pedestal {
  position: relative;
  padding: 10px 8px 12px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(#f4f1ea, #d6d0c4);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.3);
}
.plaque {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 5px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, #f6d27a, #b8862b 55%, #f2cf74);
  color: #3a2508;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
}
.plaque-title {
  font-family: 'Merriweather', serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plaque-sub {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Otro: polaroid */
.kind-otro .cover-frame {
  background: #fffdf8;
  padding: 10px 10px 0;
  border-radius: 4px;
  transform: rotate(-2deg);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}
.kind-otro .cover {
  aspect-ratio: 1;
  border-radius: 2px;
  box-shadow: none;
}
.kind-otro .caption {
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: rgba(0, 0, 0, 0.7);
}

.caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 2px 10px;
  font-size: 13px;
  min-width: 0;
}
.ticket-stub {
  flex-shrink: 0;
  font-size: 9px;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: #f4a8c4;
}

.stamp {
  position: absolute;
  z-index: 3;
  top: -14px;
  right: -14px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fffdf8;
  border: 3px dashed #f4a8c4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
  transform: rotate(12deg);
}
.stamp-enter-active {
  animation: stamp-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.stamp-leave-active {
  transition: opacity 0.15s;
}
.stamp-leave-to {
  opacity: 0;
}

@keyframes stamp-in {
  0% {
    transform: scale(2.4) rotate(-20deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(12deg);
    opacity: 1;
  }
}
@keyframes cover-in {
  0% {
    transform: scale(1.25);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .vinyl.spinning,
  .cover-img,
  .stamp-enter-active {
    animation: none;
  }
}
</style>
