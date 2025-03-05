import { computed, reactive, readonly } from "vue";
import { useFetch } from "nuxt/app";

const state = reactive({
    userIsSet: false,
    user:  {}
})

const API_ROUTES = {
    USER: "/api/user",
    LOGOUT: "/api/auth/logout",
};

async function setUser() {
    try {
        const { data } = await useFetch(API_ROUTES.USER, {
            credentials: "include",
        });
        const userData = unref(data);
        if(userData && Boolean(userData.id)) {
            state.user = {...unref(data)}
            state.userIsSet = true
        }
    } catch (error) {
        console.error("Failed to set user:", error);
        state.userIsSet = false
    }
}

async function logout() {
    try {
        await fetch(API_ROUTES.LOGOUT, {
            method: "POST",
            credentials: "include",
        });
        state.userIsSet = false
    } catch (err) {
        console.error("Logout failed:", err);
    }
}

export const authStore = readonly({
    getters: {
        user: computed(() => state.user),
        userIsSet: computed(() => state.userIsSet)
    },
    actions: {
        setUser,
        logout
    }
})