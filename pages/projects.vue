<template>
  <div class="container mx-auto p-4">
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div v-if="pending" class="col-span-full text-center text-gray-500">
        Loading projects...
      </div>

      <UploadProjectCard />

      <ProjectGridItem
        v-for="project in data.projects"
        :key="project.slug"
        :imageSrc="project.imageUrl"
        :imageAlt="project.projectName"
        :text="project.projectName"
      />
    </div>
  </div>
</template>

<script setup>
import { useFetch } from "#app";
const { data, pending } = useFetch("/api/projects");
</script>

<style scoped></style>
