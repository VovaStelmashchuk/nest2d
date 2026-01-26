<template>
    <div class="result">
        <template v-if="isResultNexting">
            <MainLoader 
                :size="sizeType.s" 
                :theme="themeType.secondary" 
                class="result__display"
            />
            <p class="result__text">
                Nesting
            </p>
        </template>
        <template v-else>
            <div v-if="isResultFailed" class="result__placeholder">
                Err
            </div>
            <template v-else>
                <div 
                    :class="dxfRowClasses"
                    class="result__dxf-row"
                >
                    <DxfViewerComponent 
                        v-for="(dxf, dxfIndex) in result.dxfs" 
                        :key="`${dxf}-${dxfIndex}`" 
                        :dxfUrl="dxf"
                        :size="sizeType.s"
                        class="result__display" 
                    />
                </div>
            </template>
            <p class="result__name">
                {{ result.slug }}.dxf
            </p>
            <div class="result__controls controls">
                <MainButton 
                    v-if="isResultCompleted" 
                    :href="downloadUrl" 
                    :label="downloadButtonText" 
                    tag="a"
                    :size="sizeType.s" 
                    :theme="themeType.primary" 
                    class="controls__download" 
                    @click="onDownload" 
                />
            </div>
            <button 
                type="button"
                @click="openModal" 
                class="result__area" 
                aria-label="Open result details"
            />
        </template>
    </div>
</template>

<script setup>
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";
import { trackEvent } from '~~/utils/track';
import { computed } from "vue";

const props = defineProps({
    result: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(["openModal"]);

const isMultiSheet = computed(() => {
    return props.result?.isMultiSheet ?? false;
});

const downloadUrl = computed(() => {
    return props.result?.downloadUrl ?? '';
});

const downloadButtonText = computed(() => {
    return isMultiSheet.value ? 'Download All' : 'Download';
});

const hasMultipleDxfs = computed(() => {
    return (props.result?.dxfs?.length ?? 0) > 1;
});

const dxfRowClasses = computed(() => {
    return ['result__dxf-row', { 'result__dxf-row--multi': hasMultipleDxfs.value }];
});

const isResultNexting = computed(() => {
    const status = props.result?.status;
    return status === statusType.unfinished || status === statusType.pending;
});

const isResultFailed = computed(() => {
    return props.result?.status === statusType.failed;
});

const isResultCompleted = computed(() => {
    const status = props.result?.status;
    return status === statusType.completed || status === statusType.done;
});

const openModal = () => {
    emit('openModal');
};

const onDownload = () => {
    trackEvent('click_download_button', {
        slug: props.result?.slug,
        isMultiSheet: isMultiSheet.value
    });
};
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

    &__dxf-row {
        max-width: 128px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 4px;
        margin-bottom: 8px;

        &--multi {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    &__display,
    &__placeholder {
        width: 40px;
        height: 40px;
        min-height: 40px;
        overflow: hidden;
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
        border: none;
        background: transparent;
        padding: 0;
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
