export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      secretFile: ".secret.json",
      baseUrl: "http://localhost:3000",
      gitCommitSha: "",
    },
  },
});
