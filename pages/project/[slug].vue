<template>
  <div class="container mx-auto relative flex flex-col">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      {{ data.slug }}
    </h2>

    <div class="flex flex-row">
      <div v-if="data" class="flex-grow">
        <div
          v-if="data && data.files && data.files.length"
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
          <InputField
            id="width"
            label="Width"
            v-model="widthPlate"
            placeholder="Enter width"
          />

          <InputField
            id="height"
            label="Height"
            v-model="heightPlate"
            placeholder="Enter height"
          />

          <InputField
            id="tolerance"
            label="Tolerance"
            v-model="tolerance"
            placeholder="Enter tolerance"
          />

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
            <div v-if="nestRequestError" class="text-red-500 mt-2">
              {{ nestRequestError }}
            </div>

            <div v-if="nestResult" class="text-green-500 mt-2">
              <p class="text-l py-2">Nest task added to the queue.</p>
              <a
                :href="`/queue/${nestResult.slug}`"
                class="w-full bg-green text-black py-2 px-4 rounded-lg border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400 inline-block text-center"
              >
                Go to next task
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "auth",
});
import { useRoute } from "vue-router";
import { useFetch } from "#app";
import { watch } from "vue";

const route = useRoute();
const slug = route.params.slug;

const nestRequestError = ref(null);

const widthPlate = ref("");
const heightPlate = ref("");
const tolerance = ref("");
const nestResult = ref(null);

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
    if (!data || !data.value || !data.value.files) return;
    data.value.files.forEach((file) => {
      counters.value[file.slug] = 0;
    });
  },
  { immediate: true }
);

const updateCounter = () => {
  nestRequestError.value = null;
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
    updateCounter();
  }
};

const nest = async () => {
  nestRequestError.value = null;
  nestResult.value = null;

  const filesToNest = Object.entries(counters.value)
    .filter(([_, count]) => count > 0)
    .map(([slug, count]) => {
      return {
        slug,
        count,
      };
    });

  if (filesToNest.length === 0) {
    nestRequestError.value = "Please select at least one file to nest.";
    return;
  }

  const widthValue = parseFloat(widthPlate.value);
  const heightValue = parseFloat(heightPlate.value);
  const toleranceValue = parseFloat(tolerance.value);

  if (isNaN(widthValue) || isNaN(heightValue) || isNaN(toleranceValue)) {
    nestRequestError.value =
      "Please enter valid values for width, height, and tolerance.";
    return;
  }

  const request = {
    files: filesToNest,
    params: {
      width: widthValue,
      height: heightValue,
      tolerance: toleranceValue,
    },
  };

  nestResult.value = await fetch(`/api/project/${slug}/nest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
};
</script>

<style scoped></style>
