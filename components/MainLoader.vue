<template>
    <div 
        :class="loaderClasses"
        class="loader"
    />
</template>
<script setup>
import { defaultSizeType } from "~~/constants/size.constants";
import { defaultThemeType } from "~~/constants/theme.constants";

const { size, theme } = defineProps({
    size: {
        type: String,
        default: defaultSizeType,
    },
    theme: {
        type: String,
        default: defaultThemeType,
    },
}) 
const loaderClasses = computed(() => ({
    [`loader--size-${unref(size)}`]: Boolean(unref(size)),
    [`loader--theme-${unref(theme)}`]: Boolean(unref(theme))
}))

</script>
<style lang="scss" scoped>
.loader {
    position: relative;

    &::after {
        top: 50%;
        left: 50%;
        width: 1px;
        height: 1px;
        content: '';
        position: absolute;
        transform: translate(-50%, -50%);
        color: var(--accent-primary);
        animation-duration: 6s;
        animation-iteration-count: infinite;
    }

    &--theme-secondary {
        background-color: var(--fill-tertiary);
    }

    &--size-l {
        &::after {
            box-shadow: -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px;
            animation-name: loader-l;
        }
    }
    &--size-m {
        border-radius: 6px;
        &::after {
            box-shadow: -10px -10px 0 7px, -10px -10px 0 7px, -10px -10px 0 7px, -10px -10px 0 7px;
            animation-name: loader-m;
        }
    }
    &--size-s {
        border-radius: 6px;
        &::after {
            box-shadow: -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px;
            animation-name: loader-s;
        }
    }
}

@keyframes loader-l {
    0%, 100% {
        box-shadow: -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px;
    }
    8.33%, 91.63% {
        box-shadow: -20px -20px 0 16px, 20px -20px 0 16px, 20px -20px 0 16px, 20px -20px 0 16px;
    }
    16.66%, 83.3% {
        box-shadow: -20px -20px 0 16px, 20px -20px 0 16px, 20px 20px 0 16px, 20px 20px 0 16px;
    }
    24.99%, 74.97% {
        box-shadow: -20px -20px 0 16px, 20px -20px 0 16px, 20px 20px 0 16px, -20px 20px 0 16px;
    }
    33.32%, 66.64% {
        box-shadow: -20px -20px 0 16px, 20px -20px 0 16px, 20px 20px 0 16px, -20px -20px 0 16px;
    }
    41.65%, 58.31% {
        box-shadow: 20px -20px 0 16px, 20px -20px 0 16px, 20px 20px 0 16px, 20px -20px 0 16px;
    }
    49.98% {
        box-shadow: 20px 20px 0 16px, 20px 20px 0 16px, 20px 20px 0 16px, 20px 20px 0 16px;
    }
}

@keyframes loader-m {
    0%, 100% {
        box-shadow: -8px -8px 0 6px, -8px -8px 0 6px, -8px -8px 0 6px, -8px -8px 0 6px;
    }
    8.33%, 91.63% {
        box-shadow: -8px -8px 0 6px, 8px -8px 0 6px, 8px -8px 0 6px, 8px -8px 0 6px;
    }
    16.66%, 83.3% {
        box-shadow: -8px -8px 0 6px, 8px -8px 0 6px, 8px 8px 0 6px, 8px 8px 0 6px;
    }
    24.99%, 74.97% {
        box-shadow: -8px -8px 0 6px, 8px -8px 0 6px, 8px 8px 0 6px, -8px 8px 0 6px;
    }
    33.32%, 66.64% {
        box-shadow: -8px -8px 0 6px, 8px -8px 0 6px, 8px 8px 0 6px, -8px -8px 0 6px;
    }
    41.65%, 58.31% {
        box-shadow: 8px -8px 0 6px, 8px -8px 0 6px, 8px 8px 0 6px, 8px -8px 0 6px;
    }
    49.98% {
        box-shadow: 8px 8px 0 6px, 8px 8px 0 6px, 8px 8px 0 6px, 8px 8px 0 6px;
    }
}

@keyframes loader-s {
    0%, 100% {
        box-shadow: -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px;
    }
    8.33%, 91.63% {
        box-shadow: -5px -5px 0 3px, 5px -5px 0 3px, 5px -5px 0 3px, 5px -5px 0 3px;
    }
    16.66%, 83.3% {
        box-shadow: -5px -5px 0 3px, 5px -5px 0 3px, 5px 5px 0 3px, 5px 5px 0 3px;
    }
    24.99%, 74.97% {
        box-shadow: -5px -5px 0 3px, 5px -5px 0 3px, 5px 5px 0 3px, -5px 5px 0 3px;
    }
    33.32%, 66.64% {
        box-shadow: -5px -5px 0 3px, 5px -5px 0 3px, 5px 5px 0 3px, -5px -5px 0 3px;
    }
    41.65%, 58.31% {
        box-shadow: 5px -5px 0 3px, 5px -5px 0 3px, 5px 5px 0 3px, 5px -5px 0 3px;
    }
    49.98% {
        box-shadow: 5px 5px 0 3px, 5px 5px 0 3px, 5px 5px 0 3px, 5px 5px 0 3px;
    }
}
</style>