<template>
  <div class="container mx-auto p-4" v-if="data">
    <NuxtLink
      :to="`/project/${data.projectSlug}`"
      class="font-bold text-black mb-6 text-2xl underline"
      prefetch-on="interaction"
    >
      Project: {{ data.projectName }}
    </NuxtLink>
    <div class="flex flex-row py-2">
      <div
        class="flex-1 flex items-center justify-center border border-gray-200 rounded-lg"
      >
        <div
          v-if="data.status == 'pending' || data.status == 'in-progress'"
          class="flex flex-col items-center"
        >
          <div class="relative w-16 h-16">
            <div
              class="absolute inset-0 rounded-full border-4 border-gray-200"
            ></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-t-black animate-spin"
            ></div>
          </div>

          <p class="m-4 text-gray-600 text-center">
            Nesting is in progress. This process may take some time. You can
            safely leave this page and check the status in the
            <a href="/queue/all" class="text-blue-500 underline">History</a>
            page.
          </p>
        </div>
        <div v-if="data.status == 'failed'" class="flex flex-col items-center">
          <p class="m-4 text-red-600 text-center text-2xl">
            {{ data.error.message }}
          </p>
        </div>
        <img
          v-if="data.status == 'completed'"
          class="w-full h-96"
          :src="data.resultSvg"
        />
      </div>

      <div class="flex-1 flex flex-col px-4">
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
          <SpecBlock specName="Height" :specValue="`${data.params.height}`" />
          <SpecBlock
            specName="Tolerance"
            :specValue="`${data.params.tolerance} mm`"
          />
          <SpecBlock specName="Space" :specValue="`${data.params.space} mm`" />
          <SpecBlock
            v-if="data.status == 'completed'"
            specName="Usage"
            :specValue="`${formattedUsage(data.usage)}`"
          />
          <SpecBlock
            v-if="data.status == 'completed'"
            specName="Placed items"
            :specValue="`${data.placedItemCount}/${data.requestedItemCount}`"
            :bgColor="
              data.placedItemCount < data.requestedItemCount ? '#ff0011' : ''
            "
          />
          <a
            :href="`${buildNestParamsUrl()}`"
            target="_blank"
            class="block text-center w-full bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
          >
            Try another parameters
          </a>
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

function buildNestParamsUrl() {
  const projectSlug = data.value.projectSlug;
  const params = new URLSearchParams();
  params.append("width", data.value.params.width);
  params.append("height", data.value.params.height);
  params.append("tolerance", data.value.params.tolerance);
  params.append("space", data.value.params.space);
  data.value.nestedFiles.forEach((file) => {
    params.append(`file-${file.slug}`, file.count);
  });
  return `/project/${projectSlug}?${params.toString()}`;
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
