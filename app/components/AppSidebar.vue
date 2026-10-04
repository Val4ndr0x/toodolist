<script setup lang="ts">
const route = useRoute()
const { iconSize } = useNavSize()
const buttonSize = computed(() => `${iconSize.value + 16}px`)
const showBackup = ref(false)
const showSettings = ref(false)

const navItems = [
  { name: 'checklist', label: 'Listas', to: '/' },
  { name: 'book', label: 'Libros', to: '/books' },
  { name: 'board', label: 'Tablero', to: '/tablero' },
  { name: 'collection', label: 'Colecciones', to: '/colecciones' },
  { name: 'calendar', label: 'Calendario', to: '/calendario' },
  { name: 'coffee', label: 'Café', to: '/cafe' },
  { name: 'gift', label: 'Casita', to: '/casita' },
  { name: 'user', label: 'Clientes', to: '/clientes' },
  { name: 'chart', label: 'Estadísticas', to: '/estadisticas' },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <aside class="hidden sm:flex flex-col items-center gap-3 shrink-0 bg-sidebar py-6"
    :style="{ width: `${iconSize + 40}px` }">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :title="item.label"
      :style="{ width: buttonSize, height: buttonSize }"
      class="rounded-full flex items-center justify-center transition-colors"
      :class="isActive(item.to) ? 'bg-accent-soft text-accent-deep' : 'text-muted hover:text-ink hover:bg-surface'"
    >
      <AppIcon :name="item.name" :size="iconSize" />
    </NuxtLink>

    <div class="w-8 border-t border-border my-2" />

    <button
      type="button"
      title="Respaldo"
      :style="{ width: buttonSize, height: buttonSize }"
      class="rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
      @click="showBackup = true"
    >
      <AppIcon name="cloud" :size="iconSize" />
    </button>

    <button
      type="button"
      title="Configuración"
      :style="{ width: buttonSize, height: buttonSize }"
      class="rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
      @click="showSettings = true"
    >
      <AppIcon name="settings" :size="iconSize" />
    </button>
  </aside>

  <BackupModal v-if="showBackup" @close="showBackup = false" />
  <SettingsModal v-if="showSettings" @close="showSettings = false" />
</template>
