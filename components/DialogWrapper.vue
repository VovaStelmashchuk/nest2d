<template>
    <teleport to="body">
        <div v-if="isModalOpen" class="modal">
            <div class="modal__background" @click="closeModal"></div>
            <div class="modal__body modal-body">
                <MainButton label="close modal" :isLabelShow=false :size="sizeType.s" :icon="iconType.close" trackingTag="modal_close" @click="closeModal" class="modal-body__close" />
                <slot />
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { onMounted, onUnmounted, watch } from 'vue';
import { trackEvent } from '~~/utils/track';

const { isModalOpen, trackingTag } = defineProps({
    isModalOpen: {
        type: Boolean,
        default: false,
    },
    trackingTag: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(["update:isModalOpen"]);

const closeModal = () => {
    emit("update:isModalOpen", false);
}

watch(() => isModalOpen, (isOpen) => {
    if (isOpen && Boolean(trackingTag)) {
        trackEvent(`dialog_view_${trackingTag}`);
    }
});

const handleKeydown = (event) => {
    if (event.key === 'Escape' && isModalOpen) {
        event.preventDefault()
        closeModal();
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});
</script>

<style lang="scss" scoped>
.modal {
    font-size: 12px;
    font-family: $sf_mono;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;

    &__background {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: var(--label-tertiary);
    }

    &__body {
        position: relative;
        z-index: 1;
        background-color: var(--background-primary);
        border-radius: 16px;
        max-height: 94vh;
        max-width: 94vw;
    }
}

.modal-body {
    overflow: auto;

    &__close {
        position: absolute;
        top: 8.5px;
        right: 8.5px;
    }
}
</style>