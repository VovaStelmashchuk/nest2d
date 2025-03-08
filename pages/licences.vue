<template>
    <div class="max-w-4xl mx-auto p-6 bg-gray-50 text-gray-800 shadow-lg rounded-lg">
        <h1 class="text-3xl font-bold mb-4">
            License Information
        </h1>
        <h2 class="text-2xl font-semibold mt-6 mb-4">
            Third-Party Licenses
        </h2>
        <p class="text-gray-700 mb-4">
            Below is a list of third-party dependencies and their respective licenses used in this project:
        </p>
        <div class="bg-gray-100 rounded-md">
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-200">
                        <th class="border border-gray-300 p-2 text-left">
                            Package
                        </th>
                        <th class="border border-gray-300 p-2 text-left">
                            Version
                        </th>
                        <th class="border border-gray-300 p-2 text-left">
                            License
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr 
                        v-for="pkg in packages"
                        :key="pkg.name"
                    >
                        <td class="border border-gray-300 p-2">
                            {{ pkg.name }}
                        </td>
                        <td class="border border-gray-300 p-2">
                            {{ pkg.version }}
                        </td>
                        <td class="border border-gray-300 p-2">
                            {{ pkg.license }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { packages } from "~~/data/licences";
definePageMeta({
    layout: "doc",
});
</script>

