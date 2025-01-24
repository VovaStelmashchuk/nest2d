<template>
  <div class="container mx-auto p-4" v-if="data">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      Project slug: {{ data.projectSlug }}
    </h2>
    <h2 class="text-2xl font-semibold text-gray-800 my-2">Nest result</h2>
    <div class="flex flex-row h-96 py-2">
      <div
        class="flex-1 flex items-center justify-center border border-gray-200 rounded-lg"
      >
        <div v-if="!data.resultSvg" class="flex flex-col items-center">
          <div class="w-3/4 bg-gray-200 rounded-full h-4">
            <div
              class="bg-blue-500 h-4 rounded-full animate-pulse"
              style="width: 50%"
            ></div>
          </div>
          <p class="mt-2 text-gray-600">Nesting in progress...</p>
        </div>

        <SvgDisplay v-else class="w-full h-full" :svgContent="data.resultSvg" />
      </div>

      <div class="container mx-auto flex-1 flex flex-col px-4">
        <div class="space-y-4" v-if="data.params">
          <a
            :href="`/api/queue/${slug}/dxf`"
            v-if="data.status == 'completed'"
            @click="downloadFile"
            class="block text-center w-full bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
          >
            Download DXF
          </a>
          <SpecBlock specName="Width" :specValue="`${data.params.width} mm`" />
          <SpecBlock
            specName="Height"
            :specValue="`${data.params.height} mm`"
          />
          <SpecBlock
            specName="Tolerance"
            :specValue="`${data.params.tolerance} mm`"
          />
          <SpecBlock
            v-if="data.status == 'completed'"
            specName="Usage"
            :specValue="`${formattedUsage(data.usage)}`"
          />
        </div>
      </div>
    </div>
    <h2 class="text-2xl font-semibold text-gray-800 my-2">Nested files</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="file in data.nestedFiles"
        :key="file.id"
        class="flex flex-row items-center border border-gray-200 p-4 rounded-lg"
      >
        <SvgDisplay class="w-32 h-32 mb-4" :svgContent="file.svg" />
        <div class="flex flex-col flex-grow items-center">
          <p class="text-center font-medium w-full mb-2">{{ file.fileName }}</p>
          <p class="text-center font-medium w-full">
            Demand:
            <span class="text-red-600 font-bold">{{ file.count }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
definePageMeta({
  layout: "auth",
});

function formattedUsage(usage) {
  return `${(usage * 100).toFixed(0)}%`;
}

const route = useRoute();
const slug = route.params.slug;

const data = ref(null);
let intervalId;

const fetchData = async () => {
  try {
    const response = await $fetch(`/api/queue/${slug}`);
    data.value = response;
    if (response.status == "completed") {
      stopPolling();
    }
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
</script>
