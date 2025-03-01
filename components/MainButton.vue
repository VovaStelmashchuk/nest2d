<template>
    <component
        :is="tag" 
        :class="buttonClasses"
        v-bind="attr"
        class="button"
    >
        <span v-if="Boolean(icon)" class="button__icon" />
        <span v-if="isLabelShow" class="button__label">
            {{ label }}
        </span>
    </component>
</template>
<script setup>
import { computed, unref } from 'vue';
import { defaultSizeType } from '~~/constants/size.constants';
import { defaultThemeType } from '~~/constants/theme.constants';

const { label, icon, target, href, size, theme, isDisable, isLabelShow } = defineProps({
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
        default: ''
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
    },
    icon: {
        type: String,
        default: ''
    },
    isLabelShow: {
        type: Boolean,
        default: true
    }
}) 
const attr = computed(() => {
    const hrefValue = Boolean(unref(href)) ? { href: unref(href) } : {} 
    const targetValue = Boolean(unref(target)) ? { target: unref(target) } : {}
    const titleValue = !unref(isLabelShow)  ? { tilte: unref(label), 'aria-label': unref(label) } : {}
    return {
        ...hrefValue,
        ...targetValue,
        ...titleValue,
    }
})
const buttonClasses = computed(() => ({
    [`button--size-${unref(size)}`]: Boolean(unref(size)),
    [`button--theme-${unref(theme)}`]: Boolean(unref(theme)),
    [`button--icon-${unref(icon)}`]: Boolean(unref(icon)),
    'button--disabled': unref(isDisable),
}))
</script>
<style lang="scss" scoped>
.button {
    $self: &;
    display: flex;
    transition: background-color 0.3s, opacity 0.3s;
    width: max-content;

    &__label {
        line-height: 1.2;
        display: block;
        font-family: $sf_mono;
        font-weight: 700;
    }
    &__icon {
        display: block;
        background-size: contain;
    }

    &--size-s {
        border-radius: 5px;
        padding: 9px;

        #{$self}__label {
            font-size: 10px;
        }
        #{$self}__icon {
            width: 12px;
            height: 12px;
        }
    }
    &--size-m {
        border-radius: 6px;
        padding: 12px;

        #{$self}__label {
            font-size: 12px;
        }
        #{$self}__icon {
            width: 14px;
            height: 14px;
        }
    }
    &--theme-ghost {
        #{$self}__label {
            color: var(--main-back);
        }
    }
    &--theme-secondary {
        background-color: var(--fill-tertiary);
        #{$self}__label {
            color: var(--main-back);
        }
    }
    &--theme-primary {
        background-color: var(--main-back);
        #{$self}__label {
            color: var(--background-primary);
        }
    }

    &--icon-trash {
        #{$self}__icon {
            background-image: url('/icons/svg/trash.svg')
        }
    }
    &--icon-minus {
        #{$self}__icon {
            background-image: url('/icons/svg/minus.svg')
        }
    }
    &--icon-plus {
        #{$self}__icon {
            background-image: url('/icons/svg/plus.svg')
        }
    }
    &--icon-unlock {
        #{$self}__icon {
            background-image: url('/icons/svg/unlock.svg')
        }
    }
    &--icon-lock {
        #{$self}__icon {
            background-image: url('/icons/svg/lock.svg')
        }
    }
    &--icon-close {
        #{$self}__icon {
            background-image: url('/icons/svg/close.svg')
        }
    }
    &--icon-menu {
        #{$self}__icon {
            background-image: url('/icons/svg/menu.svg')
        }
    }

    @media (hover:hover) {
        &--theme-ghost {
            &:hover {
                background-color: var(--fill-tertiary);
            }
        }
        &--theme-secondary {
            &:hover {
                background-color: var(--fill-secondary);
            }
        }
        &--theme-primary {
            &:hover {
                background-color: var(--accent-secondary);
            }
        }
    }
    
    &--disabled {
        pointer-events: none;
        opacity: 0.3;
    }
}
</style>