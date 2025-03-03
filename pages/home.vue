<template>
    <div class="home">
        <MainTitle 
            label="Upload your .DXF files"
            class="home__title"
        />
        <DragAndDrop /> 
    </div>
</template>

<script setup>
definePageMeta({
    layout: "auth",
    middleware: "auth",
});
</script>

<style lang="scss" scoped>
.home {
    &__title {
        margin-bottom: 16px;
    }
}
</style>