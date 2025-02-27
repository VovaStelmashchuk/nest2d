<template>
    <div class="main">
        <RunningLine textValue="The project still under development" />
        <MainHeader class="main__header" />
        <main class="main__content content">
            <UserProjects />   
            <slot />
            <MainResults />
        </main>
        <Footer />
    </div>
    <QueueModal />
</template>
<script setup></script>
<style lang="scss" scoped>
.main {
    background-color: #F5F4F0;
    flex-direction: column;
    display: flex;
    min-height: 100vh;

    &__header {
        margin-left: auto;
        margin-right: auto;
        max-width: 1280px;
        width: 100%;
    }
    &__content {
        flex-grow: 1;
        margin: 40px auto;
        max-width: 1280px;
        width: 100%;
    }
}

.content {
    display: grid;
    grid-template-columns: 1fr 640px 1fr;
    gap: 40px;
}
</style>