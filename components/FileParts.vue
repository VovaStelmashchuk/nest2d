<template>
    <div class="parts">
        <h4 class="parts__title">
            {{ partsTitle}}
        </h4>
        <UiScrollbar class="parts__scrollbar">
            <ul class="parts__list">
                <li
                    v-for="(part, index) in parts"
                    :key="index"
                    class="parts__item"
                >
                    {{ part.width }} x {{ part.height }}
                </li>
            </ul>
        </UiScrollbar>
    </div>
</template>
<script setup>

const props = defineProps({
    parts: {
        type: Array,
        required: true,
    },
})
const partsTitle = computed(() => {
    return props.parts.length === 1 ? 'Part: ' : `${props.parts.length} parts: `
})
</script>
<style lang="scss" scoped>
.parts {
    color: var(--label-secondary);
    transition: color 0.3s;
    text-align: left;

    &__scrollbar {
        height: calc(100% - 19px);
    }
    &__title {
        margin-bottom: 4px;
    }

    @media (hover: hover) {
        &:hover {
            color: var(--label-primary);
        }
    }

    &__item {
        font-size: 12px;
    }
}
</style>
