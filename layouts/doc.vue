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
      <Footer />
    </footer>
  </div>
</template>

<script></script>
