<script setup lang="ts">
import gsap from 'gsap'

type Filter = 'all' | 'active' | 'completed'

const route = useRoute()
const router = useRouter()
const {
  getList,
  addTask,
  editTask,
  updateTaskMeta,
  toggleTask,
  deleteTask,
  clearCompleted,
  setListSticker,
  setListFont,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  moveTask,
} = useLists()

useLenis()

const listId = route.params.id as string
const list = getList(listId)

const filter = ref<Filter>('all')
const showStickerModal = ref(false)
const cardRef = ref<HTMLElement | null>(null)
const starsLayerRef = ref<HTMLElement | null>(null)
const shootingStarRef = ref<HTMLElement | null>(null)

function onPickSticker(image: string | null) {
  setListSticker(listId, image)
  showStickerModal.value = false
}

watchEffect(() => {
  if (list.value === null) {
    router.replace('/')
  }
})

const skyBackground = computed(() => {
  const color = list.value?.color ?? '#e8dbf2'
  return {
    background: [
      `radial-gradient(55% 45% at 18% 6%, ${color}33 0%, transparent 70%)`,
      `radial-gradient(65% 55% at 90% 100%, ${color}26 0%, transparent 65%)`,
      `radial-gradient(150% 170% at 50% -15%, #1c2158 0%, #0d0f2b 45%, #05060f 100%)`,
    ].join(', '),
  }
})

let parallaxX: ReturnType<typeof gsap.quickTo> | null = null
let parallaxY: ReturnType<typeof gsap.quickTo> | null = null
let shootingTimer: ReturnType<typeof setTimeout> | null = null

function onSkyPointerMove(e: PointerEvent) {
  if (!cardRef.value || !parallaxX || !parallaxY) return
  const rect = cardRef.value.getBoundingClientRect()
  const relX = (e.clientX - rect.left) / rect.width - 0.5
  const relY = (e.clientY - rect.top) / rect.height - 0.5
  parallaxX(relX * -16)
  parallaxY(relY * -12)
}

function onSkyPointerLeave() {
  parallaxX?.(0)
  parallaxY?.(0)
}

function scheduleShootingStar() {
  shootingTimer = setTimeout(launchShootingStar, 3500 + Math.random() * 5500)
}

function launchShootingStar() {
  const el = shootingStarRef.value
  if (!el) return
  const startLeft = 5 + Math.random() * 35
  const startTop = 4 + Math.random() * 22
  gsap.set(el, { opacity: 0, left: `${startLeft}%`, top: `${startTop}%`, x: 0, y: 0, rotate: 32 })
  gsap
    .timeline({ onComplete: scheduleShootingStar })
    .to(el, { opacity: 1, duration: 0.12 })
    .to(el, { x: 160, y: 100, duration: 0.85, ease: 'power1.in' }, '<')
    .to(el, { opacity: 0, duration: 0.3 }, '-=0.3')
}

onMounted(() => {
  if (cardRef.value) {
    gsap.from(cardRef.value, {
      opacity: 0,
      y: 24,
      scale: 0.98,
      duration: 0.7,
      ease: 'power3.out',
    })
  }
  if (starsLayerRef.value) {
    parallaxX = gsap.quickTo(starsLayerRef.value, 'x', { duration: 0.6, ease: 'power3.out' })
    parallaxY = gsap.quickTo(starsLayerRef.value, 'y', { duration: 0.6, ease: 'power3.out' })
  }
  scheduleShootingStar()
})

onBeforeUnmount(() => {
  if (shootingTimer) clearTimeout(shootingTimer)
})

function onFrameBeforeEnter(el: Element) {
  gsap.set(el, { opacity: 0, y: -16, scale: 0.8 })
}

function onFrameEnter(el: Element, done: () => void) {
  const index = Number((el as HTMLElement).dataset.index ?? 0)
  gsap.to(el, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    delay: Math.min(index, 8) * 0.05,
    ease: 'back.out(1.7)',
    onComplete: done,
  })
}

function onFrameLeave(el: Element, done: () => void) {
  gsap.to(el, {
    opacity: 0,
    scale: 0.8,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: done,
  })
}

const skyStars = Array.from({ length: 52 }, (_, i) => {
  const size = Math.random() < 0.12 ? 3 : Math.random() < 0.5 ? 2 : 1
  return {
    id: i,
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${(Math.random() * 4).toFixed(2)}s`,
      animationDuration: `${(2.6 + Math.random() * 2.6).toFixed(2)}s`,
    },
  }
})

const filteredTasks = computed(() => {
  if (!list.value) return []
  if (filter.value === 'active') return list.value.tasks.filter((t) => !t.completed)
  if (filter.value === 'completed') return list.value.tasks.filter((t) => t.completed)
  return list.value.tasks
})

// --- Reordenar arrastrando (puntero: funciona con mouse y con el dedo) ---
const draggingId = ref<string | null>(null)

function onDragStart(id: string, e: PointerEvent) {
  e.preventDefault()
  draggingId.value = id
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd, { once: true })
  window.addEventListener('pointercancel', onDragEnd, { once: true })
}

function onDragMove(e: PointerEvent) {
  if (!draggingId.value || !list.value) return
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-task-id]')
  const overId = over?.dataset.taskId
  if (overId && overId !== draggingId.value) moveTask(list.value.id, draggingId.value, overId)
}

function onDragEnd() {
  draggingId.value = null
  window.removeEventListener('pointermove', onDragMove)
}

onBeforeUnmount(onDragEnd)

const completedCount = computed(() => list.value?.tasks.filter((t) => t.completed).length ?? 0)
const pendingCount = computed(() => (list.value?.tasks.length ?? 0) - completedCount.value)

const progressText = computed(() => {
  if (!list.value || list.value.tasks.length === 0) return 'Sin tareas todavía'
  return `${completedCount.value} de ${list.value.tasks.length} completadas`
})

const emptyCopy = computed(() => {
  if (filter.value === 'completed') {
    return { title: 'Aún no hay tareas completadas', subtitle: 'Marca alguna tarea como hecha para verla aquí.' }
  }
  if (filter.value === 'active') {
    return { title: 'No hay tareas pendientes', subtitle: '¡Buen trabajo, estás al día!' }
  }
  return { title: 'No hay tareas todavía', subtitle: 'Agrega tu primera tarea arriba.' }
})
</script>

<template>
  <div v-if="list" class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0 max-w-[560px] mx-auto w-full">
      <AppHeader :title="list.name" :title-font="list.font" show-back @back="router.push('/')" />

      <div class="px-4 sm:px-6 pb-3 -mt-1 flex items-center gap-2 text-sm text-muted">
        <FontButton
          :model-value="list.font"
          class="w-9 h-9 rounded-full bg-accent-soft hover:bg-accent hover:text-white text-accent-deep transition-colors"
          @update:model-value="(f: string) => setListFont(list!.id, f)"
        />
        <span>Tipo de letra de la lista</span>
      </div>

      <div
        ref="cardRef"
        class="night-sky relative mx-3 sm:mx-0 mb-8 rounded-[28px] p-4 sm:p-6 pb-9 overflow-hidden"
        :style="[skyBackground, { fontFamily: fontFamilyFor(list.font) }]"
        @pointermove="onSkyPointerMove"
        @pointerleave="onSkyPointerLeave"
      >
        <div ref="starsLayerRef" class="stars-layer absolute inset-0" aria-hidden="true">
          <span
            v-for="star in skyStars"
            :key="star.id"
            class="sky-star"
            :style="star.style"
          />
        </div>
        <span ref="shootingStarRef" class="shooting-star" aria-hidden="true" />

        <div class="relative z-10">
          <p class="text-sm font-medium text-white/60 -mt-1 mb-2 px-1">{{ progressText }}</p>

          <AddTaskForm @add="(text, assignee, meta) => addTask(list!.id, text, assignee, meta)" />
          <FilterTabs v-model="filter" />

          <div class="relative">
            <span v-if="filteredTasks.length" class="constellation-line" aria-hidden="true" />

            <TransitionGroup
              tag="ul"
              appear
              class="relative z-10 flex flex-col gap-3 list-none p-0 m-0"
              move-class="constellation-move"
              :css="false"
              @before-enter="onFrameBeforeEnter"
              @enter="onFrameEnter"
              @leave="onFrameLeave"
            >
              <TaskItem
                v-for="(task, index) in filteredTasks"
                :key="task.id"
                :task="task"
                :index="index"
                :data-task-id="task.id"
                draggable
                :class="draggingId === task.id ? 'task-dragging' : ''"
                @toggle="(id) => toggleTask(list!.id, id)"
                @edit="(id, text) => editTask(list!.id, id, text)"
                @update-meta="(id, patch) => updateTaskMeta(list!.id, id, patch)"
                @delete="(id) => deleteTask(list!.id, id)"
                @add-subtask="(id, text) => addSubtask(list!.id, id, text)"
                @toggle-subtask="(id, sid) => toggleSubtask(list!.id, id, sid)"
                @delete-subtask="(id, sid) => deleteSubtask(list!.id, id, sid)"
                @drag-start="onDragStart"
              />
            </TransitionGroup>
            <EmptyState v-if="!filteredTasks.length" :title="emptyCopy.title" :subtitle="emptyCopy.subtitle" />
          </div>

          <footer class="flex justify-between items-center mt-4 px-1 text-sm text-white/45">
            <span>{{ pendingCount }} pendientes</span>
            <button type="button" class="underline hover:text-white/70 transition-colors" @click="clearCompleted(list!.id)">
              Borrar completadas
            </button>
          </footer>
        </div>

        <button
          type="button"
          class="moon-btn absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 w-16 h-16 rounded-full flex items-center justify-center bg-[#fdf6e8] hover:scale-105 active:scale-95 transition-transform"
          title="Cambiar sticker"
          @click="showStickerModal = true"
        >
          <img v-if="list.sticker" :src="list.sticker" alt="" class="w-11 h-11 object-contain pointer-events-none select-none" />
          <AppIcon v-else name="plus" :size="20" class="text-black/40" />
        </button>
      </div>
    </div>

    <StickerImageModal v-if="showStickerModal" @close="showStickerModal = false" @pick="onPickSticker" />
  </div>
</template>

<style scoped>
.night-sky {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 20px 50px rgba(0, 0, 0, 0.4);
}

.stars-layer {
  z-index: 0;
  pointer-events: none;
  will-change: transform;
}

.sky-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: 0.2;
  pointer-events: none;
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.7);
  }
}

.shooting-star {
  position: absolute;
  width: 70px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
  border-radius: 999px;
  opacity: 0;
  z-index: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
}

.constellation-line {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 14px;
  width: 0;
  border-left: 2px dashed rgba(180, 200, 255, 0.25);
  z-index: 0;
}

.constellation-move {
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.task-dragging {
  opacity: 0.75;
  transform: scale(1.02);
  z-index: 20;
}

.moon-btn {
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.35),
    0 0 30px rgba(253, 246, 232, 0.4);
}
</style>
