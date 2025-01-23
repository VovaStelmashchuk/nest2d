<template>
  <div class="pt-4">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      Your Projects
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="project in data.projects" :key="project.id">
        <UserProjectItem
          :key="project.slug"
          :imageSvg="project.imageSvg"
          :slug="project.slug"
          :text="project.name"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const { data, pending, error } = await useFetch("/api/project/me", {
  credentials: "include",
});
</script>
