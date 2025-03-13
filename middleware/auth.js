const { getters, actions } = authStore;
const { setUser } = actions;
const { userIsSet } = toRefs(getters);

export default defineNuxtRouteMiddleware(async (to) => {
    if  (process.server) {
        await setUser()
    } else if (!unref(userIsSet)) {
        await setUser()
    }
    if (unref(userIsSet) && to.name === "index") {
        return navigateTo("/home");
    }
    if (!unref(userIsSet) && to.name !== "index") {
        return navigateTo("/");
    }
});
