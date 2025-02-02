<template>
  <div>
    <div class="max-w-2xl mx-auto p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Queue</h2>
      <div class="grid grid-cols-1 gap-2" v-if="data?.items">
        <NuxtLink
          :to="`/queue/${item.slug}`"
          v-for="item in data.items"
          :key="item.id"
          class="border border-gray-200 rounded-lg p-4 flex flex-col"
        >
          <div class="flex flex-row justify-between items-center">
            <p class="text-lg font-bold">
              Placment for project: {{ item.projectName }}
            </p>
            <img
              class="w-8 h-8"
              :src="getIcon(item.status)"
              :alt="`Icon for ${item.status}`"
            />
          </div>
          <p class="ml-auto text-gray-600">{{ item.createdAt }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const data = ref(null);
let intervalId;

const fetchData = async () => {
  try {
    const response = await $fetch(`/api/queue/all`);
    data.value = response;
  } catch (err) {}
};

const startPolling = () => {
  fetchData();
  intervalId = setInterval(fetchData, 5000);
};

const stopPolling = () => {
  if (intervalId) clearInterval(intervalId);
};

onMounted(() => {
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});

function getIcon(status) {
  switch (status) {
    case "completed":
      return "/done.svg";
    case "in-progress":
      return "/processing.svg";
    case "pending":
      return "/pending.svg";
    case "failed":
      return "/fail.svg";
    default:
      return "/unknown.svg";
  }
}
</script>
