<script setup lang="ts">
import type { BoardItem, BoardItemType } from '~/composables/useBoard'

/** Vista en miniatura del tablero de un elemento, como un muro de investigación de corcho con chinchetas e hilos rojos. */
const props = defineProps<{ scope: string; title: string; cover: string | null; label: string; defaultColor?: string }>()
const emit = defineEmits<{ enter: [rect: DOMRect] }>()

const { items, links } = useBoard(props.scope, { defaultColor: props.defaultColor })

const TYPE_EMOJI: Partial<Record<BoardItemType, string>> = {
  title: '🔤', banner: '🎗️', date: '📅', mood: '😊', todo: '✅', checklist: '☑️', note: '📝', sleep: '😴', stars: '⭐',
  drawing: '✏️', panel: '🗂️', calendar: '🗓️', text: '💬', kanban: '📋', list: '📃', book: '📕', client: '👤',
}
const NOTE_COLORS = ['#fff6b8', '#ffd6e5', '#d4f0ff', '#e0f5d0', '#fde2c4']

/** Texto corto para la miniatura: las notas guardan `title` + `value`; textos y títulos, `text`. */
function snippet(item: BoardItem) {
  const d = item.data ?? {}
  const parts = [d.title, d.value, d.text, item.label].filter((t): t is string => typeof t === 'string' && !!t.trim())
  return parts.join(' · ').replace(/<[^>]+>/g, '').slice(0, 50)
}

const VIEW_W = 1000
const VIEW_H = 420

/** Encaja todo el tablero (o como mucho 40 elementos) en el muro manteniendo las proporciones. */
const layout = computed(() => {
  const list = items.value.slice(0, 40)
  if (!list.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const i of list) {
    minX = Math.min(minX, i.x)
    minY = Math.min(minY, i.y)
    maxX = Math.max(maxX, i.x + i.width)
    maxY = Math.max(maxY, i.y + i.height)
  }
  const pad = 40
  const w = maxX - minX + pad * 2
  const h = maxY - minY + pad * 2
  const scale = Math.min(VIEW_W / w, VIEW_H / h, 1.4)
  const offX = (VIEW_W - (maxX - minX) * scale) / 2
  const offY = (VIEW_H - (maxY - minY) * scale) / 2
  const placed = list.map((i, n) => ({
    item: i,
    left: offX + (i.x - minX) * scale,
    top: offY + (i.y - minY) * scale,
    width: Math.max(18, i.width * scale),
    height: Math.max(18, i.height * scale),
    tilt: ((n * 7) % 9) - 4,
    color: typeof i.data?.color === 'string' && i.data.color.startsWith('#') ? i.data.color : NOTE_COLORS[n % NOTE_COLORS.length]!,
  }))
  const byId = new Map(placed.map((p) => [p.item.id, p]))
  const strings = links.value
    .map((l) => {
      const a = byId.get(l.from)
      const b = byId.get(l.to)
      if (!a || !b) return null
      const x1 = a.left + a.width / 2, y1 = a.top + 6
      const x2 = b.left + b.width / 2, y2 = b.top + 6
      // El hilo cuelga un poco por su peso.
      const sag = Math.min(60, Math.hypot(x2 - x1, y2 - y1) * 0.12)
      return { id: l.id, d: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}` }
    })
    .filter((s): s is { id: string; d: string } => !!s)
  return { placed, strings }
})

const wall = ref<HTMLElement | null>(null)
function enter() {
  if (wall.value) emit('enter', wall.value.getBoundingClientRect())
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <h3 class="font-bold">🕵️ {{ label }}</h3>
      <span class="wall-count">{{ items.length ? `${items.length} idea${items.length === 1 ? '' : 's'}` : 'vacío' }}</span>
    </div>

    <button ref="wall" type="button" class="wall group" :title="`Entrar al ${label.toLowerCase()}`" @click="enter">
      <div class="cork">
        <svg :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`" preserveAspectRatio="xMidYMid meet" class="absolute inset-0 w-full h-full">
          <!-- Tablero real en miniatura -->
          <template v-if="layout">
            <foreignObject
              v-for="p in layout.placed"
              :key="p.item.id"
              :x="p.left"
              :y="p.top"
              :width="p.width"
              :height="p.height"
              :transform="`rotate(${p.tilt} ${p.left + p.width / 2} ${p.top + p.height / 2})`"
            >
              <div class="mini" :class="`mini-${p.item.type === 'image' ? 'photo' : p.item.type === 'sticker' ? 'sticker' : 'paper'}`" :style="p.item.type !== 'image' && p.item.type !== 'sticker' ? { backgroundColor: p.color } : undefined">
                <img v-if="p.item.src" :src="p.item.src" alt="" />
                <template v-else>
                  <span class="mini-emoji">{{ TYPE_EMOJI[p.item.type] ?? '📌' }}</span>
                  <span v-if="snippet(p.item) && p.width > 90" class="mini-text">{{ snippet(p.item) }}</span>
                </template>
              </div>
            </foreignObject>
            <path v-for="s in layout.strings" :key="s.id" :d="s.d" class="string" />
            <circle v-for="p in layout.placed" :key="`pin-${p.item.id}`" :cx="p.left + p.width / 2" :cy="p.top + 6" r="7" class="pin" />
          </template>

          <!-- Muro vacío: pistas de ejemplo -->
          <template v-else>
            <foreignObject x="80" y="70" width="190" height="250" transform="rotate(-4 175 195)">
              <div class="mini mini-photo">
                <img v-if="cover" :src="cover" alt="" />
                <span v-else class="mini-emoji">🖼️</span>
              </div>
            </foreignObject>
            <foreignObject x="380" y="50" width="200" height="130" transform="rotate(3 480 115)">
              <div class="mini mini-paper big" style="background:#fff6b8"><span>¿Teorías? 🤔</span></div>
            </foreignObject>
            <foreignObject x="420" y="240" width="200" height="130" transform="rotate(-2 520 305)">
              <div class="mini mini-paper big" style="background:#ffd6e5"><span>Personajes 👥</span></div>
            </foreignObject>
            <foreignObject x="710" y="120" width="210" height="140" transform="rotate(4 815 190)">
              <div class="mini mini-paper big" style="background:#d4f0ff"><span>Frases favoritas 💬</span></div>
            </foreignObject>
            <path d="M 175 76 Q 330 120 480 56" class="string" />
            <path d="M 480 56 Q 500 170 520 246" class="string" />
            <path d="M 520 246 Q 680 230 815 126" class="string" />
            <circle v-for="(c, i) in [[175, 76], [480, 56], [520, 246], [815, 126]]" :key="i" :cx="c[0]" :cy="c[1]" r="8" class="pin" />
          </template>
        </svg>

        <div class="wall-light" />
        <span class="enter-cta">
          <span class="clock">🕰️</span>
          {{ items.length ? 'Viajar a tu muro' : 'Viaja y empieza tu muro' }}
        </span>
      </div>
    </button>
  </section>
</template>

<style scoped>
.wall-count {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--chip, rgba(0, 0, 0, 0.08));
}
.wall {
  position: relative;
  display: block;
  width: 100%;
  padding: 10px;
  border-radius: 16px;
  /* Marco de madera teñido con el acento del estilo */
  background:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.08) 0 3px, transparent 3px 11px),
    color-mix(in srgb, var(--accent, #c0392b) 25%, #5b3a1f);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.15);
  transition: transform 0.35s cubic-bezier(0.2, 1.2, 0.4, 1), box-shadow 0.35s;
  perspective: 900px;
}
.wall:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45), 0 0 0 3px color-mix(in srgb, var(--accent, #c0392b) 60%, transparent);
}
.cork {
  position: relative;
  aspect-ratio: 1000 / 420;
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.12) 1px, transparent 2px) 0 0 / 9px 9px,
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.12) 1px, transparent 2px) 0 0 / 13px 13px,
    color-mix(in srgb, var(--accent, #c0392b) 10%, #c49a6c);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.35);
}
.wall-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 0%, rgba(255, 240, 200, 0.25), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(0, 0, 0, 0.3), transparent 60%);
}

.mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
}
.mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mini-sticker img {
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3));
}
.mini-photo {
  background: #fff;
  padding: 7% 7% 18%;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
  font-size: 48px;
}
.mini-paper {
  padding: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  font-family: 'Patrick Hand', cursive;
  color: rgba(0, 0, 0, 0.72);
  text-align: center;
}
.mini-paper.big {
  font-size: 30px;
  line-height: 1.1;
}
.mini-emoji {
  font-size: 26px;
  line-height: 1;
}
.mini-text {
  font-size: 18px;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.string {
  fill: none;
  stroke: #c1121f;
  stroke-width: 3;
  stroke-linecap: round;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.35));
}
.pin {
  fill: var(--accent, #d62828);
  stroke: rgba(0, 0, 0, 0.35);
  stroke-width: 2;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.45));
}

.enter-cta {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  background: rgba(20, 14, 10, 0.78);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  transition: transform 0.25s, background 0.25s;
}
.wall:hover .enter-cta {
  transform: translateX(-50%) scale(1.06);
  background: color-mix(in srgb, var(--accent, #c0392b) 85%, black);
}
.clock {
  display: inline-block;
  animation: tick 2s ease-in-out infinite;
}
.wall:hover .clock {
  animation: spin 0.8s linear infinite;
}
@keyframes tick {
  0%,
  100% {
    transform: rotate(-12deg);
  }
  50% {
    transform: rotate(12deg);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .clock,
  .wall:hover .clock {
    animation: none;
  }
}
</style>
