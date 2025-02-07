<template>
  <div class="flex flex-col min-h-screen">
    <header class="border-b border-gray-300">
      <p class="text-center text-black bg-gray-200">
        The project still under development.
      </p>
      <div
        class="container mx-auto flex justify-between items-center p-2 lg:px-8"
      >
        <a class="text-2xl lg:text-3xl font-bold" href="/home">Nest2d</a>

        <nav class="flex items-center space-x-6">
          <a href="/home" class="text-lg hover:text-gray-500">Projects</a>
          <a href="/queue/all" class="text-lg hover:text-gray-500">History</a>
          <a href="/blog" class="text-lg hover:text-gray-500">Blog</a>
        </nav>

        <div class="flex items-center space-x-2">
          <a
            href="https://github.com/VovaStelmashchuk/nest2d/issues/new"
            target="_blank"
            class="block text-center bg-black text-white py-2 px-4 rounded-lg shadow-md border border-black hover:bg-white hover:text-black transition duration-300 ease-in-out transform focus:ring focus:ring-gray-400"
          >
            Report an issue
          </a>
          <Avatar class="rounded-lg text-lg shadow-md"></Avatar>
        </div>
      </div>
    </header>

    <main class="flex-1 mt-4 mb-4 lg:mt-8 lg:mb-8">
      <slot />
    </main>

    <footer class="bg-black text-white p-4">
      <Footer />
    </footer>
  </div>
</template>
<script setup></script>
