<template>
    <DialogWrapper>
        <div class="modal">  
            <div class="modal__wrapper">
                <FileParts :class="partsClasses" :parts="fileModalData.parts" class="modal__parts"/>
                <DxfViewerComponent
                    :key="`dxf-0-${isFullScreen}`"
                    :dxfUrl="fileModalData.dxfUrl"
                    :isFullScreen="isFullScreen"
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

        &--is-fullscreen {
            @media (min-width: 567px) {
                height: calc(80vh - 148px);
            }
        }
    }
}
</style>