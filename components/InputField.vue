<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      class="w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
});
</script>
