<template>
  <div>
    <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">
        Upload your DXF files
      </h2>

      <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
        <div class="mb-4">
          <DxfUpload @files="handleDxfChange" />
        </div>

        <button
          type="submit"
          class="w-full bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
        >
          Save money
        </button>
        <p class="text-center mt-1 text-gray-500">All files will be save secure and available only for you</p>
      </form>

      <div
        v-if="error"
        class="mt-6 p-4 bg-red-50 border border-red-400 text-red-800 rounded-lg"
      >
        {{ error }}
      </div>
    </div>
    <div class="max-w-2xl mx-auto">
      <UserProjects />
    </div>
  </div>
</template>

<script>
definePageMeta({
  layout: "auth",
});

import { navigateTo } from "nuxt/app";
import DxfUpload from "~/components/DxfUpload.vue";

export default {
  components: {
    DxfUpload,
  },
  data() {
    return {
      dxfFiles: [],
      error: "",
    };
  },
  methods: {
    handleDxfChange(files) {
      this.dxfFiles = files;
      console.log("from child DXF files event: ", files);
    },
    async handleSubmit() {
      this.error = "";

      if (this.dxfFiles.length === 0) {
        this.error = "At least one DXF file is required.";
        return;
      }

      const formData = new FormData();
      this.dxfFiles.forEach((file) => formData.append("dxf", file));

      const response = await fetch("/api/project", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.error = errorData.message;
      } else {
        const data = await response.json();
        await navigateTo(`/project/${data.slug}`);
      }
    },
  },
};
</script>

<style scoped></style>
