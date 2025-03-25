export default defineNuxtPlugin(() => {
    const themeCookie = useCookie('theme');
    if (themeCookie.value) {
        if (process.client) {
            document.documentElement.setAttribute('data-theme', themeCookie.value);
        } else if (process.server) {
            useHead({
                htmlAttrs: {
                    'data-theme': themeCookie.value
                }
            });
        }
    }
});