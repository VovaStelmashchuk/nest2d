<template>
    <header class="title">
        <p class="value">
           <span class="value__label">
                {{ label }}
           </span> 
        </p>
        <MainButton 
            v-if="btnLabel"
            @click="$emit('btnClick')"
            :label="btnLabel"
            :theme="themeType.secondary"
            tag="button"
            class="title__btn"
        />
    </header>
</template>
<script setup>
import { themeType } from '~~/constants/theme.constants';

defineProps({
    label: {
        type: String,
        required: true
    },
    btnLabel: {
        type: String,
        default: '',
    }
}) 
</script>
<style lang="scss" scoped>
.title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__btn {
        margin-left: 16px;
    }
}
.value {
    padding-top: 9px;
    padding-bottom: 9px;
    &__label {
        display: block;
        font-size: 17px;
        font-weight: 600;
        color: var(--main-back);
    }
}
</style>