<template>
    <div class="content">
        <MainTitle class="content__title" label="Upload your .DXF files" />
        <DragAndDrop /> 
    </div>
</template>

<script setup>
definePageMeta({
    layout: "auth",
});
</script>

<style lang="scss" scoped>
.content {
    &__title {
        margin-bottom: 16px;
    }
}
</style>