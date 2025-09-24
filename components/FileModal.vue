<template>
    <DialogWrapper>
        <div class="modal">
            <!-- {{ fileModalData.svgUrl }} -->
           
            <div class="modal__wrapper">
                <div :class="partsClasses" class="modal__parts parts">
                    <h4 class="parts__title">
                        {{ getPartsTitle(fileModalData.parts.length) }}
                    </h4>
                    <UiScrollbar class="parts__scrollbar">
                        <ul class="parts__list">
                            <li
                                v-for="(part, index) in fileModalData.parts"
                                :key="index"
                                class="parts__item"
                            >
                                {{ part.width }} x {{ part.height }}
                            </li>
                        </ul>
                    </UiScrollbar>
                </div>
                <SvgDisplay 
                    :src="fileModalData.svgUrl"
                    :class="displayClasses"
                    @click="updateFullScreen"
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

const isFullScreen = useFullScreen();
const updateFullScreen = () => {
    isFullScreen.value = !unref(isFullScreen);
    localStorage.setItem('isFullScreen', unref(isFullScreen));
}
onMounted(() => {
    isFullScreen.value = localStorage.getItem('isFullScreen') === 'true';
})
const displayClasses = computed(() => ({
    'modal__display--is-fullscreen': unref(isFullScreen)
}))
const partsClasses = computed(() => ({
    'modal__parts--is-fullscreen': unref(isFullScreen)
}))
const getPartsTitle = (length) => {
    return length === 1 ? 'Part: ' : `${length} parts: `
}
</script>
    
<style lang="scss" scoped>
.modal {
    padding: 48px 24px 24px;

    max-width: 368px;
    @media (min-width: 567px) {
        max-width: initial;
        min-width: 368px;
    }

    &__wrapper {
        position: relative;
        display: flex;
    }
    &__fullscreen {
        display: none;

        @media (min-width: 567px) {
            position: absolute;
            top: 8px;
            right: 8px;
            display: block;
        }
    }
    &__display {
        cursor: pointer;
        max-width: 100%;
        max-height: 100%;

        width: 320px;
        height: 320px;

        &--is-fullscreen {
            @media (min-width: 567px) {
                width: calc(80vw - 48px);
                height: calc(80vh - 148px);
            }
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
        margin-left: auto;
        margin-right: auto;

        @media (min-width: 567px) {
            max-width: 320px;
        }
    }

    &__parts {
        flex-shrink: 0;
        width: 100px;
        height: 320px;
        margin-right: 16px;
        position: relative;
        z-index: 1;

        &--is-fullscreen {
            @media (min-width: 567px) {
                height: calc(80vh - 148px);
            }
        }
    }
}


.parts {
    color: var(--label-secondary);
    transition: color 0.3s;
    text-align: left;

    &__scrollbar {
        height: calc(100% - 19px);
    }
    &__title {
        margin-bottom: 4px;
    }

    @media (hover: hover) {
        &:hover {
            color: var(--label-primary);
        }
    }

    &__item {
        font-size: 12px;
    }
}
</style>