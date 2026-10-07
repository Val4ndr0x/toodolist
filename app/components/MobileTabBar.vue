<script setup lang="ts">
const route = useRoute()

const { iconSize } = useNavSize()
// En el móvil hay once pestañas en fila, así que el icono no crece más allá de lo que cabe.
const mobileIconSize = computed(() => Math.min(iconSize.value, 26))

const tabs = [
  { name: 'sun', label: 'Hoy', to: '/hoy' },
  { name: 'checklist', label: 'Listas', to: '/' },
  { name: 'book', label: 'Libros', to: '/books' },
  { name: 'board', label: 'Tablero', to: '/tablero' },
  { name: 'collection', label: 'Colecc.', to: '/colecciones' },
  { name: 'calendar', label: 'Calendario', to: '/calendario' },
  { name: 'coffee', label: 'Café', to: '/cafe' },
  { name: 'gift', label: 'Casita', to: '/casita' },
  { name: 'user', label: 'Clientes', to: '/clientes' },
  { name: 'wallet', label: 'Finanzas', to: '/finanzas' },
  { name: 'chart', label: 'Stats', to: '/estadisticas' },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav class="tabbar sm:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border flex overflow-x-auto z-30">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex-1 min-w-[3.25rem] flex flex-col items-center gap-0.5 py-2.5"
      :class="isActive(tab.to) ? 'text-accent' : 'text-muted'"
    >
      <AppIcon :name="tab.name" :size="mobileIconSize" />
      <span class="text-[10px] max-w-full truncate">{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
/* Con once pestañas, en pantallas angostas la barra se desliza de lado. */
.tabbar {
  scrollbar-width: none;
}
.tabbar::-webkit-scrollbar {
  display: none;
}
</style>
