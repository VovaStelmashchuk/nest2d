<template>
    <button
        :class="buttonClasses"
        :disabled="isDisable"
        :aria-label="label"
        :title="label"
        class="button"
    >
        <span class="button__icon"/>
    </button>
</template>
<script>
import { computed } from 'vue';
import { defaultIconType } from '~~/constants/icon.constants';
import { defaultSizeType } from '~~/constants/size.constants';
import { defaultThemeType } from '~~/constants/theme.constants';

export default {
    name: "MainButton",
    props: {
        label: {
            type: String,
            default: '',
        },
        size: {
            type: String,
            default: defaultSizeType
        },
        theme: {
            type: String,
            default: defaultThemeType
        },
        icon: {
            type: String,
            default: defaultIconType
        },
        isDisable: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const { size, theme, icon } = toRefs(props)
        const buttonClasses = computed(() => ({
            [`button--size-${unref(size)}`]: Boolean(unref(size)),
            [`button--theme-${unref(theme)}`]: Boolean(unref(theme)),
            [`button--icon-${unref(icon)}`]: Boolean(unref(icon)),
        }))

        return {
            buttonClasses
        }
    }
};
</script>
<style lang="scss" scoped>
.button {
    $self: &;
    display: block;
    transition: background-color 0.3s, opacity 0.3s;
    width: max-content;

    &--size-m {
        border-radius: 6px;
        padding: 12px;
    }
    &--size-s {
        border-radius: 5px;
        padding: 9px;
    }

    &__icon {
        display: block;
        width: 12px;
        height: 12px;
        background-size: contain;
    }
    &--theme-secondary {
        background-color: rgb(0, 11, 33, 0.05);
    }

    &--icon-trash {
        #{$self}__icon {
            background-image: url('/icons/svg/trash.svg')
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
    }
    
    &[disabled] {
        pointer-events: none;
        opacity: 0.3;
    }
}
</style>