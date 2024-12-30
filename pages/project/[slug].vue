<template>
  <div class="container mx-auto p-4">
    <h2 class="text-3xl font-semibold text-center text-black">Project</h2>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useFetch } from "#app";

const route = useRoute();
const slug = route.params.slug;

console.log(slug);
</script>

<style scoped></style>
