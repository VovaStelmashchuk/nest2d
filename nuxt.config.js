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
    css: [
        '@/assets/css/main.css',
    ],
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `
                        @import "./assets/scss/variables.scss";
                        @import "./assets/scss/mixins.scss";
                        @import "./assets/scss/fonts.scss";
                        @import "./assets/scss/global.scss";
                    `
                }
            }
        }
    },
});
