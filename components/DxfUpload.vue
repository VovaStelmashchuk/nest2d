<template>
  <div
    class="relative"
    @dragover.prevent="onDragOver"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div>
      <label
        for="dxfFiles"
        class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition duration-300 ease-in-out"
        :class="{ 'border-blue-500 bg-blue-50': isDragOver }"
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
        <span class="mt-2 text-l text-black">
          Drag & drop or click to upload DXF files
        </span>
      </label>
      <input
        type="file"
        id="dxfFiles"
        name="dxf"
        accept=".dxf"
        multiple
        @change="onDXFChange"
        class="hidden"
      />
    </div>

    <div class="mt-4" v-if="dxfFiles.length > 0">
      <ul class="space-y-2">
        <li
          v-for="file in dxfFiles"
          :key="file.name"
          class="p-4 bg-white border rounded-lg shadow-sm"
        >
          {{ file.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "DxfUpload",
  props: {
    extensions: {
      type: Array,
      default: () => [".dxf"],
    },
  },
  data() {
    return {
      dxfFiles: [],
      isDragOver: false,
    };
  },
  methods: {
    onDXFChange(event) {
      const addedFiles = Array.from(event.target.files);
      this.addFiles(addedFiles);
    },

    onDragOver() {
      this.isDragOver = true;
    },
    onDragEnter() {
      this.isDragOver = true;
    },
    onDragLeave() {
      this.isDragOver = false;
    },
    onDrop(event) {
      this.isDragOver = false;
      const droppedFiles = Array.from(event.dataTransfer.files);
      this.addFiles(droppedFiles);
    },

    addFiles(newFiles) {
      let combined = [...this.dxfFiles, ...newFiles];
      combined = combined.filter((file) => {
        return this.extensions.includes(file.name.slice(-4).toLowerCase());
      });
      this.dxfFiles = combined;
      this.$emit("files", this.dxfFiles);
    },
  },
};
</script>

<style scoped></style>
