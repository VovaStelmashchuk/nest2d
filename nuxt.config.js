import { schemaWebSite } from './utils/schema'

export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss"],
    runtimeConfig: {
        discordToken: "",
        gmailAppPassword: "",
        mongoUri: '',
        stripeSecretKey: '',
        githubClientSecret: '',
        public: {
            baseUrl: "http://localhost:3000",
            gitCommitSha: "",
            googleClientId: "",
            discordGuildId: "",
        },
    },

    css: [
        '@/assets/css/main.css',
    ],

    plugins: [
        '@/plugins/theme.js'
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
        },
        build: {
            minify: 'terser',
            chunkSizeWarningLimit: 1000,
        }
    },

    site: {
        url: 'https://nest2d.stelmashchuk.dev/',
        name: 'Nest2D'
    },

    app: {
        head: {
            htmlAttrs: {
                lang: 'en'
            },
            title: 'Nest2D - Smart Nesting for Laser Cutting and CNC machining',
            meta: [
                { charset: 'utf-8' },
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1'
                },
                {
                    hid: 'description',
                    name: 'description',
                    content: 'The service for nesting DXF files. Nest2D optimize your material usage. Fully open-source and built for efficiency.'
                },
                {
                    hid: 'keywords',
                    name: 'keywords',
                    content: 'Nest DXF online, DXF files, material dimensions, Nest2D, maximize material usage, open-source, efficiency, smart nesting, laser cutting'
                },
                {
                    hid: 'robots',
                    name: 'robots',
                    content: 'index, follow'
                },
                {
                    hid: 'author',
                    name: 'author',
                    content: 'Nest2D'
                }
            ],
            link: [
                {
                    rel: 'apple-touch-icon',
                    sizes: '180x180',
                    href: '/favicon/apple-touch-icon.png'
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '32x32',
                    href: '/favicon/favicon-32x32.png'
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '16x16',
                    href: '/favicon/favicon-16x16.png'
                },
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    href: '/favicon/favicon.ico'
                }
            ],
            script: [
                {
                    async: true,
                    type: 'application/ld+json',
                    children: JSON.stringify(schemaWebSite)
                },
                {
                    children: `
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "rxfyyl4lhb");
                    `,
                    type: 'text/javascript'
                }
            ]
        }
    },

    nitro: {
        compressPublicAssets: true,
        routeRules: {
            '/icons/**': {
                headers: {
                    'cache-control': 'public,max-age=31536000,s-maxage=31536000,immutable'
                }
            },
            '/fonts/**': {
                headers: {
                    'cache-control': 'public,max-age=31536000,s-maxage=31536000,immutable'
                }
            },
            '/_nuxt/**': {
                headers: {
                    'cache-control': 'public,max-age=31536000,immutable'
                }
            },
            '/**': {
                headers: {
                    'cache-control': 'public,max-age=0,s-maxage=86400,stale-while-revalidate'
                }
            }
        }
    },

    experimental: {
        payloadExtraction: true
    },

    build: {
        extractCSS: true,
    },
});
