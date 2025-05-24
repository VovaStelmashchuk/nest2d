<template>
    <DialogWrapper>
        <div class="modal">
            <div class="modal__wrapper">
                <img
                    :src="screenshotModalData"
                    :class="displayClasses"
                    alt="project ui"
                    class="modal__display"
                />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
const { getters } = globalStore
const screenshotModalData = computed(() => getters.screenshotModalData)

</script>

<style lang="scss" scoped>
.modal {
    padding: 48px 24px 24px;
    &__wrapper {
        position: relative;
    }       
    &__display {
        object-fit: contain;
        width: 100%;
        max-width: calc(80vw - 48px);
        max-height: calc(80vh - 72px);
    }
}

</style>

