<template>
  <div>
    <div>
      <label
        for="dxfFiles"
        class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-black"
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
    <div class="mt-4" v-if="dxfFiles">
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
  data() {
    return {
      dxfFiles: [],
    };
  },
  methods: {
    onDXFChange(event) {
      const addedFiles = Array.from(event.target.files);
      this.dxfFiles = [...this.dxfFiles, ...addedFiles];
      this.$emit("files", this.dxfFiles);
    },
  },
};
</script>
