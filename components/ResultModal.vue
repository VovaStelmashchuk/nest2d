<template>
    <DialogWrapper>
        <div class="modal">
            <div 
                v-if="isHaveError"
                class="modal__placeholder"
            >
                Err
            </div>
            <SvgDisplay 
                v-else
                :src="resultModalData.svg"
                class="modal__display" 
            />
            <div class="modal__name">
                <template v-if="isHaveError">
                    No solution found try to increase plate size
                </template>
                <template v-else>
                    {{resultModalData.slug}}.dxf
                </template>
            </div>
            <div class="controls">
                <MainButton 
                    :href="`/api/queue/${resultModalData.slug}/dxf`"
                    label="Download"
                    tag="a"
                    :isDisable="isHaveError"
                    :size="sizeType.s"
                    :theme="themeType.primary"
                />
                <MainButton 
                    href="`/api/queue/${item.slug}/dxf`"
                    label="Try again"
                    :size="sizeType.s"
                    :theme="themeType.secondary"
                    @click="resultDialog = false"
                />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";

const { getters } = globalStore;
const resultModalData = computed(() => getters.resultModalData);

const resultDialog = useResultDialog();

const isHaveError = computed(() => {
    return unref(resultModalData).status === statusType.failed
})
</script>
    
<style lang="scss" scoped>
.modal {
    padding: 48px 24px 24px;
    width: 368px;
    min-height: 484px;
    &__close {
        position: absolute;
        top: 8.5px;
        right: 8.5px;
    }
    &__display,
    &__placeholder {
        width: 320px;
        height: 320px;
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