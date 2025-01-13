<template>
  <div class="container mx-auto p-4">
    <p>{{ data }}</p>
  </div>
</template>

<script setup>
import { useFetch } from "#app";

const route = useRoute();
const slug = route.params.slug;

const { data, pending, error } = await useFetch(`/api/queue/${slug}`);
</script>
