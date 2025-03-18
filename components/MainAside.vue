<template>
    <div class="aside">
        <MainTitle
            :label="label"
            :btnLabel="btnLabel"
            @btnClick="$emit('btnClick')"
            class="aside__title"
        />
        <UiScrollbar class="aside__scrollbar">
            <slot />
        </UiScrollbar>
	</div>
</template>
<script setup>
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
        margin-bottom: 16px;
    }
    &__scrollbar {
        max-height: calc(100vh - 280px);
    }
}
</style>