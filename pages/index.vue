<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      Lets make your laser cutting economical
    </h2>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
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
        Save money
      </button>
    </form>

    <div
      v-if="error"
      class="mt-6 p-4 bg-red-50 border border-red-400 text-red-800 rounded-lg"
    >
      {{ error }}
    </div>
  </div>
</template>

<script>
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
      try {
        this.error = "";

        if (this.dxfFiles.length === 0) {
          throw new Error("At least one DXF file is required.");
        }

        const formData = new FormData();
        this.dxfFiles.forEach((file) => formData.append("dxf", file));

        const response = await fetch("/api/nest", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Upload failed.");
        }

        const data = await response.json();
        this.error = data.message;
      } catch (err) {
        this.error = err.message;
      }
    },
  },
};
</script>

<style scoped></style>
