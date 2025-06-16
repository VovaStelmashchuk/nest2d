<template>
    <DialogWrapper>
        <div class="modal">
            <MainTitle class="modal__title" label="Nesting in Progress" />
            <div class="modal__text text">
                <p class="text__item">
                    Nesting might take a few minutes depending on the file complexity.
                </p>
                <p class="text__item">
                    You don’t need to stay on this page — the process runs entirely on our servers. Feel free to close
                    this tab or continue with other work.
                </p>
                <p class="text__item">
                    Would you like to get an email notification when it’s finished?
                </p>
            </div>
            <div class="modal__controls controls">
                <MainButton label="Notify me via email" :size="sizeType.s" :theme="themeType.primary"
                    :icon="iconType.bell" @click="email" />
                <MainButton label="Just close" :size="sizeType.s" :theme="themeType.secondary"
                    @click="infoAboutNestDialog = false" />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { unref } from 'vue'
import { iconType } from '~~/constants/icon.constants'
import { sizeType } from '~~/constants/size.constants'
import { themeType } from '~~/constants/theme.constants'

const { getters } = globalStore
const nestDialogData = computed(() => getters.nestDialogData)
const infoAboutNestDialog = useInfoAboutNest()

const email = async () => {
    const data = unref(nestDialogData)
    console.log(data.slug)
    await $fetch(`/api/nest/${data.slug}/notify`, {
        method: 'POST',
    })
    infoAboutNestDialog.value = false
}

</script>

<style lang="scss" scoped>
.modal {
    padding: 48px 24px 24px;
    min-width: 368px;

    &__title {
        max-width: 320px;
        margin-bottom: 16px;
    }

    &__text {
        max-width: 320px;
        margin-bottom: 32px;
    }
}

.text {
    color: var(--label-primary);

    &__item {
        &:not(:last-child) {
            margin-bottom: 16px;
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
