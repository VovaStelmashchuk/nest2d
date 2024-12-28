<template>
  <div
    class="relative bg-white border border-gray-200 rounded-lg overflow-hidden aspect-square hover:shadow-lg transition-shadow duration-200 cursor-pointer"
  >
    <div class="absolute top-0 left-0 w-full aspect-video">
      <img :src="imageSrc" :alt="imageAlt" class="w-full h-full object-cover" />
    </div>

    <div
      class="absolute bottom-0 left-0 w-full bg-white bg-opacity-90 p-4 text-center text-lg font-semibold text-black max-h-[44.75%] overflow-hidden"
    >
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
      required: true,
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
