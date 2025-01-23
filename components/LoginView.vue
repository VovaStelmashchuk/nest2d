<template>
  <div class="container p-4 pb-6">
    <h1 class="text-2xl font-bold text-center text-black pb-4">
      Login to your account
    </h1>
    <button
      @click="doAuth('github')"
      class="flex items-center justify-center w-full rounded-lg border hover:shadow"
    >
      <div class="py-2 flex gap-2 text-slate-700 transition duration-150">
        <img
          class="w-6 h-6"
          src="/github-logo.svg"
          loading="lazy"
          alt="github logo"
        />
        <span>Login with Github</span>
      </div>
    </button>
    <button
      @click="doAuth('google')"
      class="mt-4 flex items-center justify-center w-full rounded-lg border hover:shadow"
    >
      <div class="py-2 flex gap-2 text-slate-700 transition duration-150">
        <img
          class="w-6 h-6"
          src="/google-logo.svg"
          loading="lazy"
          alt="google logo"
        />
        <span>Login with Google</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="js">
import {navigateTo} from 'nuxt/app';

const doAuth = async (provider) => {
  const response = await $fetch(`/api/auth/${provider}/redirect`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  navigateTo(response.url, { external: true });
}
</script>
