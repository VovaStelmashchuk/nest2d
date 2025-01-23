<template>
  <a :href="`/project/${slug}`">
    <div
      class="flex flex-row bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    >
      <SvgDisplay class="w-32 h-32 mr-4" :svgContent="imageSvg" />

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
    imageSvg: {
      type: String,
      required: true,
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
