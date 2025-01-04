<template>
  <div class="w-32 h-32">
    <img
      :src="svgDataUri"
      class="w-full h-full object-contain"
      alt="SVG Image"
    />
  </div>
</template>

<script>
export default {
  props: {
    svgContent: {
      type: String,
      required: true,
    },
  },
  computed: {
    svgDataUri() {
      // Encode the SVG content
      const encodedSvg = encodeURIComponent(this.svgContent)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");

      // Return the Data URI
      return `data:image/svg+xml,${encodedSvg}`;
    },
  },
};
</script>
