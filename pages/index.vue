<template>
    <div class="main">
        <section class="main__header header">
            <h2 class="title title--large">
                {{ header.title }}
            </h2>
            <p class="header__text">
                {{ header.text }}
            </p>
            <MainButton
                :theme="themeType.primary"
                label="Get Started for Free"
                @click="loginDialog = true"
                class="header__btn"
            />
        </section>
        <section class="main__features features" id="features">
            <h3 class="features__title title title--medium">
                {{ features.title }}
            </h3>
            <div class="features__list features-list">
                <div 
                    v-for="featuresItem in features.list" 
                    :key="featuresItem.title"
                    class="features-list__card"
                >
                    <h4 class="features-list__title title">
                        {{ featuresItem.title }}
                    </h4>
                    <p class="features-list__text">
                        {{ featuresItem.text }}
                    </p>
                </div>
            </div>
        </section>
        <section class="main__screenshots screenshots" id="screenshots">
            <h3 class="screenshots__title title title--medium">
                {{ screenshots.title }}
            </h3>
            <div
                class="screenshots__list screenshots-list"
            >
                <img
                    v-for="screenshot in screenshots.list" 
                    :key="screenshot.src"
                    :src="screenshot.src"
                    alt="project ui"
                    class="screenshots-list__img"
                />
            </div>
        </section>
        <section class="main__works works" id="how-it-works">
            <h3 class="works__title title title--medium">
                {{ howItWorks.title }}
            </h3>
            <div class="works__list works-list">
                <div 
                    v-for="(howItWorksItem, howItWorksIdex) in howItWorks.list" 
                    :key="howItWorksItem.title"
                    class="works-list__item"
                >
                    <span class="works-list__number">
                        {{ ++howItWorksIdex }}
                    </span>
                    <h4 class="works-list__title title">
                        {{ howItWorksItem.title }}
                    </h4>
                    <p class="works-list__text">
                        {{ howItWorksItem.text }}
                    </p>
                </div>
            </div>
        </section>
        <section class="main__started started" id="get-started">
            <h3 class="started__title title title--medium">
                {{ started.title }}
            </h3>
            <p class="started__text">
                {{ started.text }}
            </p>
            <MainButton
                :theme="themeType.primary"
                label="Login / Sign Up"
                @click="loginDialog = true"
                class="started__btn"
            />
        </section>
        <section class="main__faq faq" id="faq">
            <h3 class="faq__title title title--medium">
                {{ faq.title }}
            </h3>
            <p class="faq__text">
                {{ faq.text }}
            </p>
            <div class="faq__list faq-list">
                <div 
                    v-for="faqItem in faq.list" 
                    :key="faq.title"
                    class="faq-list__item"
                >
                    <h4 class="faq-list__title title">
                        {{ faqItem.title }}
                    </h4>
                    <p>
                        {{ faqItem.firstPart }}
                        <a  
                            v-if="faqItem.link"
                            class="faq-list__link"
                            :href="faqItem.linkHref"
                            :target="faqItem.target ? faqItem.target : '_self'"
                        >
                            {{ faqItem.link }}
                        </a>
                        <template v-if="faqItem.secondPart">
                            {{ ' ' + faqItem.secondPart }}
                        </template>
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>
<script setup>
definePageMeta({
    middleware: 'auth'
})
import { header, features, screenshots, howItWorks, started, faq } from '~~/data/index'
import { themeType } from '~~/constants/theme.constants'
const loginDialog = useLoginDialog()
</script>
<style lang="scss" scoped>

.main {
    background-color: var(--background-primary);
    flex-direction: column;
    display: flex;
    min-height: 100vh;
    line-height: 1.4;
    text-align: center;
    color: var(--label-secondary);
    font-size: 18px;

    &>* {
        padding: 1rem;
        margin: 1rem;
    }
}

.title {
    color: var(--accent-primary);
    font-weight: 700;
    font-size: 20px;

    &--medium {
        font-size: 2rem;
    }
    &--large {
        font-size: 2.25rem;
    }
}

.header {
    &__text {
        margin-top: 16px;
    }
    &__btn {
        margin-top: 32px;
        margin-left: auto;
        margin-right: auto;
    }
}
.features {
    &__list {
        margin-top: 32px;
    }
}

.features-list {
    display: grid;
    gap: 32px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    text-align: left;

    &__card {
        border: 1px solid var(--separator-secondary); 
        padding: 24px;
        border-radius: 16px;
    }
    &__text {
        margin-top: 16px;
    }
}
.screenshots {
    &__list {
        margin-top: 32px;
    }
}
.screenshots-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    display: grid;
    gap: 32px;
}
.works {
    &__list {
        margin-top: 32px;
    }
}
.works-list {
    display: flex;
    
    &__item {
        flex-basis: calc(100% / 3);
    }
    &__number {
        color: var(--accent-primary);
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: 1px solid var(--separator-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        margin-left: auto;
        margin-right: auto;
    }
    &__title {
        margin-top: 16px;
        margin-bottom: 8px;
    }
}
.started {
    &__text {
        margin-top: 2px;
    }
    &__btn {
        margin-top: 32px;
        margin-left: auto;
        margin-right: auto;
    }
}
.faq {
    &__text {
        margin-top: 2px;
    }
    &__list {
        margin-top: 32px;
    }
}
.faq-list {
    text-align: left;
    
    &__item {
        margin-top: 16px;
    }
    &__link {
        color: var(--accent-primary);
        text-decoration: underline;
    }
}
</style>
