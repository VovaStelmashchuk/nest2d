<template>
  <NuxtLink to="/upload">
    <div
      class="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg py-4 shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full"
    >
      <div
        class="flex items-center justify-center w-16 h-16 bg-black rounded-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 class="mt-4 text-lg font-semibold text-black">Upload New Project</h3>
    </div>
  </NuxtLink>
</template>

<script setup></script>

<style scoped></style>
