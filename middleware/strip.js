export default defineNuxtRouteMiddleware(() => {
    const { getters } = authStore;
    const user = unref(getters.user);

    if (!user?.isStripFeatureEnable) {
        return navigateTo("/home");
    }
});
