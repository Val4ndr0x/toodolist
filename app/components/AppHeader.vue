<script setup lang="ts">
const props = defineProps<{
  title: string
  titleFont?: string
  showBack?: boolean
  searchable?: boolean
  searchModel?: string
  searchPlaceholder?: string
}>()

const emit = defineEmits<{
  back: []
  'update:searchModel': [value: string]
}>()

const searchOpen = ref(false)
const showBackup = ref(false)
const showSettings = ref(false)
const { open: globalSearchOpen } = useGlobalSearch()

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) emit('update:searchModel', '')
}
</script>

<template>
  <header class="flex items-center gap-3 px-4 sm:px-6 py-4">
    <button
      v-if="showBack"
      type="button"
      class="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-ink shrink-0"
      @click="emit('back')"
    >
      <AppIcon name="arrow-left" :size="20" />
    </button>
    <button
      v-else
      type="button"
      class="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center text-accent-deep shrink-0"
    >
      <AppIcon name="book" :size="20" />
    </button>

    <div class="flex-1 min-w-0">
      <input
        v-if="searchable && searchOpen"
        :value="searchModel"
        type="text"
        autofocus
        :placeholder="searchPlaceholder ?? 'Buscar listas...'"
        class="w-full bg-surface text-ink placeholder-muted rounded-full px-4 py-2 outline-none border border-border focus:border-accent"
        @input="emit('update:searchModel', ($event.target as HTMLInputElement).value)"
      />
      <h1 v-else class="text-xl sm:text-2xl font-bold text-ink truncate" :style="{ fontFamily: fontFamilyFor(titleFont) }">{{ title }}</h1>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button
        v-if="searchable"
        type="button"
        class="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
        @click="toggleSearch"
      >
        <AppIcon :name="searchOpen ? 'x' : 'search'" :size="19" />
      </button>
      <button
        type="button"
        title="Buscar en toda la app (Ctrl+K)"
        aria-label="Buscar en toda la app"
        class="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
        @click="globalSearchOpen = true"
      >
        <AppIcon name="compass" :size="19" />
      </button>
      <button type="button" title="Premium" class="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors">
        <AppIcon name="crown" :size="19" />
      </button>
      <button type="button" title="Recompensas" class="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors">
        <AppIcon name="gift" :size="19" />
      </button>
      <button
        type="button"
        title="Configuración"
        class="w-10 h-10 rounded-full flex sm:hidden items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
        @click="showSettings = true"
      >
        <AppIcon name="settings" :size="19" />
      </button>
      <button
        type="button"
        title="Respaldo de datos"
        class="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
        @click="showBackup = true"
      >
        <AppIcon name="dots" :size="19" />
      </button>
    </div>
  </header>

  <BackupModal v-if="showBackup" @close="showBackup = false" />
  <SettingsModal v-if="showSettings" @close="showSettings = false" />
</template>
