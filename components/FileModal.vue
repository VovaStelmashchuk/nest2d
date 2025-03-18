<template>
    <DialogWrapper>
        <div class="modal">
            <!-- {{ fileModalData.svgUrl }} -->
           
            <div class="modal__wrapper">
                <SvgDisplay 
                    :src="fileModalData.svgUrl"
                    :class="displayClasses"
                    class="modal__display" 
                />
                <MainButton 
                    label="fullscreen"
                    :size="sizeType.s"
                    :theme="themeType.primary"
                    :isLabelShow=false
                    :icon="iconType.fullscreen"
                    @click="updateFullScreen"
                    class="modal__fullscreen" 
                />
            </div>
            <div class="modal__name">
                {{ fileModalData.name }}
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

const { getters } = globalStore;
const fileModalData = computed(() => getters.fileModalData);

const isFullScreen = ref(false);
const updateFullScreen = () => {
    isFullScreen.value = !unref(isFullScreen);
}
const displayClasses = computed(() => ({
    'modal__display--is-fullscreen': unref(isFullScreen)
}))
</script>
    
<style lang="scss" scoped>
.modal {
    padding: 48px 24px 24px;
    min-width: 368px;
    &__wrapper {
        position: relative;
    }
    &__fullscreen {
        position: absolute;
        top: 8px;
        right: 8px;
    }
    &__display {
        max-width: 100%;
        width: 320px;
        height: 320px;

        &--is-fullscreen {
            width: calc(80vw - 48px);
            height: calc(80vh - 72px);
        }
    }
    &__name {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
        min-height: 42px;
        color: var(--label-primary);
        max-width: 320px;
        margin-left: auto;
        margin-right: auto;
    }
}
</style>