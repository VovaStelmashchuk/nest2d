<template>
    <div class="home">
        <UserProjects />   
        <div class="content">
            <MainTitle class="content__title" label="Upload your .DXF files" />
            <DragAndDrop /> 
        </div>
        <div>
        </div>
    </div>
</template>

<script>
definePageMeta({
    layout: "auth",
});
</script>

<style lang="scss" scoped>
.home {
    display: grid;
    grid-template-columns: 1fr 640px 1fr;
    gap: 40px;
}
.content {
    &__title {
        margin-bottom: 16px;
    }
}
</style>