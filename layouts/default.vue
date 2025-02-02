<template>
  <div class="flex flex-col min-h-screen">
    <header class="py-4 lg:py-6 border-b border-gray-300">
      <div
        class="container mx-auto flex justify-between items-center px-4 lg:px-8"
      >
        <a class="text-2xl lg:text-3xl font-bold" href="/"> Nest2d </a>
        <nav class="hidden lg:flex items-center space-x-6">
          <a href="#features" class="text-lg hover:text-gray-500">Features</a>
          <a href="#how-it-works" class="text-lg hover:text-gray-500"
            >How It Works</a
          >
          <a href="#get-started" class="text-lg hover:text-gray-500"
            >Get Started</a
          >
          <a href="#faq" class="text-lg hover:text-gray-500">FAQ</a>
          <a href="/blog" class="text-lg hover:text-gray-500">Blog</a>
        </nav>
        <a
          @click="loginDialog = true"
          class="hidden lg:inline-block bg-black text-white py-2 px-6 rounded-lg text-lg shadow-md hover:bg-gray-800"
        >
          Login / Sign Up
        </a>
        <button
          @click="menuOpen = !menuOpen"
          class="lg:hidden text-black focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      <!-- Mobile Menu -->
      <div
        v-if="menuOpen"
        class="lg:hidden bg-white shadow-md border-t border-gray-200 px-4 py-2"
      >
        <nav class="flex flex-col space-y-4">
          <a href="#features" class="text-lg hover:text-gray-500">Features</a>
          <a href="#how-it-works" class="text-lg hover:text-gray-500"
            >How It Works</a
          >
          <a href="#get-started" class="text-lg hover:text-gray-500"
            >Get Started</a
          >
          <a href="#faq" class="text-lg hover:text-gray-500">FAQ</a>
          <button
            @click="loginDialog = true"
            class="bg-black text-white py-2 px-4 rounded-lg text-lg shadow-md hover:bg-gray-800"
          >
            Login / Sign Up
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 mt-4 mb-4 lg:mt-8 lg:mb-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-black text-white p-4">
      <div
        class="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row justify-between items-center"
      >
        <ul class="flex flex-col lg:flex-row">
          <li class="mr-4 mb-2 lg:mb-0">
            <a
              href="https://github.com/VovaStelmashchuk/nest2d"
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
          <li class="mr-4 mb-2 lg:mb-0">
            <a href="/blog" class="hover:underline">Blog</a>
          </li>
        </ul>
        <p class="text-sm text-gray-400 mt-4 lg:mt-0 text-center lg:text-end">
          © 2025 Vova Stelmashchuk. All rights reserved. Built with ♥ and open
          source principles.
        </p>
      </div>
    </footer>
    <DialogWrapper v-model:isOpen="loginDialog">
      <LoginView />
    </DialogWrapper>
  </div>
</template>

<script setup lang="js">
const loginDialog = useLoginDialog();
const menuOpen = ref(false);
</script>
