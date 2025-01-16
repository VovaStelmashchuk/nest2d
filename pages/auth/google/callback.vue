<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"
      ></div>
      <h1 class="mt-6 text-xl font-semibold text-gray-700">
        Authenticating...
      </h1>
      <p class="text-gray-500">
        Please wait a moment while we process your authentication.
      </p>
    </div>
  </div>
</template>

<script setup>
import { navigateTo } from "nuxt/app";

onMounted(async () => {
  const route = useRoute();
  const hash = route.hash.substring(1);

  const params = hash.split("&").reduce((acc, item) => {
    const [key, value] = item.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const accessToken = params.access_token;

  const request = {
    googleAccessToken: accessToken,
  };

  const response = await $fetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  navigateTo("/home");
});
</script>
