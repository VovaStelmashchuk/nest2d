<template>
    <div
        :class="dispayClasses"
        class="dispay"
    >
        <img
            :src="svgDataUri"
            alt="SVG Image"
            class="dispay__img"
        />
    </div>
</template>

<script setup>
import { defaultSizeType } from "~~/constants/size.constants";

const { svgContent, src, size } = defineProps({
    svgContent: {
        type: String,
        default: '',
    },
    src: {
        type: String,
        default: '',
    },
    size: {
        type: String,
        default: defaultSizeType,
    },
});

const svgDataUri = computed(() => {
    if(Boolean(src)) {
        return src
    }
    const encodedSvg = encodeURIComponent(svgContent)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

    return `data:image/svg+xml,${encodedSvg}`;
})

const dispayClasses = computed(() => ({
    [`dispay--size-${unref(size)}`]: Boolean(unref(size))
}))

</script>
<style lang="scss" scoped>
.dispay {
    font-size: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &--size-m {
        padding: 8px;
        border-radius: 8px;
    }
    &--size-s {
        padding: 4px;
        border-radius: 6px;
    }
    background-color: var(--fill-tertiary);
    &__img {
        display: block;
        max-height: 100%;
        max-width: 100%;
        width: 100%;
    }
}
</style>
