// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", "nuxt-icon", "nuxt-headlessui"],
  css: ["@fontsource/inter/variable.css"],
  typescript: {
    strict: true,
  },
  vite: {
    // server: {
    //   headers: {
    //     "Cross-Origin-Embedder-Policy": "require-corp",
    //     "Cross-Origin-Opener-Policy": "same-origin",
    //   },
    // },
    plugins: [
      {
        name: "configure-response-headers",
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
            next()
          })
        },
      },
    ],
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
      // script: [
      //   {
      //     src: "/workers/sqlite/sqlite-worker.js",
      //     type: "module",
      //     defer: false,
      //   },
      // ],
      // Prevent arbitrary zooming on mobile devices
      viewport:
        "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover",
      bodyAttrs: {
        class: "overflow-x-hidden",
      },
    },
  },
})
