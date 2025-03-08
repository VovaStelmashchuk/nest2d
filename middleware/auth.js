const { getters, actions } = authStore;
const { setUser } = actions;
const userIsSet = computed(() => getters.userIsSet);

const names = ["home", "profile", "project-slug"]
export default defineNuxtRouteMiddleware(async (to) => {
    if (!unref(userIsSet)) {
        await setUser();
    }
    if (unref(userIsSet) && to.name === "index") {
        return navigateTo("/home");
    }
    if (!unref(userIsSet) && names.includes(to.name)) {
        return navigateTo("/");
    }
});
