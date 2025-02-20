<template>
    <div class="dispay">
        <img
            :src="svgDataUri"
            alt="SVG Image"
            class="dispay__img"
        />
    </div>
</template>

<script>
export default {
    props: {
        svgContent: {
            type: String,
            required: true,
        },
    },
    computed: {
        svgDataUri() {
            const encodedSvg = encodeURIComponent(this.svgContent)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22");

            return `data:image/svg+xml,${encodedSvg}`;
        },
    },
};
</script>

<style lang="scss" scoped>
.dispay {
    font-family: $sf_mono;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    background-color: rgb(0, 11, 33, 0.05);
    &__img {
        display: block;
        max-height: 100%;
        max-width: 100%;
    }
}
</style>
