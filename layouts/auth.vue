<template>
    <div class="main">
        <RunningLine class="main__line" />
        <MainHeader
            :theme="themeType.primary"
            class="main__header"
        />
        <main class="main__content content">
            <div class="content__controls controls">
                <div :class="{'controls__bg--open': projectsIsOpen || resultsIsOpen}" @click="close" class="controls__bg"></div>
                <MainButton
                    @click="openProjects"
                    class="controls__btn controls__btn--projects"
                    :theme="themeType.secondary"
                    label="Open projects"
                />
                <MainButton
                    @click="openResults"
                    class="controls__btn controls__btn--results"
                    :theme="themeType.secondary"
                    :label="isHomePage ? 'Open all results' : 'Open results'"
                />
            </div>
            <UserProjects @closeAside="close" :class="{'content__projects--open': projectsIsOpen}" class="content__projects"/>
            <slot />
            <UserResults @closeAside="close" :class="{'content__results--open': resultsIsOpen}" class="content__results" />
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
const route = useRoute()
const supportDialog = useSupportDialog();
const buyCreditsDialog = useBuyCreditsDialog();
const projectsIsOpen = ref(false);
const resultsIsOpen = ref(false);
const openProjects = () => {
    projectsIsOpen.value = true;
}
const openResults = () => {
    resultsIsOpen.value = true;
}
const close = () => {
    projectsIsOpen.value = false;
    resultsIsOpen.value = false;
}
const isHomePage = computed(() => {
    return route.path === '/home'
})
</script>
<style lang="scss" scoped>
.main {
    overflow: hidden;
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
        bottom: 120px;
        right: 40px;
        z-index: 3;

        @media (min-width: 1199px) {
            bottom: 60px;
            right: 60px;
        }
    }
}
.content {
    padding-left: 10px;
    padding-right: 10px;
    position: relative;
    
    @media (min-width: 1319px) {
        display: grid;
        grid-template-columns: 1fr 640px 1fr;
        gap: 40px;
    }

    &__controls {
        margin-bottom: 16px;
    }
    &__projects {
        z-index: 4;
        position: absolute;
        left: 0;
        top: 0;
        width: 280px;
        transform: translateX(-200%);
        transition: transform 0.3s ease;

        @media (min-width: 1319px) {
            position: initial;
            left: initial;
            top: initial;
            width: initial;
            transform: initial;
        }

        &--open {
            transform: translateX(10px);

            @media (min-width: 1319px) {
                transform: initial;
            }
        }

        &::after {
            z-index: -1;
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border-radius: 0 10px 10px 0;
            background-color: var(--background-primary);

            @media (min-width: 1319px) {
                display: none;
            }
        }
    }
    &__results {
        z-index: 4;
        top: 0;
        right: 0;
        position: absolute;
        width: 280px;
        transform: translateX(200%);
        transition: transform 0.3s ease;

        @media (min-width: 1319px) {
            position: initial;
            right: initial;
            top: initial;
            width: initial;
            transform: initial;
        }

        &--open {
            transform: translateX(-10px);

            @media (min-width: 1319px) {
                transform: initial;
            }
        }

        &::after {
            z-index: -1;
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border-radius: 10px 0 0 10px;
            background-color: var(--background-primary);

            @media (min-width: 1319px) {
                display: none;
            }
        }
    }
}
.controls {
    display: flex;
    justify-content: space-between;

    @media (min-width: 1319px) {
        display: none;
    }

    &__bg {
        z-index: 4;    
        position: fixed;
        top: 0;
        height: 100vh;
        left: 0;
        width: 100vw;
        background-color: var(--label-tertiary);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;

        &--open {
            opacity: 1;
            pointer-events: all;
        }
    }
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