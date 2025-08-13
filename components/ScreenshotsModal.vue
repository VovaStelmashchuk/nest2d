<template>
    <DialogWrapper>
        <div class="modal">
            <div class="modal__wrapper">
                <div class="modal__controls controls">
                    <MainButton 
                        :theme="themeType.primary"
                        :icon="iconType.arrowPrev"
                        :isLabelShow=false
                        @click="updateScreenshot(-1)"
                        label="prev"
                        class="controls__prev"
                    />
                    <MainButton 
                        :theme="themeType.primary"
                        :icon="iconType.arrowNext"
                        :isLabelShow=false
                        @click="updateScreenshot(1)"
                        label="next"
                        class="controls__next"
                    />
                </div>
                <img
                    :src="screenshotModalData.src"
                    alt="project ui"
                    class="modal__display"
                />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
const { getters, actions } = globalStore
const { setModalScreenshotData } = actions;
const screenshotModalData = computed(() => getters.screenshotModalData)
const currentIndex = computed(() => screenshotModalData.value.index);
const currentTheme = computed(() => screenshotModalData.value.theme);
import { themeType } from "~~/constants/theme.constants";
import { iconType } from '~~/constants/icon.constants';
import { screenshots } from '~~/data/index'

const updateScreenshot = (value) => {
    const tempIndex = currentIndex.value - value;
    let newIndex = tempIndex;

    if (tempIndex < 0) {
        newIndex = screenshots.list[unref(currentTheme)].length - 1;
    }
    if (tempIndex >= screenshots.list[unref(currentTheme)].length) {
        newIndex = 0;
    }

    setModalScreenshotData({
        theme: currentTheme.value,
        index: newIndex,
        src: screenshots.list[currentTheme.value][newIndex].src,
    });
}
</script>

<style lang="scss" scoped>
.modal {
    padding: 48px 12px 12px;

    @media (min-width: 568px) {
        padding-left: 24px;
        padding-bottom: 24px;
        padding-right: 24px;
    }
    &__wrapper {
        position: relative;
        border: 1px solid var(--separator-secondary);
        border-radius: 16px;
        overflow: hidden;
    }       
    &__display {
        object-fit: contain;
        width: 100%;
        max-width: calc(90vw - 24px);
        max-height: calc(90vh - 36px);

        @media (min-width: 568px) {
            max-width: calc(80vw - 48px);
            max-height: calc(80vh - 72px);  
        }
    }

    &__controls {
        position: absolute;
        top: 50%;
        left: 3%;
        right: 3%;
        transform: translateY(-50%);
    }
}
.controls {
    pointer-events: none;
    &__prev,
    &__next {
        pointer-events: all;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
    }
    &__prev {
        left: 0;
    }
    &__next {
        right: 0;
    }
}

</style>

