// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&display=swap",
        },
      ],
    },
  },
  modules: ["@nuxt/eslint", "shadcn-nuxt", "@pinia/nuxt", "@nuxtjs/color-mode"],
  vite: {
    plugins: [tailwindcss()],
  },
  colorMode: {
    classSuffix: "",
    storageKey: "color-mode",
    preference: "dark",
    fallback: "dark",
  },

  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || "http://localhost:3001",
    },
  },
  router: {
    options: {
      linkActiveClass: "active-link",
      linkExactActiveClass: "exact-active-link",
    },
  },
});
