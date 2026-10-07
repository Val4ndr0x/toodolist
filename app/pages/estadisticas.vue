<script setup lang="ts">
</script>

<template>
  <div class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0">
      <AppHeader title="Estadísticas" />
      <ProductivityStats />
      <FinanceStats />
    </div>
  </div>
</template>
