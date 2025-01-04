<template>
  <div class="container mx-auto relative flex flex-col">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      {{ data.slug }}
    </h2>

    <div class="flex flex-row">
      <div v-if="data" class="flex-grow">
        <div
          v-if="data.files && data.files.length"
          class="grid gap-2"
          :class="gridColsClass"
        >
          <div
            v-for="file in data.files"
            :key="file.slug"
            class="flex flex-row items-center border border-gray-200 p-4 rounded-lg"
          >
            <SvgDisplay class="w-32 h-32 mr-4" :svgContent="file.svg" />
            <div class="flex flex-col flex-grow">
              <div class="text-black font-bold text-lg mb-4 text-center">
                {{ file.name }}
              </div>
              <div class="flex items-center space-x-2">
                <button
                  class="bg-red-500 text-white font-bold py-2 px-4 rounded"
                  @click="decrement(file.slug)"
                >
                  -
                </button>
                <span class="text-black font-bold text-xl w-12 text-center">
                  {{ counters[file.slug] }}
                </span>
                <button
                  class="bg-green-500 text-white font-bold py-2 px-4 rounded"
                  @click="increment(file.slug)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-[20rem] h-full ml-4 border border-gray-200 rounded-lg">
        <h2 class="text-2xl font-bold text-black my-6 text-center">
          Nesting settings
        </h2>
        <div class="flex flex-col space-y-4 p-4">
          <div>
            <label
              for="width"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Width</label
            >
            <input
              id="width"
              type="text"
              class="w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              for="height"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Height</label
            >
            <input
              id="height"
              type="text"
              class="w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              for="tolerance"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Tolerance</label
            >
            <input
              id="tolerance"
              type="text"
              class="w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <span class="text-2xl font-bold text-black my-2 text-center">
              Files selected: {{ selectedFileCount }}
            </span>
          </div>
          <div>
            <button
              class="w-full bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
              @click="nest"
            >
              Nest
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useFetch } from "#app";
import { watch } from "vue";

const route = useRoute();
const slug = route.params.slug;

const counters = ref({});

const selectedFileCount = ref(0);

const { data, pending, error } = await useFetch(`/api/project/${slug}`);

const gridColsClass = computed(() => {
  return `
    grid-cols-[repeat(auto-fit,_minmax(18rem,1fr))]
  `;
});

watch(
  () => data,
  (data) => {
    data.value.files.forEach((file) => {
      counters.value[file.slug] = 0;
    });
  },
  { immediate: true }
);

const updateCounter = () => {
  const conuts = Object.values(counters.value);
  selectedFileCount.value = conuts.reduce((acc, curr) => acc + curr, 0);
};

const increment = (slug) => {
  counters.value[slug]++;
  updateCounter();
};

const decrement = (slug) => {
  if (counters.value[slug] > 0) {
    counters.value[slug]--;
  }
};

const nest = () => {
  console.log("Nest");
};
</script>

<style scoped></style>
