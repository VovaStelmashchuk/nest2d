<template>
    <div class="files">
        <DxfUpload @files="addFiles" />
        <div
            v-for="(file, fileIndex) in projectFiles"
            :key="file.slug"
            class="files__item file"
        >
            <SvgDisplay
                v-if="Boolean(file.svgUrl)"
                :size="sizeType.s"
                :src="file.svgUrl"
                class="file__display"
            />
            <MainLoader 
                v-else
                :theme="themeType.secondary"
                class="file__display"
            />
            <p class="file__name">
                {{ file.name }}
            </p>
            <div class="counter">
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
        </div>
    </div>
</template>
<script setup>
import { themeType } from '~~/constants/theme.constants';
import { sizeType } from "~~/constants/size.constants";
import { iconType } from "~~/constants/icon.constants";

defineProps({
    projectFiles: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(["addFiles", "increment", "decrement"])

const addFiles = (files) => emit("addFiles", files)
const increment = (index) => emit("increment", index)
const decrement = (index) => emit("decrement", index)

</script>

<style lang="scss" scoped>
.files {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
}
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
    }
    &__btn {
        opacity: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        transition: opacity 0.3s;
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
