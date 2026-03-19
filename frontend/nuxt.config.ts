// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  modules: ["@nuxt/eslint", "@nuxt/fonts", "shadcn-nuxt"],
  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },

  fonts: {
    // Options
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
