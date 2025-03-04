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
                :src="queueModalData.resultSvg"
                class="modal__display" 
            />
            <div class="modal__name">
                <template v-if="isHaveError">
                    {{ queueModalData.error.message }}
                </template>
                <template v-else>
                    {{queueModalData.slug}}.dxf
                </template>
            </div>
            <div class="controls">
                <MainButton 
                    :href="`/api/queue/${queueModalData.slug}/dxf`"
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
                    @click="nest"
                />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

const { getters, actions } = globalStore;
const { setQueue, setProjects } = actions;
const queueModalData = computed(() => getters.queueModalData);

const queueDialog = useQueueDialog();

const filesToNest = computed(() => {
    return unref(queueModalData).nestedFiles.map((file) => (
        {
            slug: file.slug,
            count: file.count
        }
    ))
})

const requestBody = computed(() => {
    return JSON.stringify({
        files: unref(filesToNest),
        params: {...unref(queueModalData).params},
    })
})
const isHaveError = computed(() => {
    return Boolean(unref(queueModalData).error)
})

const nest = async () => {
    await fetch(`/api/project/${unref(queueModalData).projectSlug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: unref(requestBody),
    });
    await setQueue(`/api/project/${unref(queueModalData).projectSlug}/queue`)
    await setProjects()
    queueDialog.value = false
};

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
    }
    &__name {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
        min-height: 42px;
        color: var(--main-back);
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