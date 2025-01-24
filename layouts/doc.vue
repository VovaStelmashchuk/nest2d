<template>
  <div class="flex flex-col min-h-screen">
    <header class="py-4 lg:py-6 border-b border-gray-300">
      <div
        class="container mx-auto flex justify-between items-center px-4 lg:px-8"
      >
        <a class="text-2xl lg:text-3xl font-bold" href="/">Nest2d</a>
      </div>
    </header>

    <main class="flex-1 mt-4 mb-4 lg:mt-8 lg:mb-8">
      <slot />
    </main>

    <footer class="bg-black text-white p-4">
      <div
        class="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row justify-between items-center"
      >
        <ul class="flex flex-col lg:flex-row">
          <li class="mr-4 mb-2 lg:mb-0">
            <a
              href="https://github.com/VovaStelmashchuk/nest2donline"
              target="_blank"
              class="hover:underline"
              >GitHub</a
            >
          </li>
          <li class="mr-4 mb-2 lg:mb-0">
            <a href="/terms-and-conditions" class="hover:underline"
              >Terms and Conditions</a
            >
          </li>
        </ul>
        <p class="text-sm text-gray-400 mt-4 lg:mt-0 text-center lg:text-end">
          © 2025 Vova Stelmashchuk. All rights reserved. Built with ♥ and open
          source principles.
        </p>
      </div>
    </footer>
  </div>
</template>

<script></script>
