import { computed, reactive, readonly } from "vue";
import { useFetch } from "nuxt/app";

const state = reactive({
    userIsSet: false,
    user:  {}
})

const API_ROUTES = {
    LOGOUT: "/api/auth/logout",
};

function setUser(data) {
    state.user = {...data}
    state.userIsSet = true
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