<template>
    <div class="main">
        <RunningLine class="main__line" />
        <MainHeader
            :theme="themeType.primary"
            class="main__header"
        />
        <main class="main__content content">
            <UserProjects />   
            <slot />
            <UserResults />
        </main>
        <ChatSupport v-if="supportDialog" />
        <button 
            @click="supportDialog = true"
            v-if="!supportDialog"
            class="main__btn btn"
        >
            <span class="btn__icon">
                <span class="btn__dots"> 
                    •••
                </span>
            </span>
            <span class="btn__label">
                Support
            </span>
        </button>
        <Footer />
        <BuyCreditsDialog v-model:isModalOpen="buyCreditsDialog" />
    </div>
</template>
<script setup>
import { themeType } from '~~/constants/theme.constants';
const supportDialog = useSupportDialog();
const buyCreditsDialog = useBuyCreditsDialog();


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
        margin: 40px auto;
        max-width: 1300px;
        width: 100%;
    }
    &__line {
        position: relative;
        z-index: 2;
    }

    &__btn {
        position: fixed;
        bottom: 60px;
        right: 60px;
        z-index: 3;
    }
}
.content {
    padding-left: 10px;
    padding-right: 10px;
    display: grid;
    grid-template-columns: 1fr 640px 1fr;
    gap: 40px;
}
.btn {
    $self: &;
    display: flex;
    align-items: center;
    border-radius: 6px;
    padding: 12px 32px 12px 12px;
    transition: opacity 0.3s;
    width: max-content;
    background-color: var(--background-secondary);

    &__label {
        z-index: 1;
        color: var(--background-primary);
        display: block;
        font-weight: 700;
    }

    &__dots {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%);
        line-height: 0;
        background-color: var(--background-primary);
        color: var(--background-secondary);
        top: 47%;
        left: 50%;
        border-radius: 4px 4px 0 4px;
        width: 30px;
        height: 18px;   

        &::after {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid var(--background-primary);
            border-bottom: 10px solid transparent;
            top: 100%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }

    &__icon {
        z-index: 2;
        position: absolute;
        background-color: var(--background-secondary);
        width: 60px;
        height: 60px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        top: 50%;
        left: 100%;
    }

    @media (hover:hover) {
        &:hover {
            opacity: 0.8;
        }
    }
}
</style>