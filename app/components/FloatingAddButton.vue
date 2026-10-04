<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Nueva lista' })
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="fab group fixed bottom-20 sm:bottom-6 right-6 h-16 min-w-16 rounded-full bg-accent text-white shadow-lg flex items-center justify-center gap-0 hover:gap-2 hover:pl-5 hover:pr-6 hover:-translate-y-1 hover:shadow-xl active:scale-90 transition-all duration-200 z-20"
    :aria-label="label"
    @click="$emit('click')"
  >
    <span class="fab-ring absolute inset-0 rounded-full bg-accent pointer-events-none" aria-hidden="true" />
    <AppIcon name="plus" :size="28" class="relative transition-transform duration-300 group-hover:rotate-90" />
    <span class="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:max-w-[11rem] group-hover:opacity-100 group-focus-visible:max-w-[11rem] group-focus-visible:opacity-100">{{ label }}</span>
  </button>
</template>

<style scoped>
.fab-ring {
  animation: fab-ring 2.8s ease-out infinite;
}
@keyframes fab-ring {
  0% {
    transform: scale(1);
    opacity: 0.45;
  }
  70%,
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fab-ring {
    animation: none;
    display: none;
  }
}
</style>
