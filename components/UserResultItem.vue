<template>
    <div class="result">
        <template v-if="isResultNexting">
            <MainLoader 
                :size="sizeType.s"
                :theme="themeType.secondary"
                class="result__display"
            />
            <p class="result__text">
                Nesting</p>
        </template>
        <template v-else>
            <div 
                v-if="isResultFailed"
                class="result__placeholder"
            >
                Err
            </div>
            <SvgDisplay
                v-else
                :size="sizeType.s"
                :src="svgSrc"
                class="result__display"
            />
            <p class="result__name">
                {{ result.slug }}.dxf
            </p>
            <div class="result__controls controls">
                <!-- <div class="controls__delete">
                    <MainButton 
                        :label="`delete ${item.projectName}`"
                        :size="sizeType.s"
                        :icon="iconType.trash"
                        :isLabelShow=false
                        @click="console.log(`delete ${item.projectName}`)"
                    />
                </div> -->
                <MainButton 
                    v-if="isResultCompleted"
                    :href="API_ROUTES.DXFFILE(result.slug)"
                    label="Download"
                    tag="a"
                    :size="sizeType.s"
                    :theme="themeType.primary"
                    class="controls__download"
                />
            </div>
            <button
                @click="openModal()" 
                class="result__area"
            />
        </template>
    </div>
</template>
<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";
import { computed } from "vue";

const { result } = defineProps({
    result: {
        type: Object,
        required: true
    }
})
const emit = defineEmits(["openModal"]);

const svgSrc = computed(() => {
    return `${unref(result).svg}`
})
const isResultNexting = computed(() => {
    return [statusType.unfinished, statusType.pending].includes(unref(result).status)
})
const isResultFailed = computed(() => {
    return unref(result).status === statusType.failed
})
const isResultCompleted = computed(() => {
    return unref(result).status === statusType.completed
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
