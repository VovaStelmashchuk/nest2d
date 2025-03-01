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
        color: var(--main-back);
        animation-duration: 6s;
        animation-iteration-count: infinite;
    }

    &--theme-secondary {
        background-color: var(--fill-tertiary);
    }

    &--size-m {
        &::after {
            box-shadow: -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px, -20px -20px 0 16px;
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

@keyframes loader-m {
    0% {
        box-shadow: -20px -20px 0 16px,
                    -20px -20px 0 16px,
                    -20px -20px 0 16px,
                    -20px -20px 0 16px;
    }
    8.33% {
        box-shadow: -20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px -20px 0 16px;
    }
    16.66% {
        box-shadow: -20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px 20px 0 16px,
                    20px 20px 0 16px;
    }
    24.99% {
        box-shadow: -20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    33.32% {
        box-shadow: -20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px 20px 0 16px,
                    -20px -20px 0 16px;
    }
    41.65% {
        box-shadow: 20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px 20px 0 16px,
                    20px -20px 0 16px;
    }
    49.98% {
        box-shadow: 20px 20px 0 16px,
                    20px 20px 0 16px,
                    20px 20px 0 16px,
                    20px 20px 0 16px;
    }
    58.31% {
        box-shadow: -20px 20px 0 16px,
                    -20px 20px 0 16px,
                    20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    66.64% {
        box-shadow: -20px -20px 0 16px,
                    -20px -20px 0 16px,
                    20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    74.97% {
        box-shadow: -20px -20px 0 16px,
                    20px -20px 0 16px,
                    20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    83.3% {
        box-shadow: -20px -20px 0 16px,
                    20px 20px 0 16px,
                    20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    91.63% {
        box-shadow: -20px -20px 0 16px,
                    -20px 20px 0 16px,
                    -20px 20px 0 16px,
                    -20px 20px 0 16px;
    }
    100% {
        box-shadow: -20px -20px 0 16px,
                    -20px -20px 0 16px,
                    -20px -20px 0 16px,
                    -20px -20px 0 16px;
    }
}
@keyframes loader-s {
    0% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px;
    }
    8.33% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px -5px 0 3px;
    }
    16.66% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px;
    }
    24.99% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    33.32% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px -5px 0 3px;
    }
    41.65% {
        box-shadow: 5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px -5px 0 3px;
    }
    49.98% {
        box-shadow: 5px 5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px;
    }
    58.31% {
        box-shadow: -5px 5px 0 3px,
                    -5px 5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    66.64% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    74.97% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    83.3% {
        box-shadow: -5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    91.63% {
        box-shadow: -5px -5px 0 3px,
                    -5px 5px 0 3px,
                    -5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    100% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px;
    }
}
</style>