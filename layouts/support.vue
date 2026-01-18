<template>
    <div class="main">
        <MainHeader
            :theme="themeType.primary"
            class="main__header"
        />
        <main class="main__content content">
            <slot />
        </main>
        <Footer />
    </div>
</template>
<script setup>
import { themeType } from '~~/constants/theme.constants';
const supportDialog = useSupportDialog();

</script>
<style lang="scss" scoped>
.main {
    background-color: var(--background-primary);
    flex-direction: column;
    display: flex;
    min-height: 100vh;

    &__header {
        margin-left: auto;
        margin-right: auto;
        max-width: 1300px;
        width: 100%;
    }
    &__content {
        flex-grow: 1;
        margin: 8px auto;
        max-width: 1300px;
        width: 100%;

        @media (min-width: 567px) {
            margin-top: 40px;
            margin-bottom: 40px;
        }
    }
    &__line {
        position: relative;
        z-index: 2;
    }
}
.content {
    padding-left: 10px;
    padding-right: 10px;
}
</style>