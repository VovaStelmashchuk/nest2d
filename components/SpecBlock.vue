<template>
  <div
    :class="['p-2 border rounded-md', textColor]"
    :style="{ backgroundColor: bgColor }"
  >
    <div class="flex flex-row">
      <p class="font-medium">{{ specName }}</p>
    </div>
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
