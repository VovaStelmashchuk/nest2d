<template>
  <div>
    <label :for="id" class="block text-sm font-bold text-black mb-1">
      {{ label }}
    </label>
    <div class="relative w-full">
      <input
        :id="id"
        :type="type"
        :placeholder="placeholder"
        class="w-full border border-gray-300 rounded-lg shadow-sm p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span
        class="absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm"
      >
        mm
      </span>
    </div>
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
