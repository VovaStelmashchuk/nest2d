<template>
  <div class="py-2 flex flex-row items-center space-x-2">
    <label for="projectNameId" class="block text-xl font-medium text-back mb-1">
      Project name
    </label>
    <input
      id="projectNameId"
      type="string"
      placeholder="Project name"
      class="border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      :value="newProjectName"
      @input="updateProjectName"
    />
    <button
      class="bg-black text-white py-2 px-4 rounded rounded-lg disabled:opacity-50"
      @click="saveProjectName"
      :disabled="isSaveButtonDisabled"
    >
      Save name
    </button>
  </div>
</template>

<script setup>
const { projectName, slug } = defineProps({
  projectName: String,
  slug: String,
});
const oldProjectName = ref(projectName);
const newProjectName = ref(projectName);
const updateProjectName = (e) => {
  newProjectName.value = e.target.value;
};
const saveProjectName = async () => {
  console.log(newProjectName.value);

  await fetch(`/api/project/${slug}/name`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectName: newProjectName.value }),
  });
  oldProjectName.value = newProjectName.value;
};

const isSaveButtonDisabled = computed(() => {
  return newProjectName.value == oldProjectName.value;
});
</script>
