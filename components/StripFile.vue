<template>
    <div class="file">
        <DxfViewerComponent
            :size="sizeType.s"
            :dxfUrl="file.dxfUrl"
            class="file__display"
        />
        <p class="file__name">
            {{ file.name }}
        </p>
        <div @click="openModal()" class="file__area" />
    </div>
</template>

<script setup>
import { sizeType } from '~~/constants/size.constants'

defineProps({
    file: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['openModal'])

const openModal = () => {
    emit('openModal')
}
</script>

<style lang="scss" scoped>
.file {
    position: relative;
    $self: &;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--separator-secondary);
    transition: border-color 0.3s;

    &__display {
        width: 100%;
        min-height: 120px;
        pointer-events: none;
    }

    &__name {
        margin-top: 16px;
        margin-bottom: 4px;
        color: var(--label-secondary);
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__area {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        cursor: pointer;
    }

    @media (hover: hover) {
        &:hover {
            border-color: var(--separator-primary);

            #{$self}__name {
                color: var(--label-primary);
            }
        }
    }
}
</style>
