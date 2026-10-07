<script setup lang="ts">
const { hasCompanion, character, userName, companionName, hunger, thirst } = useCompanion()
const welcomeAnim = computed(() => (hunger.value < 15 || thirst.value < 15 ? MAPACHIN_ANIMS.abandoned : MAPACHIN_ANIMS.welcome))

// Only true when a companion already existed at load time (i.e. a page
// reload), so the freshly-finished onboarding doesn't show this twice.
const showWelcome = ref(hasCompanion.value)

// Pantallas a pantalla completa (como la de inicio de sesión) no llevan barra de pestañas ni compañero.
const route = useRoute()
const bare = computed(() => !!route.meta.bare)

onMounted(() => {
  if (showWelcome.value) {
    window.setTimeout(() => {
      showWelcome.value = false
    }, 1600)
  }
})
</script>

<template>
  <div class="min-h-screen bg-base font-sans text-ink pb-16 sm:pb-0">
    <NuxtRouteAnnouncer />
    <CompanionOnboarding v-if="!hasCompanion" />
    <div
      v-else-if="showWelcome && character"
      class="fixed inset-0 z-50 bg-base flex flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <CompanionSprite :character="welcomeAnim" :size="160" :speed="1.2" />
      <p class="text-lg font-semibold text-ink">¡Hola de nuevo, {{ userName }}! Soy {{ companionName }} 👋</p>
    </div>
    <template v-else>
      <NuxtPage />
      <MobileTabBar v-if="!bare" />
      <CalendarAlarmBanner />
      <CompanionBadge v-if="!bare" />
      <CafeToast />
      <AmbientBackground />
      <RewardToast />
      <ConfettiLayer />
      <GlobalSearch />
      <CloudSyncBanner />
    </template>
  </div>
</template>
