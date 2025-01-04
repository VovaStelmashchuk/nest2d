<template>
  <div class="flex flex-col min-h-screen">
    <header class="bg-black text-white">
      <p class="text-center text-red-600 text-xl font-bold p-4">
        The project is under development. Some DXF format not supported and some
        geometry can be broken. You can create an issue on
        <a
          href="https://github.com/VovaStelmashchuk/nest2D/issues/new"
          class="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          here </a
        >.
      </p>
      <div class="flex flex-col sm:flex-row justify-between pt-4">
        <a
          href="/"
          class="flex-1 text-xl text-center text-white bg-black hover:bg-white hover:text-black py-4"
          ><p class="underline underline-offset-2">Nest your project</p>
        </a>
        <a
          href="/blog"
          class="flex-1 text-xl text-center text-white bg-black hover:bg-white hover:text-black py-4"
          ><p class="underline underline-offset-2">Blog</p>
        </a>
      </div>
    </header>

    <main class="flex-1 mt-4 mb-4 lg:mt-8 lg:mb-8">
      <slot />
    </main>

    <footer class="bg-black text-white p-4">
      <ul class="flex flex-col">
        <li class="mr-4">
          <a
            href="https://github.com/VovaStelmashchuk/nest2D"
            target="_blank"
            class="hover:underline"
            >GitHub</a
          >
        </li>
        <li class="mr-4">
          <a href="/terms-and-conditions" class="hover:underline"
            >Terms and Conditions</a
          >
        </li>
        <li class="mr-4">
          <a href="/blog" class="hover:underline">Blog</a>
        </li>
      </ul>
      <p class="text-end text-gray-400">
        © 2025 Vova Stelmashchuk. All rights reserved.
      </p>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({});
</script>
