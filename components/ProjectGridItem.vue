<template>
  <div
    class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
  >
    <div class="relative w-full aspect-square">
      <img :src="imageSrc" :alt="imageAlt" class="w-full h-full object-cover" />
    </div>

    <div class="p-4 text-center text-2xl font-semibold text-black line-clamp-2">
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProjectGridItem",
  props: {
    imageSrc: {
      type: String,
      required: false,
    },
    imageAlt: {
      type: String,
      default: "Grid Item Image",
    },
    text: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
/* Optional: Add any additional styles if necessary */
</style>
