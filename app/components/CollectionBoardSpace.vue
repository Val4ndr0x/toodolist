<script setup lang="ts">
import { cardThemeVars, type CardTheme } from '~/utils/cardThemes'

/**
 * Espacio inmersivo con el tablero propio de un elemento de colección.
 * Se entra con un "viaje en el tiempo" que sale del muro en miniatura (`origin`) y se vuelve con el viaje al revés.
 */
const props = defineProps<{
  scope: string
  title: string
  emoji: string
  subtitle: string
  cover: string | null
  theme: CardTheme
  tint: string
  origin: DOMRect | null
}>()
const emit = defineEmits<{ close: [] }>()

const { play } = useSound()
const vars = computed(() => cardThemeVars(props.theme, props.tint))

type Phase = 'travel' | 'board' | 'return'
const phase = ref<Phase>('travel')
const root = ref<HTMLElement | null>(null)
const reduced = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const timers: ReturnType<typeof setTimeout>[] = []

/** Recorte que deja ver solo el rectángulo del muro en miniatura. */
function insetFrom(r: DOMRect) {
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 16px)`
}
const FULL = 'inset(0px 0px 0px 0px round 0px)'

onMounted(() => {
  if (reduced) {
    phase.value = 'board'
    return
  }
  play('unlock')
  if (props.origin && root.value?.animate) {
    root.value.animate([{ clipPath: insetFrom(props.origin) }, { clipPath: FULL }], { duration: 700, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' })
  }
  timers.push(
    setTimeout(() => {
      phase.value = 'board'
      play('land')
      play('sparkle', 0.15)
    }, 2100),
  )
})
onBeforeUnmount(() => timers.forEach(clearTimeout))

function back() {
  if (phase.value !== 'board') return
  if (reduced) return emit('close')
  phase.value = 'return'
  play('unlock')
  timers.push(
    setTimeout(() => {
      const el = root.value
      if (el?.animate && props.origin) {
        el.animate([{ clipPath: FULL }, { clipPath: insetFrom(props.origin) }], { duration: 550, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' })
      }
    }, 1100),
    // El cierre no depende de que la animación termine: si el navegador la pausa, igual se vuelve a la ficha.
    setTimeout(() => emit('close'), 1700),
  )
}

// Recuerdos que salen disparados desde el centro del túnel.
const SHARDS = ['🕰️', '⏳', '✨', '📜', '⭐', '🗝️', '💫', '📌', '🧵', '🔍']
const shards = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.3
  return { emoji: SHARDS[i % SHARDS.length]!, x: Math.cos(angle) * 70, y: Math.sin(angle) * 70, delay: (i % 6) * 0.25, size: 18 + (i % 4) * 8 }
})
</script>

<template>
  <div ref="root" class="space fixed inset-0 z-[80] overflow-hidden" :style="vars">
    <!-- El tablero (se monta al llegar y se queda detrás durante el regreso) -->
    <div v-if="phase !== 'travel'" class="board-world absolute inset-0 flex flex-col" :class="{ arriving: phase === 'board' }">
      <header class="space-header shrink-0 flex items-center gap-3 px-3 sm:px-5 py-2.5">
        <button type="button" class="back-btn" title="Volver a la ficha" @click="back">
          <span class="back-clock">🕰️</span>
          <span class="hidden sm:inline">Volver al presente</span>
        </button>
        <img v-if="cover" :src="cover" alt="" class="w-8 h-11 rounded-md object-cover shadow-md shrink-0" />
        <div class="min-w-0">
          <p class="space-title truncate">{{ emoji }} {{ title }}</p>
          <p class="muted text-[11px] truncate">{{ subtitle }}</p>
        </div>
        <div class="flex-1" />
        <p class="muted hidden md:block text-xs">Agrega notas, fotos y stickers · une ideas con hilos 🧵 · <kbd>Ctrl</kbd>+<kbd>K</kbd> comandos</p>
      </header>
      <div class="flex-1 min-h-0">
        <BoardCanvas :board-scope="scope" :default-color="theme.bg" />
      </div>
    </div>

    <!-- Túnel del tiempo -->
    <Transition name="tunnel-fade">
      <div v-if="phase !== 'board'" class="tunnel absolute inset-0 flex items-center justify-center" :class="{ reverse: phase === 'return' }">
        <div class="rays" />
        <div class="rays rays-2" />
        <span v-for="n in 10" :key="n" class="ring" :style="{ animationDelay: `${n * 0.16}s` }" />
        <span
          v-for="(s, i) in shards"
          :key="i"
          class="shard"
          :style="{ '--x': `${s.x}vmax`, '--y': `${s.y}vmax`, animationDelay: `${s.delay}s`, fontSize: `${s.size}px` }"
        >{{ s.emoji }}</span>
        <img v-if="cover" :src="cover" alt="" class="memory" />

        <div class="relative flex flex-col items-center gap-5 text-center px-6">
          <div class="clock-face">
            <span v-for="t in 12" :key="t" class="tick" :style="{ transform: `rotate(${t * 30}deg)` }" />
            <span class="hand hour" />
            <span class="hand minute" />
            <span class="clock-center" />
          </div>
          <p class="travel-text">
            <template v-if="phase === 'travel'">Viajando al universo de<br /><strong>{{ emoji }} {{ title }}</strong></template>
            <template v-else>Regresando al presente…</template>
          </p>
        </div>
      </div>
    </Transition>

    <div v-if="phase === 'board'" class="flash" />
  </div>
</template>

<style scoped>
.space {
  background: #05030a;
  color: var(--text);
}

/* --- Túnel --- */
.tunnel {
  background: radial-gradient(circle at center, color-mix(in srgb, var(--accent) 55%, white) 0%, color-mix(in srgb, var(--accent) 35%, #05030a) 18%, #05030a 70%);
  perspective: 600px;
  color: #fff;
}
.rays {
  position: absolute;
  inset: -50%;
  background: repeating-conic-gradient(from 0deg, transparent 0deg 7deg, color-mix(in srgb, var(--accent) 35%, transparent) 8deg 9deg, transparent 10deg 16deg);
  mask: radial-gradient(circle, transparent 6%, #000 30%, transparent 75%);
  -webkit-mask: radial-gradient(circle, transparent 6%, #000 30%, transparent 75%);
  animation: rotate 6s linear infinite;
}
.rays-2 {
  background: repeating-conic-gradient(from 4deg, transparent 0deg 11deg, rgba(255, 255, 255, 0.18) 12deg 12.5deg, transparent 13deg 23deg);
  animation-duration: 3.5s;
  animation-direction: reverse;
}
.ring {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 80%, white);
  box-shadow: 0 0 18px var(--accent), inset 0 0 18px var(--accent);
  animation: warp 1.6s cubic-bezier(0.5, 0, 1, 1) infinite;
  opacity: 0;
}
.reverse .ring {
  animation-name: warp-back;
}
.shard {
  position: absolute;
  animation: burst 1.8s ease-in infinite;
  opacity: 0;
}
.reverse .shard {
  animation-name: burst-back;
}
.memory {
  position: absolute;
  width: 120px;
  height: 170px;
  object-fit: cover;
  border-radius: 10px;
  border: 4px solid #fff;
  box-shadow: 0 0 40px var(--accent);
  animation: memory 2.1s ease-in forwards;
}
.reverse .memory {
  animation: memory-back 1.1s ease-out forwards;
}

.clock-face {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
  border: 3px solid color-mix(in srgb, var(--accent) 70%, white);
  box-shadow: 0 0 40px color-mix(in srgb, var(--accent) 70%, transparent), inset 0 0 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  animation: clock-pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.tick {
  position: absolute;
  left: 50%;
  top: 6px;
  bottom: 6px;
  width: 2px;
  margin-left: -1px;
  background: linear-gradient(to bottom, #fff 0 8px, transparent 8px);
}
.hand {
  position: absolute;
  left: 50%;
  bottom: 50%;
  transform-origin: bottom center;
  border-radius: 2px;
  background: #fff;
}
.hand.hour {
  width: 4px;
  height: 30px;
  margin-left: -2px;
  animation: rotate 2.4s linear infinite;
}
.hand.minute {
  width: 2px;
  height: 46px;
  margin-left: -1px;
  background: var(--accent);
  animation: rotate 0.4s linear infinite;
}
.reverse .hand {
  animation-direction: reverse;
}
.clock-center {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: #fff;
}
.travel-text {
  font-size: clamp(1rem, 2.6vw, 1.3rem);
  line-height: 1.4;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
  animation: text-in 0.8s 0.3s both;
}
.travel-text strong {
  font-family: var(--title-font);
  font-size: 1.4em;
  text-shadow: 0 0 20px var(--accent);
}

/* --- Llegada --- */
.flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(circle, #fff, color-mix(in srgb, var(--accent) 50%, white));
  animation: flash 0.7s ease-out forwards;
}
.board-world.arriving {
  animation: arrive 0.8s cubic-bezier(0.2, 1, 0.3, 1);
}
.space-header {
  background: var(--pattern), var(--bg);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 2;
}
.space-title {
  font-family: var(--title-font);
  font-weight: 700;
  font-size: 17px;
  text-shadow: var(--title-shadow);
}
.muted {
  color: var(--muted);
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent);
  transition: transform 0.15s;
  flex-shrink: 0;
}
.back-btn:hover {
  transform: translateX(-2px) scale(1.04);
}
.back-btn:hover .back-clock {
  animation: rotate 0.6s linear infinite reverse;
}
.back-clock {
  display: inline-block;
}
kbd {
  font-family: inherit;
  padding: 0 4px;
  border-radius: 4px;
  background: var(--chip);
}

.tunnel-fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.tunnel-fade-leave-to {
  opacity: 0;
  transform: scale(1.6);
}
.tunnel-fade-enter-active {
  transition: opacity 0.35s;
}
.tunnel-fade-enter-from {
  opacity: 0;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes warp {
  0% {
    transform: scale(0.1);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: scale(9);
    opacity: 0;
  }
}
@keyframes warp-back {
  0% {
    transform: scale(9);
    opacity: 0;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: scale(0.1);
    opacity: 0;
  }
}
@keyframes burst {
  0% {
    transform: translate(0, 0) scale(0.2);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(1.8) rotate(200deg);
    opacity: 0;
  }
}
@keyframes burst-back {
  0% {
    transform: translate(var(--x), var(--y)) scale(1.8);
    opacity: 0;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(0.2) rotate(-200deg);
    opacity: 0;
  }
}
@keyframes memory {
  0% {
    transform: translateZ(-800px) rotate(-20deg);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translateZ(500px) rotate(10deg);
    opacity: 0;
  }
}
@keyframes memory-back {
  0% {
    transform: translateZ(500px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateZ(-800px) rotate(-20deg);
    opacity: 0;
  }
}
@keyframes clock-pop {
  0% {
    transform: scale(0) rotate(-180deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
@keyframes text-in {
  0% {
    opacity: 0;
    letter-spacing: 0.4em;
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    letter-spacing: normal;
    filter: none;
  }
}
@keyframes flash {
  0% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
}
@keyframes arrive {
  0% {
    transform: scale(1.25);
    filter: blur(10px) brightness(1.6);
    opacity: 0;
  }
  100% {
    transform: none;
    filter: none;
    opacity: 1;
  }
}
</style>
