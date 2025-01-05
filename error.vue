<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-black text-white"
  >
    <h1 class="text-9xl font-extrabold tracking-wider">404</h1>
    <p class="mt-4 text-xl font-light uppercase tracking-widest">
      Page Not Found
    </p>
    <div class="mt-6">
      <NuxtLink
        to="/"
        class="px-6 py-3 text-lg font-semibold border border-white rounded-md hover:bg-white hover:text-black transition-all duration-300"
      >
        Go Home
      </NuxtLink>
    </div>
  </div>
</template>
