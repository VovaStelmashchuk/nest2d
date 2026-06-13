<template>
    <div class="file">
        <template v-if="isInProgress">
            <MainLoader :theme="themeType.secondary" class="file__display file__display--loader" />
            <p class="file__name">
                {{ file.name }}
            </p>
        </template>
        <template v-else-if="isError">
            <div class="file__display file__placeholder">
                Err
            </div>
            <p class="file__name">
                {{ file.name }}
            </p>
            <MainButton :size="sizeType.s" :theme="themeType.secondary"
                href="https://github.com/VovaStelmashchuk/nest2d/issues/new" target="_blank" label="Report a problem"
                tag="a" trackingTag="report_problem" class="file__problem" />
        </template>
        <template v-else>
            <DxfViewerComponent
                :size="sizeType.s"
                :dxfUrl="file.dxfUrl"
                class="file__display"
            />
            <p class="file__name">
                {{ file.name }}
            </p>
            <p v-if="minHeight != null" class="file__height">
                Min height: {{ minHeight }}mm
            </p>
            <div class="file__counter counter">
                <MainButton :size="sizeType.s" :icon="iconType.minus" :isLabelShow="false" :isDisable="file.count < 1"
                    trackingTag="strip_file_decrement" @click="decrement(fileIndex, $event)" label="decrement" class="counter__btn" />
                <input type="number" v-model="count" min="0" max="999" class="counter__value" />
                <MainButton :size="sizeType.s" :icon="iconType.plus" :isLabelShow="false" :isDisable="file.count >= 999"
                    trackingTag="strip_file_increment" @click="increment(fileIndex, $event)" label="increment" class="counter__btn" />
            </div>
            <SelectorField v-model="rotation" :options="rotationOptions" class="file__rotation" />
            <div @click="openModal()" class="file__area" />
        </template>
    </div>
</template>

<script setup>
import { sizeType } from '~~/constants/size.constants'
import { iconType } from '~~/constants/icon.constants'
import { themeType } from '~~/constants/theme.constants'
import { processingType } from '~~/constants/files.constants'

const props = defineProps({
    file: {
        type: Object,
        required: true,
    },
    fileIndex: {
        type: Number,
        required: true,
    },
})

const emit = defineEmits(['openModal'])

const { actions } = stripStore
const { increment, decrement, updateCount, updateRotation } = actions

const isInProgress = computed(() => props.file.processingStatus === processingType.inProgress)
const isError = computed(() => props.file.processingStatus === processingType.error)

const count = computed({
    get: () => props.file.count,
    set: value => updateCount(value, props.fileIndex),
})

// Strip nesting only supports keeping the part as-is or flipping it 180°.
const rotation = computed({
    get: () => props.file.rotation || '[0]',
    set: value => updateRotation(value, props.fileIndex),
})

const rotationOptions = [
    { value: '[0]', label: 'No rotation' },
    { value: '[0, 180]', label: '180°' },
]

const minHeight = computed(() => {
    const value = props.file.minHeight
    if (value == null) {
        return null
    }
    return Math.round(value * 100) / 100
})

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

        &--loader {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 8px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        color: var(--label-primary);
        font-size: 16px;
    }

    &__problem {
        margin-left: auto;
        margin-right: auto;
    }

    &__name {
        margin-top: 16px;
        margin-bottom: 12px;
        color: var(--label-secondary);
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__height {
        margin-top: -4px;
        margin-bottom: 12px;
        font-size: 12px;
        text-align: left;
        color: var(--label-tertiary);
    }

    &__counter {
        position: relative;
        z-index: 1;
    }

    &__rotation {
        position: relative;
        z-index: 1;
        margin-top: 12px;
        width: 100%;
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

.counter {
    display: flex;
    align-items: center;
    justify-content: center;

    &__value {
        padding-left: 4px;
        padding-right: 4px;
        margin-left: 8px;
        margin-right: 8px;
        text-align: center;
        width: 36px;
        height: 30px;
        border: solid 1px var(--separator-secondary);
        border-radius: 4px;
        color: var(--accent-primary);
        outline: none;
        background-color: transparent;
        font-family: $sf_mono;

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        -moz-appearance: textfield;
    }
}
</style>
