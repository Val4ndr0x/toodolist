<script setup lang="ts">
import { BOARD_PATTERNS, boardPatternImage, type BoardPatternId } from '~/utils/boardPatterns'

defineProps<{ modelValue: BoardPatternId; previewColor: string; previewBg: string; opacity: number }>()
const emit = defineEmits<{ pick: [pattern: BoardPatternId]; opacity: [value: number]; close: [] }>()

function preview(id: BoardPatternId, color: string) {
  const image = boardPatternImage(id, color)
  return image === 'none' ? {} : { backgroundImage: image, backgroundSize: '18px 18px' }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70]" @click.self="emit('close')">
    <div class="w-full sm:max-w-sm bg-surface rounded-t-xl2 sm:rounded-xl2 p-5 flex flex-col gap-4 border border-border max-h-[85vh]">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-ink">Fondo del tablero</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="overflow-y-auto grid grid-cols-4 gap-3">
        <button
          v-for="p in BOARD_PATTERNS"
          :key="p.id"
          type="button"
          class="flex flex-col gap-1.5 items-center"
          @click="emit('pick', p.id)"
        >
          <span
            class="block w-full aspect-square rounded-xl2 border-2 transition-transform hover:-translate-y-0.5"
            :class="modelValue === p.id ? 'border-accent' : 'border-border'"
            :style="{ backgroundColor: previewBg, ...preview(p.id, previewColor) }"
          />
          <span class="text-[11px] font-medium text-ink">{{ p.label }}</span>
        </button>
      </div>

      <label class="flex flex-col gap-2" :class="{ 'opacity-50': modelValue === 'none' }">
        <span class="flex items-center justify-between text-sm font-medium text-ink">
          Opacidad de las líneas
          <span class="text-xs text-muted tabular-nums">{{ Math.round(opacity * 100) }}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(opacity * 100)"
          :disabled="modelValue === 'none'"
          class="w-full accent-accent"
          @input="emit('opacity', Number(($event.target as HTMLInputElement).value) / 100)"
        />
        <span class="flex justify-between text-[10px] text-muted">
          <span>Invisible</span>
          <span>Suave</span>
          <span>Marcada</span>
        </span>
        <span v-if="modelValue === 'none'" class="text-[11px] text-muted">Elige un patrón para ajustar sus líneas.</span>
      </label>
    </div>
  </div>
</template>
