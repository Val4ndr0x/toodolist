<script setup lang="ts">
import type { CollectionItem } from '~/composables/useCollections'
import { youtubeId, youtubeThumbnail } from '~/utils/youtube'

const props = defineProps<{ item: CollectionItem; fallbackEmoji: string }>()
const emit = defineEmits<{ open: [id: string] }>()

const videoId = computed(() => youtubeId(props.item.link))
const cover = computed(() => props.item.image ?? (videoId.value ? youtubeThumbnail(videoId.value) : null))
const imageFailed = ref(false)
watch(cover, () => (imageFailed.value = false))
</script>

<template>
  <button
    type="button"
    class="group flex flex-col text-left gap-2 rounded-[18px] p-2 bg-white/70 dark:bg-surface-soft/70 shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all"
    @click="emit('open', item.id)"
  >
    <div class="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/5 dark:bg-surface flex items-center justify-center">
      <img
        v-if="cover && !imageFailed"
        :src="cover"
        :alt="item.title"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover"
        @error="imageFailed = true"
      />
      <span v-else class="text-4xl">{{ fallbackEmoji }}</span>
      <span
        v-if="videoId"
        class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#ff0033] text-white text-[10px] font-bold flex items-center gap-0.5 shadow"
        title="Tiene video de YouTube"
      >
        ▶ YouTube
      </span>
    </div>
    <div class="px-1 pb-1 flex flex-col gap-0.5 min-w-0">
      <span class="font-semibold text-sm text-black/80 dark:text-ink leading-tight line-clamp-2">{{ item.title }}</span>
      <span v-if="item.creator" class="text-xs text-black/50 dark:text-muted truncate">{{ item.creator }}</span>
      <span v-if="item.rating" class="text-xs text-amber-500 tracking-tight" :title="`${item.rating} de 5`">
        {{ '★'.repeat(item.rating) }}<span class="text-black/15 dark:text-white/15">{{ '★'.repeat(5 - item.rating) }}</span>
      </span>
    </div>
  </button>
</template>
