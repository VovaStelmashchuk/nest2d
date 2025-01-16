<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      Upload Files
    </h2>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
      <div class="mb-6">
        <label
          for="projectName"
          class="block text-xl font-medium text-gray-800 mb-2"
        >
          Project Name
        </label>
        <input
          v-model="projectName"
          type="text"
          id="projectName"
          name="projectName"
          class="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-gray-800 focus:ring-black focus:border-black"
          placeholder="Enter your project name"
          required
        />
      </div>

      <div class="mb-6">
        <div>
          <label
            for="image"
            class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition duration-300 ease-in-out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="mt-2 text-l text-black"
              >Drag & drop or click to upload</span
            >
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            @change="handleImageUpload"
            class="hidden"
          />
        </div>
      </div>

      <div class="mb-6">
        <label
          for="dxfFilesLabel"
          class="block text-xl font-medium text-gray-800 mb-2"
        >
          DXF Files
        </label>
        <DxfUpload @files="handleDxfChange" />
      </div>

      <button
        type="submit"
        class="w-full bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
      >
        Upload
      </button>
    </form>

    <div
      v-if="message"
      class="mt-6 p-4 bg-green-50 border border-green-400 text-green-800 rounded-lg"
    >
      {{ message }}
    </div>

    <div
      v-if="error"
      class="mt-6 p-4 bg-red-50 border border-red-400 text-red-800 rounded-lg"
    >
      {{ error }}
    </div>
  </div>
</template>

<script>
definePageMeta({
  layout: "auth",
});

import DxfUpload from "~/components/DxfUpload.vue";

export default {
  components: {
    DxfUpload,
  },
  data() {
    return {
      projectName: "",
      imageFile: null,
      dxfFiles: [], // Will be updated via the DxfUpload component
      message: "",
      error: "",
    };
  },
  methods: {
    handleImageUpload(event) {
      this.imageFile = event.target.files[0];
    },
    handleDxfChange(files) {
      this.dxfFiles = files;
      console.log("from child DXF files event: ", files);
    },
    async handleSubmit() {
      try {
        this.message = "";
        this.error = "";

        if (!this.projectName) {
          throw new Error("Project name is required.");
        }
        if (!this.imageFile) {
          throw new Error("An image file is required.");
        }
        if (this.dxfFiles.length === 0) {
          throw new Error("At least one DXF file is required.");
        }

        const formData = new FormData();
        formData.append("projectName", this.projectName);
        formData.append("image", this.imageFile);

        // Append each of our DXF files
        this.dxfFiles.forEach((file) => formData.append("dxf", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Upload failed.");
        }

        const data = await response.json();
        this.message = data.message;
      } catch (err) {
        this.error = err.message;
      }
    },
  },
};
</script>

<style scoped></style>
