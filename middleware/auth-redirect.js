import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth();

  if (!user.value) {
    await fetchUser();
  }

  if (user.value && to.path === "/") {
    return navigateTo("/home");
  }
});
