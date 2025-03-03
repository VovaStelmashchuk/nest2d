import { computed, reactive, readonly } from "vue";
import { useFetch } from "nuxt/app";

const state = reactive({
    userIsSet: false,
    user:  {}
})

async function setUser() {
    try {
        const { data } = await useFetch("/api/user", {
            credentials: "include",
        });
        if(Boolean(unref(data).id)) {
            state.user = {...unref(data)}
            state.userIsSet = true
        }
    } catch (error) {
        state.userIsSet = false
        return;
    }
}

async function logout() {
    try {
        await fetch("/api/auth/logout", {
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
    mutations: {
        setUser,
        logout
    }
})