<script setup lang="ts">
defineProps<{
  name:
    | 'compass'
    | 'store'
    | 'help'
    | 'trash'
    | 'crown'
    | 'gift'
    | 'search'
    | 'dots'
    | 'book'
    | 'checklist'
    | 'arrow-left'
    | 'plus'
    | 'x'
    | 'sticker'
    | 'star'
    | 'star-filled'
    | 'cloud'
    | 'move'
    | 'user'
    | 'calendar'
    | 'coin'
    | 'board'
    | 'template'
    | 'image'
    | 'zoom-in'
    | 'zoom-out'
    | 'target'
    | 'select'
    | 'palette'
    | 'bell'
    | 'bell-off'
    | 'lock'
    | 'chart'
    | 'edit'
    | 'settings'
    | 'moon'
    | 'link'
    | 'rotate'
    | 'nodes'
    | 'coffee'
    | 'music'
    | 'volume'
    | 'volume-off'
    | 'rain'
    | 'chat'
    | 'food'
    | 'shirt'
    | 'run'
    | 'brain'
    | 'paper'
    | 'undo'
    | 'redo'
    | 'collection'
  size?: number
}>()
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="name === 'compass'">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5l-2 5-3 1.5 2-5z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'store'">
      <path d="M4 9l1-4h14l1 4" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M10 19v-5h4v5" />
    </template>
    <template v-else-if="name === 'help'">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 1 1 3.6 2.2c-.9.5-1.1 1-1.1 1.9" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </template>
    <template v-else-if="name === 'crown'">
      <path d="M4 18h16" />
      <path d="M4 18l-1-9 5 4 4-7 4 7 5-4-1 9z" />
    </template>
    <template v-else-if="name === 'gift'">
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M4 12h16" />
      <path d="M12 9v11" />
      <path d="M12 9C10 9 8.5 7.8 8.5 6.3 8.5 5 9.5 4 10.7 4 11.9 4 12 6 12 9z" />
      <path d="M12 9c2 0 3.5-1.2 3.5-2.7C15.5 5 14.5 4 13.3 4 12.1 4 12 6 12 9z" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </template>
    <template v-else-if="name === 'dots'">
      <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5z" />
      <path d="M8 4v16" />
    </template>
    <template v-else-if="name === 'checklist'">
      <path d="M9 6h10M9 12h10M9 18h10" />
      <path d="M4.5 6l1 1 2-2M4.5 12l1 1 2-2M4.5 18l1 1 2-2" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'x'">
      <path d="M6 6l12 12M18 6L6 18" />
    </template>
    <template v-else-if="name === 'sticker'">
      <path d="M8 4h8a4 4 0 0 1 4 4v6l-6 6H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
      <path d="M14 20v-4a2 2 0 0 1 2-2h4" />
    </template>
    <template v-else-if="name === 'star'">
      <path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.7z" />
    </template>
    <template v-else-if="name === 'star-filled'">
      <path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.7z" fill="currentColor" />
    </template>
    <template v-else-if="name === 'coffee'">
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3.5c-1 1 1 2 0 3.5M12 3.5c-1 1 1 2 0 3.5" />
    </template>
    <template v-else-if="name === 'music'">
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
    </template>
    <template v-else-if="name === 'volume'">
      <path d="M4 10v4h3.5L12 18V6L7.5 10H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </template>
    <template v-else-if="name === 'volume-off'">
      <path d="M4 10v4h3.5L12 18V6L7.5 10H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </template>
    <template v-else-if="name === 'rain'">
      <path d="M7 15a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 6 4.5 4.5 0 0 1 16 15H7z" />
      <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
    </template>
    <template v-else-if="name === 'cloud'">
      <path d="M7 17a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 8 4.5 4.5 0 0 1 16 17H7z" />
    </template>
    <template v-else-if="name === 'move'">
      <path d="M12 3v18M3 12h18" />
      <path d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5" />
      <path d="M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16" />
      <path d="M8 3.5v3.5M16 3.5v3.5" />
    </template>
    <template v-else-if="name === 'coin'">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M9.3 9.6c0-1.1 1.2-2 2.7-2s2.7.7 2.7 1.8-1.2 1.6-2.7 1.9-2.7.8-2.7 1.9 1.2 1.8 2.7 1.8 2.7-.9 2.7-2" />
    </template>
    <template v-else-if="name === 'template'">
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M4 9h16" />
      <path d="M10 9v11.5" />
      <path d="M13 13.5h4M13 16.5h4" />
    </template>
    <template v-else-if="name === 'board'">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <rect x="6" y="7" width="4.5" height="4.5" rx="0.8" fill="currentColor" stroke="none" opacity="0.9" />
      <rect x="13" y="7" width="4.5" height="3" rx="0.8" fill="currentColor" stroke="none" opacity="0.6" />
      <rect x="13" y="11.5" width="4.5" height="4" rx="0.8" fill="currentColor" stroke="none" opacity="0.9" />
      <rect x="6" y="13" width="4.5" height="3.5" rx="0.8" fill="currentColor" stroke="none" opacity="0.6" />
    </template>
    <template v-else-if="name === 'image'">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M4 17l5-5 3.5 3.5L16 12l4 4.5" />
    </template>
    <template v-else-if="name === 'zoom-in'">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M10.5 7.5v6M7.5 10.5h6" />
      <path d="M15.3 15.3L20 20" />
    </template>
    <template v-else-if="name === 'zoom-out'">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M7.5 10.5h6" />
      <path d="M15.3 15.3L20 20" />
    </template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </template>
    <template v-else-if="name === 'select'">
      <rect x="3.5" y="3.5" width="12" height="12" rx="2" stroke-dasharray="3 2.5" />
      <path d="M11.5 11.5l9 3.2-3.9 1.7-1.7 3.9z" fill="currentColor" />
    </template>
    <template v-else-if="name === 'palette'">
      <path d="M12 3.5a8.5 8 0 1 0 0 16c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.2-.3-.4-.6-.4-1 0-.8.7-1.4 1.5-1.4h1.8a3.5 3.3 0 0 0 3.4-3.4C19.5 7 16.2 3.5 12 3.5z" />
      <circle cx="7.2" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </template>
    <template v-else-if="name === 'bell-off'">
      <path d="M6 10.5a6 6 0 0 1 9.8-4.6" />
      <path d="M18 10.5c0 3.5 1 5 2 6H8" />
      <path d="M4.5 16.5H6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
      <path d="M3.5 3.5l17 17" />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.8" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="14.7" r="1.2" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20h16" />
      <rect x="6" y="12" width="3" height="6" rx="0.6" fill="currentColor" stroke="none" />
      <rect x="10.5" y="8" width="3" height="10" rx="0.6" fill="currentColor" stroke="none" />
      <rect x="15" y="14" width="3" height="4" rx="0.6" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M14.5 4.5l5 5L8 21l-5.5 1L3.5 16.5z" />
      <path d="M12.5 6.5l5 5" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7L16 16M8 8L6.3 6.3" />
    </template>
    <template v-else-if="name === 'link'">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </template>
    <template v-else-if="name === 'rotate'">
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </template>
    <template v-else-if="name === 'nodes'">
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="10" cy="18" r="2.5" />
      <path d="M8.3 7l7.3.7M7.4 8.6l1.6 7M16.8 10.2l-5 6" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </template>
    <template v-else-if="name === 'chat'">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </template>
    <template v-else-if="name === 'food'">
      <path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6" />
      <path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8 0 1.5 1 2.5 3.5 2.5" />
    </template>
    <template v-else-if="name === 'shirt'">
      <path d="M8.5 3L3 6l2 4.5 2.5-1V20h9V9.5l2.5 1L21 6l-5.5-3a3.5 3.5 0 0 1-7 0z" />
    </template>
    <template v-else-if="name === 'run'">
      <circle cx="14" cy="4.5" r="1.8" />
      <path d="M8 21l3-5-2.5-2.5 2-4.5 3.5 2 2 3.5M8 12l-2.5 1.5M12.5 9.5L16 8" />
      <path d="M13 16l3 1.5 1 3.5" />
    </template>
    <template v-else-if="name === 'brain'">
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1.5V5.5A2.5 2.5 0 0 0 9 4z" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1.5V5.5A2.5 2.5 0 0 1 15 4z" />
    </template>
    <template v-else-if="name === 'paper'">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14.5 3v4.5H19M9 12h7M9 15.5h7M9 19h4" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="M4 8h9a5 5 0 0 1 0 10h-6" />
      <path d="M8 4L4 8l4 4" />
    </template>
    <template v-else-if="name === 'collection'">
      <rect x="4" y="4" width="4" height="16" rx="1" />
      <rect x="9.5" y="6" width="4" height="14" rx="1" />
      <path d="M15.2 7.4l3.6-1 3 12.6-3.6 1z" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="M20 8h-9a5 5 0 0 0 0 10h6" />
      <path d="M16 4l4 4-4 4" />
    </template>
  </svg>
</template>
