<template>
  <div class="main mx-auto rounded-lg min-h-screen">
    <section class="m-4">
      <h2>Nesting For plotters,
        laser & plasma cutters,
        and other CNC machines </h2>
      <p class="mt-4">Upload your DXF files,
        input material dimensions,
        and let Nest2d reduce material waste. </p>
      <div class="mt-8">
        <MainButton :theme="themeType.primary" label="Get Started for Free" @click="loginDialog = true"
          class="mx-auto" />
      </div>
    </section>
    <section id="features" class="m-4">
      <div class="container mx-auto">
        <h3>Features</h3>
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="main__card">
            <h4>DXF File Support</h4>
            <p class="mt-4">Easily upload DXF files for precision laser cutting. </p>
          </div>
          <div class="main__card">
            <h4>Save money</h4>
            <p class="mt-4">Minimize waste by optimizing part arrangement. </p>
          </div>
          <div class="main__card">
            <h4>No client resource require</h4>
            <p class="mt-4">All calculation done by server.</p>
          </div>
          <div class="main__card">
            <h4>Open Source</h4>
            <p class="mt-4">Fully open-source and built for efficiency. </p>
          </div>
        </div>
      </div>
    </section>
    <section id="screenshots">
      <div class="container mx-auto">
        <h3>Intuitive design</h3>
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <img src="/screenshots/project-ui.png" alt="project ui"
              class="w-full h-auto">
            <img src="/screenshots/nest-result.png" alt="project ui"
              class="w-full h-auto">
            <img src="/screenshots/preview.png" alt="project ui"
              class="w-full h-auto">
        </div>
      </div>
    </section>
    <section id="how-it-works">
      <div class="container mx-auto">
        <h3>How It Works</h3>
        <div class="main__how-it-works mt-8">
          <div class="flex-1 text-center">
            <div class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"><span
                class="text-2xl font-bold">1</span></div>
            <h4 class="mt-4 text-xl font-bold">Upload DXF Files</h4>
            <p class="mt-2 text-gray-600">Drag and drop or browse your files to upload. </p>
          </div>
          <div class="flex-1 text-center mt-8 sm:mt-0">
            <div class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"><span
                class="text-2xl font-bold">2</span></div>
            <h4 class="mt-4 text-xl font-bold">Enter Material Size</h4>
            <p class="mt-2 text-gray-600">Specify the dimensions of your material sheet. </p>
          </div>
          <div class="flex-1 text-center mt-8 sm:mt-0">
            <div class="border border-gray-300 w-16 h-16 rounded-full mx-auto flex items-center justify-center"><span
                class="text-2xl font-bold">3</span></div>
            <h4 class="mt-4 text-xl font-bold">Optimize and Download</h4>
            <p class="mt-2 text-gray-600">Get an optimized layout ready for cutting. </p>
          </div>
        </div>
      </div>
    </section>
    <section id="get-started" class="p-6 text-center">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold">Get Started Today</h3>
        <p class="mt-4 text-lg text-gray-700">Sign up and start optimizing your laser cutting projects in minutes. </p>
        <div class="mt-8">
          <MainButton :theme="themeType.primary" label="Login / Sign Up" @click="loginDialog = true" class="mx-auto" />
        </div>
      </div>
    </section>
    <section id="faq" class="p-6">
      <div class="container mx-auto">
        <h3 class="text-3xl font-bold text-center">Frequently Asked Questions </h3>
        <div class="mt-8">
          <details class="mb-4">
            <summary class="text-lg font-bold">Is Nest2d free?</summary>
            <p class="mt-2 text-gray-600">Yes, it's free and open source for everyone.
            </p>
          </details>
          <details class="mb-4">
            <summary class="text-lg font-bold">What file formats do you support? </summary>
            <p class="mt-2 text-gray-600">Currently, we support DXF files for laser cutting. </p>
          </details>
          <details>
            <summary class="text-lg font-bold">Can I contribute to the project? </summary>
            <p class="mt-2 text-gray-600">Absolutely ! Check out our <a
                href="https://github.com/VovaStelmashchuk/nest2D" target="_blank"
                class="text-blue-500 hover:underline">GitHub repository </a>to contribute. </p>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup>definePageMeta({
  middleware: "auth",
});

import {
  themeType
}

  from "~~/constants/theme.constants";
const loginDialog = useLoginDialog();

</script>
<style lang="scss" scoped>
.main {
  background-color: var(--background-primary);
  flex-direction: column;
  display: flex;
  min-height: 100vh;

  h2 {
    text-align: center;
    color: var(--accent-primary);
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
  }

  h3 {
    text-align: center;
    font-size: 1.875rem;
    color: var(--accent-primary);
    line-height: 2.5rem;
    font-weight: 700;
  }

  p {
    text-align: center;
    color: var(--label-secondary);
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
  section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  &__card {
    border-width: 1px;
    border-color: var(--separator-secondary);
    padding: 1.5rem;
    border-radius: 1rem;

    h4 {
      font-size: 1.25rem;
      line-height: 1.75rem;
      font-weight: 700;
      color: var(--accent-primary);
    }
    p {
      text-align: left;
      color: var(--label-secondary);
    }
  }

  &__how-it-works {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;

    @media (min-width: 700px) {
      flex-direction: row;
      justify-content: space-between;
    }

    h4 {
      font-size: 1.25rem;
      line-height: 1.75rem;
      font-weight: 700;
      color: var(--accent-primary);
    }
  }
}

</style>
