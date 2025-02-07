<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-4">License Information</h1>

    <h2 class="text-2xl font-semibold mt-6 mb-4">Third-Party Licenses</h2>
    <p class="text-gray-700 mb-4">
      Below is a list of third-party dependencies and their respective licenses
      used in this project:
    </p>

    <div class="bg-gray-100 p-4 rounded-md">
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-gray-300 p-2 text-left">Package</th>
            <th class="border border-gray-300 p-2 text-left">Version</th>
            <th class="border border-gray-300 p-2 text-left">License</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pkg in packages" :key="pkg.name">
            <td class="border border-gray-300 p-2">{{ pkg.name }}</td>
            <td class="border border-gray-300 p-2">{{ pkg.version }}</td>
            <td class="border border-gray-300 p-2">{{ pkg.license }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "doc",
});
const packages = [
  { name: "@deepnest/dxf2svg-processor", version: "0.1.3", license: "AGPL3.0" },
  { name: "nuxt", version: "3.15.3", license: "MIT" },
  { name: "vue", version: "3.5.13", license: "MIT" },
  { name: "bcrypt", version: "5.1.1", license: "MIT" },
  { name: "mongodb", version: "6.8", license: "Apache-2.0" },
  { name: "vite", version: "6.0.6", license: "MIT" },
  { name: "vue-router", version: "4.5.0", license: "MIT" },
  { name: "standard-slugify", version: "4.0.0", license: "MIT" },
  { name: "offset-polygon", version: "0.9.2", license: "MIT" },
  { name: "@nuxtjs/tailwindcss", version: "6.12.2", license: "MIT" },
  { name: "patch-package", version: "8.0.0", license: "MIT" },
  { name: "postinstall-postinstall", version: "2.1.0", license: "MIT" },
  { name: "tslib", version: "2.8.1", license: "Apache-2.0" },
];
</script>

