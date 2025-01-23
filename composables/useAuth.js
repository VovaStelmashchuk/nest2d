import { ref } from "vue";
import { useFetch } from "#app";

const user = ref(null);

export function useAuth() {
  async function fetchUser() {
    const { data, error } = await useFetch("/api/user", {
      credentials: "include",
    });

    if (error.value) {
      console.error("Failed to fetch user:", error.value);
      return null;
    }

    user.value = data.value;
    return user.value;
  }

  return {
    user,
    fetchUser,
  };
}
