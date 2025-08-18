<template>
    <div class="aside">
        <div class="aside__header">
            <MainTitle
                :label="label"
                :btnLabel="btnLabel"
                @btnClick="$emit('btnClick')"
                class="aside__title"
            />
            <MainButton 
                label="close modal"
                :isLabelShow=false
                :icon="iconType.close"
                :theme="themeType.primary"
                @click="$emit('closeAside')"
                class="aside__close"
            />
        </div>
        <UiScrollbar class="aside__scrollbar">
            <slot />
        </UiScrollbar>
	</div>
</template>
<script setup>
import { iconType } from '~~/constants/icon.constants';
import { themeType } from '~~/constants/theme.constants';
defineProps({
    label: {
        type: String,
        required: true
    },
    btnLabel: {
        type: String,
        default: ''
    }
})
</script>
<style lang="scss" scoped>
.aside {
    &__title {
        flex: 1;
    }
    &__scrollbar {
        max-height: calc(100vh - 280px);
    }
    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
    }
    &__close {
        margin-left: 8px;

        @media (min-width: 1319px) {
            display: none;
        }
    }
}
</style>