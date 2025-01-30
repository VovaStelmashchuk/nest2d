<template>
  <div class="min-h-screen bg-white text-black">
    <section class="text-center py-16">
      <div class="container mx-auto">
        <h2 class="text-4xl font-bold">Smart Nesting for Laser Cutting</h2>
        <p class="text-lg mt-4 text-gray-700">
          Upload your DXF files, input material dimensions, and let OptimizeCut
          maximize your material usage. Fully open-source and built for
          efficiency.
        </p>
        <div class="mt-8">
          <button
            @click="loginDialog = true"
            class="bg-black text-white py-2 px-4 rounded-lg text-lg shadow-md hover:bg-gray-800"
          >
            Get Started for Free
          </button>
        </div>
      </div>
    </section>

    <section id="features" class="py-16 bg-gray-50">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold text-center">Features</h3>
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="border border-gray-300 p-6 rounded-lg bg-white shadow-md">
            <h4 class="text-xl font-bold">DXF File Support</h4>
            <p class="mt-4 text-gray-600">
              Easily upload DXF files for precision laser cutting.
            </p>
          </div>
          <div class="border border-gray-300 p-6 rounded-lg bg-white shadow-md">
            <h4 class="text-xl font-bold">Material Optimization</h4>
            <p class="mt-4 text-gray-600">
              Minimize waste by optimizing part arrangement.
            </p>
          </div>
          <div class="border border-gray-300 p-6 rounded-lg bg-white shadow-md">
            <h4 class="text-xl font-bold">Open Source</h4>
            <p class="mt-4 text-gray-600">
              Fully open-source software with community support.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="py-16">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold text-center">How It Works</h3>
        <div
          class="mt-8 flex flex-col sm:flex-row items-center sm:justify-between"
        >
          <div class="flex-1 text-center">
            <div
              class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            >
              <span class="text-2xl font-bold">1</span>
            </div>
            <h4 class="mt-4 text-xl font-bold">Upload DXF Files</h4>
            <p class="mt-2 text-gray-600">
              Drag and drop or browse your files to upload.
            </p>
          </div>
          <div class="flex-1 text-center mt-8 sm:mt-0">
            <div
              class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            >
              <span class="text-2xl font-bold">2</span>
            </div>
            <h4 class="mt-4 text-xl font-bold">Enter Material Size</h4>
            <p class="mt-2 text-gray-600">
              Specify the dimensions of your material sheet.
            </p>
          </div>
          <div class="flex-1 text-center mt-8 sm:mt-0">
            <div
              class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            >
              <span class="text-2xl font-bold">3</span>
            </div>
            <h4 class="mt-4 text-xl font-bold">Optimize and Download</h4>
            <p class="mt-2 text-gray-600">
              Get an optimized layout ready for cutting.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="get-started" class="py-16 text-center bg-gray-50">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold">Get Started Today</h3>
        <p class="mt-4 text-lg text-gray-700">
          Sign up and start optimizing your laser cutting projects in minutes.
        </p>
        <div class="mt-8">
          <button
            @click="loginDialog = true"
            class="bg-black text-white py-2 px-4 rounded-lg text-lg shadow-md hover:bg-gray-800"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    </section>

    <section id="faq" class="py-16">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold text-center">
          Frequently Asked Questions
        </h3>
        <div class="mt-8">
          <details class="mb-4">
            <summary class="text-lg font-bold">Is OptimizeCut free?</summary>
            <p class="mt-2 text-gray-600">
              Yes, it's free and open source for everyone.
            </p>
          </details>
          <details class="mb-4">
            <summary class="text-lg font-bold">
              What file formats do you support?
            </summary>
            <p class="mt-2 text-gray-600">
              Currently, we support DXF files for laser cutting.
            </p>
          </details>
          <details>
            <summary class="text-lg font-bold">
              Can I contribute to the project?
            </summary>
            <p class="mt-2 text-gray-600">
              Absolutely! Check out our
              <a
                href="https://github.com/VovaStelmashchuk/nest2D"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                GitHub repository
              </a>
              to contribute.
            </p>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { navigateTo } from "nuxt/app";

const useAuthState = useAuth();
const user = await useAuthState.fetchUser();

if (user) {
  navigateTo("/home");
}
const loginDialog = useLoginDialog();
</script>
