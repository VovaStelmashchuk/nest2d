<template>
    <div class="file">
        <SvgDisplay
            :size="sizeType.s"
            :src="file.svgUrl"
            class="file__display"
        />
        <p class="file__name">
            {{ file.name }}
        </p>
        <div class="file__counter counter">
            <MainButton 
                :size="sizeType.s"
                :icon="iconType.minus"
                :isDisable="file.count < 1"
                :isLabelShow=false
                @click="decrement(fileIndex)"
                label="decrement"
                class="counter__btn"
            />
            <p class="counter__value">
                {{ file.count }}
            </p>
            <MainButton 
                :size="sizeType.s"
                :icon="iconType.plus"
                :isLabelShow=false
                @click="increment(fileIndex)"
                label="increment"
                class="counter__btn"
            />
        </div>
        <!-- <div class="file__btn">
            <MainButton 
                :label="`delete ${file.name}`"
                :size="sizeType.s"
                :icon="iconType.trash"
                :isLabelShow=false
                @click="console.log(`delete ${file.name}`)"
            />
        </div> -->
        <div
            @click="openModal()" 
            class="file__area"
        />
    </div>
</template>
<script setup>
import { sizeType } from "~~/constants/size.constants";
import { iconType } from "~~/constants/icon.constants";

defineProps({
    file: {
        type: Object,
        required: true
    },
    fileIndex: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(["openModal"]);

const { actions } = filesStore;
const { increment, decrement } = actions;

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
        width: 56px;
        height: 56px;
    }
    &__name {
        margin-top: 16px;
        margin-bottom: 16px;
        color: var(--label-secondary);
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    &__btn {
        opacity: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        transition: opacity 0.3s;
    }
    &__area {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        cursor: pointer;
    }
    &__counter {
        position: relative;
        z-index: 1;
    }
    @media (hover:hover) {
        &:hover {
            border-color: var(--separator-primary);

            #{$self}__name {
                color: var(--label-primary);
            }
            #{$self}__btn {
                opacity: 1;
            }
        }
    }
}
.counter {
    display: flex;
    align-items: center;

    &__value {
        color: var(--label-secondary);
        margin-left: 8px;
        margin-right: 8px;
        min-width: 24px;
        text-align: center;
    }
}
</style>
