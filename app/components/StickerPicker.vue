<script setup lang="ts">
import type { StickerType } from '~/composables/useBooks'
import type { BoardItemType } from '~/composables/useBoard'
import { STICKER_OPTIONS, DECOR_OPTIONS, TRACKER_OPTIONS, LANGUAGE_OPTIONS, BANNER_OPTIONS, BUSINESS_OPTIONS, BOARD_ONLY_OPTIONS, type StickerOption } from '~/utils/stickerOptions'
import { COLLECTIBLES, passCollectible, type Collectible } from '~/utils/casitaData'

/** `board`: se muestran además las opciones exclusivas del tablero (p. ej. el mini kanban), que no existen en las páginas de libros. */
const props = defineProps<{ board?: boolean }>()
const emit = defineEmits<{ close: []; pick: [type: StickerType | BoardItemType, data: Record<string, any>, opt?: StickerOption] }>()

const groups = computed(() => [
  { title: 'Encabezados de sección', items: BANNER_OPTIONS },
  { title: 'Negocio', items: props.board ? [...BUSINESS_OPTIONS, ...BOARD_ONLY_OPTIONS] : BUSINESS_OPTIONS },
  { title: 'Seguimiento del día', items: TRACKER_OPTIONS },
  { title: 'Estudio de idiomas', items: LANGUAGE_OPTIONS },
  { title: 'Decoración scrapbook', items: DECOR_OPTIONS },
])

const { collection } = useRewards()

// Solo aparecen los coleccionables que ya ganaste.
const owned = computed<Collectible[]>(() => {
  const ids = Object.keys(collection.value)
  return ids.map((id) => COLLECTIBLES.find((c) => c.id === id) ?? passCollectible(id)).filter((c): c is Collectible => !!c)
})

function pickCollectible(c: Collectible) {
  emit('pick', 'emoji', { emoji: c.emoji, label: c.label }, { type: 'emoji', label: c.label, free: true, rot: 0, data: {} })
}

const showGallery = ref(false)

function onGalleryPick(image: string, label: string) {
  emit('pick', 'image', { src: image, label })
  showGallery.value = false
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50" @click.self="emit('close')">
    <div class="w-full sm:max-w-md bg-surface rounded-t-xl2 sm:rounded-xl2 p-5 flex flex-col gap-4 border border-border max-h-[80vh]">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-ink">Agregar sticker</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="overflow-y-auto flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="(opt, i) in STICKER_OPTIONS"
            :key="i"
            type="button"
            class="flex flex-col items-center gap-2 p-4 rounded-xl2 bg-surface-soft hover:bg-accent-soft hover:text-accent-deep text-ink transition-colors text-center"
            @click="emit('pick', opt.type, opt.data, opt)"
          >
            <AppIcon :name="opt.icon!" :size="22" />
            <span class="text-xs font-medium leading-tight">{{ opt.label }}</span>
          </button>
        </div>

        <div v-for="group in groups" :key="group.title">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-0.5">{{ group.title }}</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="(opt, i) in group.items"
              :key="i"
              type="button"
              class="flex flex-col items-center gap-1 p-2.5 rounded-xl2 bg-surface-soft hover:bg-accent-soft hover:text-accent-deep text-ink transition-colors text-center"
              @click="emit('pick', opt.type, opt.data, opt)"
            >
              <img v-if="opt.image" :src="opt.image" :alt="opt.label" class="w-7 h-7 object-contain" />
              <span v-else class="text-2xl leading-none">{{ opt.emoji }}</span>
              <span class="text-[11px] font-medium leading-tight">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div v-if="owned.length">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-0.5">Mi colección ({{ owned.length }})</h3>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="c in owned"
              :key="c.id"
              type="button"
              class="aspect-square rounded-xl2 bg-surface-soft hover:bg-accent-soft flex items-center justify-center text-2xl leading-none transition-colors"
              :title="c.label"
              @click="pickCollectible(c)"
            >
              {{ c.emoji }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-0.5">Integrar stickers</h3>

          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl2 bg-surface-soft hover:bg-accent-soft hover:text-accent-deep text-ink transition-colors text-sm font-semibold"
            @click="showGallery = true"
          >
            <AppIcon name="search" :size="16" />
            Ver todos los stickers
          </button>
        </div>
      </div>
    </div>

    <StickerGallery v-if="showGallery" @close="showGallery = false" @pick="onGalleryPick" />
  </div>
</template>
