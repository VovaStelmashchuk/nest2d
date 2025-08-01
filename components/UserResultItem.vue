<template>
    <div class="result">
        <template v-if="isResultNexting">
            <MainLoader :size="sizeType.s" :theme="themeType.secondary" class="result__display" />
            <p class="result__text">
                Nesting</p>
        </template>
        <template v-else>
            <div v-if="isResultFailed" class="result__placeholder">
                Err
            </div>
            <template v-else>
                <div class="result__svg-row">
                    <SvgDisplay v-for="(svg, idx) in result.svgs" :key="svg + idx" :size="sizeType.s" :src="svg"
                        class="result__display" />
                </div>
            </template>
            <p class="result__name">
                {{ result.slug }}.dxf
            </p>
            <div class="result__controls controls">
                <MainButton v-if="isResultCompleted" :href="downloadUrl" :label="downloadButtonText" tag="a"
                    :size="sizeType.s" :theme="themeType.primary" class="controls__download" />
            </div>
            <button @click="openModal()" class="result__area" />
        </template>
    </div>
</template>
<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";
import { computed, unref } from "vue";

const { result } = defineProps({
    result: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(["openModal"]);

const isMultiSheet = computed(() => {
    return unref(result).isMultiSheet
})

const downloadUrl = computed(() => {
    return unref(result).downloadUrl
})

const downloadButtonText = computed(() => {
    if (isMultiSheet.value) {
        return 'Download All'
    }
    return 'Download'
})

const isResultNexting = computed(() => {
    return [statusType.unfinished, statusType.pending].includes(unref(result).status)
})
const isResultFailed = computed(() => {
    return unref(result).status === statusType.failed
})
const isResultCompleted = computed(() => {
    return unref(result).status === statusType.completed || unref(result).status === statusType.done
})
const openModal = () => {
    emit('openModal')
}
</script>
<style lang="scss" scoped>
.result {
    $self: &;
    position: relative;
    display: block;
    padding: 15px;
    border: 1px solid var(--separator-secondary);
    border-radius: 8px;
    transition: border-color 0.3s;

    &__svg-row {
        max-width: 128px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        margin-bottom: 8px;
    }

    &__display,
    &__placeholder {
        width: 40px;
        height: 40px;
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 6px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        color: var(--label-primary);
    }
    &__name {
        max-width: 240px;
        word-break: break-all;
    }

    &__name,
    &__text {
        margin-top: 10px;
        color: var(--label-secondary);
        transition: color 0.3s;
    }

    &__text {
        &::after {
            content: '';
            animation: dots 2s infinite linear;
        }
    }

    &__area {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        cursor: pointer;
    }

    &__controls {
        z-index: 1;
        position: absolute;
        top: 8px;
        right: 8px;
    }

    @media (hover:hover) {
        &:hover {
            .controls {
                &__delete {
                    opacity: 1;
                }
            }

            border-color: var(--separator-primary);

            #{$self}__name {
                color: var(--label-primary);
            }
        }
    }
}

@keyframes dots {
    0% {
        content: '';
    }

    33.33% {
        content: '.';
    }

    66.66% {
        content: '..';
    }

    100% {
        content: '...';
    }
}

.controls {
    display: flex;
    align-items: center;

    &__delete {
        opacity: 0;
        transition: opacity 0.3s;
    }

    &__download {
        margin-left: 5px;
    }
}
</style>
