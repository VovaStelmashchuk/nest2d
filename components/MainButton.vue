<template>
    <component
        :is="tag" 
        :class="buttonClasses"
        :href="href"
        :target="target"
        class="button"
    >
        <span class="button__label">
            {{ label }}
        </span>
    </component>
</template>
<script setup>
import { computed } from 'vue';
import { defaultSizeType } from '~~/constants/size.constants';
import { defaultThemeType } from '~~/constants/theme.constants';

const { size, theme, isDisable } = defineProps({
    label: {
        type: String,
        default: '',
    },
    href: {
        type: String,
        default: '',
    },
    target: {
        type: String,
        default: '_self'
    },
    size: {
        type: String,
        default: defaultSizeType
    },
    theme: {
        type: String,
        default: defaultThemeType
    },
    tag: {
        type: String,
        default: 'button'
    },
    isDisable: {
        type: Boolean,
        default: false
    }
}) 

const buttonClasses = computed(() => ({
    [`button--size-${unref(size)}`]: Boolean(unref(size)),
    [`button--theme-${unref(theme)}`]: Boolean(unref(theme)),
    'button--disabled': unref(isDisable),
}))
</script>
<style lang="scss" scoped>
.button {
    $self: &;
    display: block;
    transition: background-color 0.3s, opacity 0.3s;
    width: max-content;

    &__label {
        line-height: 1.2;
        display: block;
        font-family: $sf_mono;
        font-weight: 700;
    }
    &--size-s {
        border-radius: 5px;
        padding: 9px;

        #{$self}__label {
            font-size: 10px;
        }
    }
    &--size-m {
        border-radius: 6px;
        padding: 12px;

        #{$self}__label {
            font-size: 12px;
        }
    }
    &--theme-ghost {
        #{$self}__label {
            color: #000;
        }
    }
    &--theme-secondary {
        background-color: rgb(0, 11, 33, 0.05);
        #{$self}__label {
            color: #000;
        }
    }
    &--theme-primary {
        background-color: #000;
        #{$self}__label {
            color: #F5F4F0;
        }
    }
    @media (hover:hover) {
        &--theme-ghost {
            &:hover {
                background-color: rgb(0, 11, 33, 0.05);
            }
        }
        &--theme-secondary {
            &:hover {
                background-color: rgb(0, 11, 33, 0.08);
            }
        }
        &--theme-primary {
            &:hover {
                background-color: rgb(0, 0, 0, 0.8);
            }
        }
    }
    
    &--disabled {
        pointer-events: none;
        opacity: 0.3;
    }
}
</style>