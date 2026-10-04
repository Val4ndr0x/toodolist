<script setup lang="ts">
const props = defineProps<{ data: Record<string, any> }>()
const emit = defineEmits<{ update: [data: Record<string, any>]; remove: [] }>()

const text = computed({
  get: () => props.data.text ?? '',
  set: (value: string) => emit('update', { text: value }),
})

const textColor = computed(() => (props.data.color && props.data.color !== 'transparent' ? props.data.color : null))
</script>

<template>
  <div class="relative w-full h-full group">
    <button
      type="button"
      class="absolute top-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center text-black/30 hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      :style="{ color: textColor ?? 'var(--bare-ink)' }"
      @click="emit('remove')"
    >
      <AppIcon name="x" :size="14" />
    </button>
    <textarea
      v-model="text"
      placeholder="Escribe aquí..."
      class="board-text-field w-full h-full resize-none bg-transparent outline-none text-base leading-snug pr-6"
      :style="{ color: textColor ?? 'var(--bare-ink)' }"
    />
  </div>
</template>

<style scoped>
.board-text-field::placeholder {
  color: var(--bare-ink);
  opacity: 0.4;
}
</style>
