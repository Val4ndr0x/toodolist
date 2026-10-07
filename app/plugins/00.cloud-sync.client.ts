// Va primero (prefijo 00): baja los cambios de la nube antes de que cualquier sección lea localStorage.
export default defineNuxtPlugin(async () => {
  await useCloudSync().init()
})
