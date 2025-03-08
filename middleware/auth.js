const { getters, actions } = authStore;
const { setUser } = actions;

export default defineNuxtRouteMiddleware(async (to) => {
    try {
        const { data } = await useFetch("/api/user")
        const userData = unref(data);
        if (userData && Boolean(userData.id)) {
            setUser(userData)

            if (userData && to.name === "index") {
                return navigateTo("/home");
            }
        }
        if ((!userData || !Boolean(userData.id)) && to.name !== "index") {
            return navigateTo("/");
        }
       

    }   catch (error) {
        console.error("Failed to set user:", error);
    }
});
