<script setup lang="ts">
import type { Collection } from '~/composables/useCollections'
import { COLLECTION_KINDS } from '~/composables/useCollections'
import { youtubeId, youtubeThumbnail } from '~/utils/youtube'

const props = defineProps<{ collection: Collection }>()
const emit = defineEmits<{ open: [id: string]; edit: [id: string]; delete: [id: string] }>()

const menuOpen = ref(false)
const kind = computed(() => COLLECTION_KINDS[props.collection.kind])

// Hasta tres portadas en abanico como vista previa de lo que hay dentro.
const previews = computed(() =>
  props.collection.items
    .map((i) => i.image ?? (youtubeId(i.link) ? youtubeThumbnail(youtubeId(i.link)!) : null))
    .filter((src): src is string => !!src)
    .slice(0, 3),
)

function onEdit() {
  menuOpen.value = false
  emit('edit', props.collection.id)
}

function onDelete() {
  menuOpen.value = false
  if (!confirm(`¿Eliminar la colección "${props.collection.name}" y todo lo que contiene? Esta acción no se puede deshacer.`)) return
  emit('delete', props.collection.id)
}
</script>

<template>
  <div
    class="relative flex flex-col gap-3 rounded-[22px] p-4 min-h-[210px] cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all"
    :style="{ backgroundColor: collection.color }"
    @click="emit('open', collection.id)"
  >
    <button
      type="button"
      class="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-black/40 hover:bg-black/10 z-10"
      @click.stop="menuOpen = !menuOpen"
    >
      <AppIcon name="dots" :size="16" />
    </button>

    <div
      v-if="menuOpen"
      class="absolute top-10 right-2 bg-white dark:bg-surface text-black/80 dark:text-ink rounded-lg shadow-lg text-sm overflow-hidden z-20 border border-black/5 dark:border-border"
      @click.stop
    >
      <button type="button" class="block w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-surface-soft" @click="onEdit">Editar</button>
      <button type="button" class="block w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-surface-soft text-danger" @click="onDelete">
        Eliminar colección
      </button>
    </div>

    <div class="relative h-24 flex items-end justify-center">
      <template v-if="previews.length">
        <img
          v-for="(src, i) in previews"
          :key="i"
          :src="src"
          alt=""
          class="absolute bottom-0 w-14 h-20 object-cover rounded-lg shadow-md border-2 border-white/80"
          :style="{
            transform: `translateX(${(i - (previews.length - 1) / 2) * 34}px) rotate(${(i - (previews.length - 1) / 2) * 8}deg)`,
            zIndex: i === Math.floor(previews.length / 2) ? 2 : 1,
          }"
        />
      </template>
      <span v-else class="text-5xl drop-shadow-sm">{{ kind.emoji }}</span>
    </div>

    <div class="flex flex-col gap-1 mt-auto">
      <span class="font-bold text-black/80 leading-tight line-clamp-2">{{ collection.name }}</span>
      <span class="flex items-center gap-1.5 text-xs text-black/55">
        <span class="px-2 py-0.5 rounded-full bg-white/70 font-semibold">{{ kind.emoji }} {{ kind.label }}</span>
        {{ collection.items.length }} {{ collection.items.length === 1 ? 'elemento' : 'elementos' }}
      </span>
    </div>
  </div>
</template>
