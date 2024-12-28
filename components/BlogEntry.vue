<template>
  <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 space-y-4">
    <h2 class="text-4xl font-bold text-gray-900">{{ title }}</h2>
    <p class="text-sm text-gray-500">
      Published on
      <time :datetime="datetime">{{ date }}</time>
      by {{ author }}
    </p>
    <div v-for="(section, index) in sections" :key="index" class="space-y-2">
      <h2 class="text-2xl font-semibold text-gray-900">{{ section.title }}</h2>
      <ul v-if="Array.isArray(section.content)" class="list-disc pl-6">
        <li v-for="(item, idx) in section.content" :key="idx">{{ item }}</li>
      </ul>
      <p v-else>{{ section.content }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  datetime: { type: String, required: true },
  date: { type: String, required: true },
  author: { type: String, required: true },
  sections: {
    type: Array,
    default: () => [],
    validator: (value) => value.every((item) => item.title && item.content),
  },
});
</script>
