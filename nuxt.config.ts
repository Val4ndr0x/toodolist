// https://nuxt.com/docs/api/configuration/nuxt-config
// En GitHub Pages de un repo de proyecto la app vive en /<repo>/ (NUXT_APP_BASE_URL); en local y en la raíz es '/'.
const base = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/?$/, '/')

/** Las rutas a /stickers, /sprints, /notes e /icons están escritas como absolutas en el código: con un prefijo de despliegue hay que anteponerlo. */
const prefixPublicAssets = {
  name: 'prefix-public-assets',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (base === '/' || !/[\\/]app[\\/].*\.(ts|vue)(\?|$)/.test(id)) return null
    const out = code.replace(/(['"`(])\/(stickers|sprints|notes|icons)\//g, `$1${base}$2/`)
    return out === code ? null : { code: out, map: null }
  },
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  // Se llena con la variable de entorno NUXT_GEMINI_API_KEY (solo servidor, nunca llega al navegador).
  runtimeConfig: {
    geminiApiKey: '',
    public: {
      // Sincronización en la nube. La clave "publishable" es pública por diseño (las reglas RLS de la
      // tabla protegen los datos); se puede cambiar con NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY.
      supabaseUrl: 'https://cjulneqvmemhqxasgouu.supabase.co',
      supabaseKey: 'sb_publishable_nEqsIyy_YwOVhObjfpiIHA_2zBgMTn_',
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  vite: { plugins: [prefixPublicAssets] },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mis Tareas',
      short_name: 'Tareas',
      description: 'Tus tareas, libros, tablero y a Mapachín en un solo lugar.',
      lang: 'es',
      theme_color: '#131316',
      background_color: '#131316',
      display: 'standalone',
      orientation: 'any',
      start_url: base,
      scope: base,
      icons: [
        { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: base,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff2}'],
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      // La ruta del chat con IA y las fuentes de Google necesitan red; el resto funciona sin conexión.
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
        },
      ],
    },
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },
  css: ['~/assets/css/theme.css'],
  app: {
    baseURL: base,
    head: {
      title: 'Mis Tareas',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#131316' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Tareas' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'apple-touch-icon', href: `${base}icons/apple-touch-icon.png` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Fredoka&family=Indie+Flower&family=Lobster&family=Merriweather&family=Pacifico&family=Patrick+Hand&family=Special+Elite&display=swap'
        }
      ]
    }
  }
})
