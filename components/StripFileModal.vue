<template>
    <DialogWrapper trackingTag="strip_file">
        <div class="modal">
            <div class="modal__wrapper">
                <DxfViewerComponent
                    :dxfUrl="fileModalData.dxfUrl"
                    :isFullScreen="true"
                    class="modal__display modal__display--is-fullscreen"
                />
            </div>
            <div class="modal__name">
                {{ fileModalData.name }}
            </div>
            <p v-if="minHeight != null" class="modal__height">
                Min height: {{ minHeight }}mm
            </p>
        </div>
    </DialogWrapper>
</template>

<script setup>
const { getters } = stripStore;
const fileModalData = computed(() => getters.fileModalData);

const minHeight = computed(() => {
    const value = unref(fileModalData)?.minHeight
    if (value == null) {
        return null
    }
    return Math.round(value * 100) / 100
})
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
    &__display {
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
        align-items: center;
        text-align: left;
        margin-top: 10px;
        min-height: 42px;
        color: var(--label-primary);
    }
    &__height {
        text-align: left;
        margin-bottom: 10px;
        font-size: 14px;
        color: var(--label-tertiary);
    }
}
</style>
