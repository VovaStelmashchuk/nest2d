<template>
    <div 
        v-if="isModalShow"
        class="modal"
    >
        <div 
            class="modal__background"
            @click="closeModal"
        ></div>
        <div class="modal__body modal-body">
            <IconButton 
                label="close modal"
                :size="sizeType.s"
                :icon="iconType.close"
                @click="closeModal"
                class="modal-body__close"
            />
            <SvgDisplay 
                :src="queueModalData.resultSvg"
                class="modal-body__display" 
            />
            <div class="modal-body__name">
                {{queueModalData.slug}}.dxf
            </div>
            <div class="modal-body__controls controls">
                <MainButton 
                    :href="`/api/queue/${queueModalData.slug}/dxf`"
                    label="Download"
                    tag="a"
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
    </div>
</template>

<script setup>
import { globalStore } from "~~/store";
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

const { getters, mutations } = globalStore;
const { isModalShow, queueModalData } = toRefs(getters);
const { closeModal, setQueue } = mutations;

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

const nest = async () => {
    await fetch(`/api/project/${unref(queueModalData).projectSlug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: unref(requestBody),
    });
    await setQueue(`/api/project/${unref(queueModalData).projectSlug}/queue`)
    closeModal()
};

</script>
    
<style lang="scss" scoped>
.modal {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    &__background {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgb(22, 26, 33, 0.5);
    }
    &__body {
        position: relative;
        z-index: 1;
        width: 368px;
        height: 484px;
        background-color: #f5f4f0;
        border-radius: 16px;
    }
}
.modal-body {
    padding: 48px 24px 24px;
    &__close {
        position: absolute;
        top: 8.5px;
        right: 8.5px;
    }
    &__display {
        width: 320px;
        height: 320px;
    }
    &__name {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
        min-height: 42px;
        color: #000;
        font-family: $sf_mono;
        font-size: 12px;
        line-height: 1.2;
    }
    &__controls {
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