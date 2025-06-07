<template>
    <DialogWrapper>
        <div class="modal">
            <div
                v-if="resultModalData.isMultiSheet"
                class="modal__list-sheets list-sheets"
            >
                <MainButton 
                    v-for="(part, partIndex) in resultModalData.dxfs"
                    :key="partIndex"
                    :label="`Part ${partIndex + 1}`" 
                    :size="sizeType.s"
                    :theme="themeType.primary"
                    :isDisable="partIndex == acitvePart"
                    @click="updatePartPage(partIndex)"
                    class="list-sheets__item"
                />
            </div>
            <div class="modal__wrapper">
                <div v-if="isHaveError" :class="placeholderClasses" class="modal__placeholder">
                    Err
                </div>
                <div v-else-if="resultModalData.isMultiSheet">
                    <SvgDisplay
                        :src="resultModalData.svgs[acitvePart]" 
                        :class="displayClasses" 
                        @click="updateFullScreen"
                        class="modal__display"
                    />
                    <MainButton
                        class="modal__part-download"
                        v-if="resultModalData.isMultiSheet" 
                        :href="resultModalData.dxfs[acitvePart]"
                        :label="`Download part ${acitvePart + 1}`" 
                        tag="a" 
                        :isDisable="isHaveError" 
                        :size="sizeType.s"
                        :theme="themeType.primary" 
                    />
                </div>
                <SvgDisplay
                    v-else
                    :src="resultModalData.svgs[0]" 
                    :class="displayClasses" 
                    @click="updateFullScreen"
                    class="modal__display"
                />
                <MainButton v-if="!isHaveError" label="fullscreen" :size="sizeType.s" :theme="themeType.primary"
                    :isLabelShow="false" :icon="iconType.fullscreen" @click="updateFullScreen"
                    class="modal__fullscreen" />
            </div>
            <div class="modal__name modal__info info">
                <template v-if="isHaveError">
                    <span class="info__label">
                        No solution found try to increase plate size or reduce
                        requested object count
                    </span>
                    <span class="info__label">
                        {{ resultModalData.requested }} parts needed to be
                        placed
                    </span>
                    <span class="info__label">
                        {{ resultModalData.placed }} parts placed
                    </span>
                </template>
                <template v-else> 
                    {{ name }}
                </template>
            </div>
            <div v-if="!isHaveError" class="modal__info info">
                <span v-if="resultModalData.requested === resultModalData.placed" class="info__label">
                    All details are placed
                </span>
                <template v-else>
                    <span class="info__label">
                        {{ resultModalData.requested }} parts needed to be
                        placed
                    </span>
                    <span class="info__label">
                        {{ resultModalData.placed }} parts placed
                    </span>
                </template>
            </div>
            <div class="controls">
                <MainButton 
                    v-if="resultModalData.isMultiSheet" 
                    :href="resultModalData.zipDownloadUrl"
                    label="Download All" 
                    tag="a" 
                    :isDisable="isHaveError" 
                    :size="sizeType.s"
                    :theme="themeType.primary" 
                />
                <MainButton 
                    v-if="!resultModalData.isMultiSheet" 
                    :href="resultModalData.dxfs[0]" 
                    label="Download" 
                    tag="a" 
                    download
                    :size="sizeType.s" 
                    :theme="themeType.primary" 
                />
                <MainButton label="Try again" :size="sizeType.s" :theme="themeType.secondary"
                    @click="resultDialog = false" />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants'
import { sizeType } from '~~/constants/size.constants'
import { themeType } from '~~/constants/theme.constants'
import { statusType } from '~~/constants/status.constants'
import { onMounted } from 'vue'

const { getters } = globalStore
const resultModalData = computed(() => getters.resultModalData)

const resultDialog = useResultDialog()

const isHaveError = computed(() => {
    return unref(resultModalData).status === statusType.failed
})
const isFullScreen = useFullScreen()
const updateFullScreen = () => {
    isFullScreen.value = !unref(isFullScreen)
    localStorage.setItem('isFullScreen', unref(isFullScreen))
}
onMounted(() => {
    isFullScreen.value = localStorage.getItem('isFullScreen') === 'true'
})
const displayClasses = computed(() => ({
    'modal__display--is-fullscreen': unref(isFullScreen) && !unref(isHaveError)
}))
const rowClasses = computed(() => ({
    'modal__row--is-fullscreen': unref(isFullScreen) && !unref(isHaveError)
}))
const placeholderClasses = computed(() => ({
    'modal__placeholder--is-fullscreen':
        unref(isFullScreen) && !unref(isHaveError)
}))
const name = computed(() => {
    const endPart = unref(resultModalData).isMultiSheet ? `.zip` : `.dxf ` 
    return unref(resultModalData).slug + endPart
})
const acitvePart = ref(0)
const updatePartPage = (partIndex) => {
    acitvePart.value = partIndex
}
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
        cursor: pointer;
    }

    &__display,
    &__placeholder {
        max-width: 100%;
        width: 320px;
        height: 320px;

        &--is-fullscreen {
            width: calc(80vw - 48px);
            height: calc(80vh - 72px);
        }
    }

    &__row {
        display: flex;

        &--is-fullscreen {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }
    }

    &__col {
        display: flex;
        flex-direction: column;
        align-items: center;

        &:not(:last-child) {
            margin-right: 12px;
        }
    }

    &__download {
        margin-top: 8px;
        width: 100%;
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 8px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        color: var(--label-primary);
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

    &__info {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: var(--label-primary);

        &>* {
            margin-bottom: 10px;
        }
    }

    &__list-sheets {
        margin-left: auto;
        margin-right: auto;
        max-width: 320px;
    }

    &__part-download {
        margin-left: auto;
        margin-right: auto;
        margin-top: 8px;
    }
}

.list-sheets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    &__item {
        margin-bottom: 8px;
        &:not(:last-child) {
            margin-right: 8px;
        }
    }
}
.controls {
    display: flex;
    align-items: center;
    justify-content: center;

    &>* {
        margin-left: 4px;
        margin-right: 4px;
    }
}
</style>
