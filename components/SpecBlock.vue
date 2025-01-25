<template>
  <div
    :class="['p-2 border rounded-md', textColor]"
    :style="{ backgroundColor: bgColor }"
  >
    <h3 class="text-lg font-medium">{{ specName }}</h3>
    <p class="text-sm">{{ specValue }}</p>
  </div>
</template>

<script>
export default {
  props: {
    specName: {
      type: String,
      required: true,
    },
    specValue: {
      type: String,
      required: true,
    },
    bgColor: {
      type: String,
      default: "#ffffff",
    },
  },
};
</script>
