<template>
  <div class="p-2 bg-white border rounded-md">
    <h3 class="text-lg font-medium text-gray-700">{{ specName }}</h3>
    <p class="text-gray-600 text-sm">{{ specValue }}</p>
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
  },
};
</script>
