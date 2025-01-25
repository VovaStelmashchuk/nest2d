<template>
  <a :href="`/project/${slug}`">
    <div
      class="flex flex-row bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    >
      <img v-if="imageUrl" class="w-32 h-32 mr-4" :src="imageUrl" :alt="text" />

      <div
        class="p-4 text-center text-2xl font-semibold text-black line-clamp-2"
      >
        <slot>{{ text }}</slot>
      </div>
    </div>
  </a>
</template>

<script>
export default {
  name: "ProjectGridItem",
  props: {
    slug: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: true,
    },
  },
};
const navigateToProject = () => {
  console.log("Navigating to project");
};
</script>

<style scoped></style>
