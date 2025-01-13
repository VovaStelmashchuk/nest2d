export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      secretFile: ".secret.json",
    },
  },
  nitro: {
    hooks: {
      "server:setup": async () => {
        console.log("Server setup hook");
      },
    },
  },
});
