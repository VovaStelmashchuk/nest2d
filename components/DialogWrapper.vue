<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black bg-opacity-50 shadow-xl"
          @click="onBackdropClick"
        ></div>

        <div
          class="relative w-full max-w-lg bg-white rounded-lg shadow-xl"
          role="dialog"
          aria-modal="true"
        >
          <slot />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: "DialogWrapper",
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:isOpen"],
  methods: {
    onBackdropClick() {
      this.$emit("update:isOpen", false);
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
