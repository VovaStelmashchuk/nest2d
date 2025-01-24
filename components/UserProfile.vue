<template>
  <div class="bg-white p-6 flex items-center">
    <div class="ml-4">
      <img
        :src="data.avatar"
        alt="User Avatar"
        class="w-32 h-32 rounded-full border-1 border-black"
      />
    </div>
    <div class="flex-grow text-left px-4">
      <h2 class="text-xl font-semibold text-gray-800">{{ data.name }}</h2>
      <button
        @click="logoutHandler"
        class="mt-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { navigateTo } from "nuxt/app";

const { data, pending, error } = await useFetch("/api/user", {
  credentials: "include",
});

const { user, fetchUser, logout } = useAuth();

const logoutHandler = async () => {
  await logout();
  navigateTo("/");
};
</script>
