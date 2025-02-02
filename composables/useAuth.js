import { ref } from "vue";
import { useFetch } from "nuxt/app";

const user = ref(null);

export function useAuth() {
  async function fetchUser() {
    try {
      const { data, error } = await useFetch("/api/user", {
        credentials: "include",
      });
      if (error.value || !data.value) {
        user.value = null;
        return null;
      }
      user.value = data.value;
    } catch (err) {
      user.value = null;
      return null;
    }

    return user.value;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      user.value = null;
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return {
    user,
    fetchUser,
    logout,
  };
}
