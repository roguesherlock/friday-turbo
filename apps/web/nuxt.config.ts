// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: [
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "nuxt-headlessui",
  ],
  css: ["@fontsource/inter/variable.css"],
  typescript: {
    strict: true,
  },
  vite: {
    build: {
      target: "esnext",
    },
  },
  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
  app: {
    keepalive: true,
    head: {
      // Prevent arbitrary zooming on mobile devices
      viewport:
        "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover",
      bodyAttrs: {
        class: "overflow-x-hidden",
      },
    },
  },
})
