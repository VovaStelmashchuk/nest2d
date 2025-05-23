<template>
    <div class="main">
        <section class="main__header header">
            <h2 class="title title--large">
                Nesting For plotters, laser & plasma cutters, and other CNC
                machines
            </h2>
            <p class="header__text">
                Upload your DXF files, input material dimensions, and let Nest2d
                reduce material waste.
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
                Features
            </h3>
            <div class="features__list features-list">
                <div class="features-list__card">
                    <h4 class="features-list__title title">
                        DXF File Support
                    </h4>
                    <p class="features-list__text">
                        Easily upload DXF files for precision laser cutting.
                    </p>
                </div>
                <div class="features-list__card">
                    <h4 class="features-list__title title">
                        Save money
                    </h4>
                    <p class="features-list__text">
                        Minimize waste by optimizing part arrangement.
                    </p>
                </div>
                <div class="features-list__card">
                    <h4 class="features-list__title title">
                        No client resource require
                    </h4>
                    <p class="features-list__text">
                        All calculation done by server.
                    </p>
                </div>
                <div class="features-list__card">
                    <h4 class="features-list__title title">
                        Open Source
                    </h4>
                    <p class="features-list__text">
                        Fully open-source and built for efficiency.
                    </p>
                </div>
            </div>
        </section>
        <section class="main__screenshots screenshots" id="screenshots">
            <h3 class="screenshots__title title title--medium">
                Intuitive design
            </h3>
            <div
                class="screenshots__list screenshots-list"
            >
                <img
                    src="/screenshots/project-ui.png"
                    alt="project ui"
                    class="screenshots-list__img"
                />
                <img
                    src="/screenshots/nest-result.png"
                    alt="project ui"
                    class="screenshots-list__img"
                />
                <img
                    src="/screenshots/preview.png"
                    alt="project ui"
                    class="screenshots-list__img"
                />
            </div>
        </section>
        <section class="main__works works" id="how-it-works">
            <h3 class="works__title title title--medium">
                How It Works
            </h3>
            <div class="works__list works-list">
                <div class="works-list__item">
                    <span class="works-list__number">
                        1
                    </span>
                    <h4 class="works-list__title title">
                        Upload DXF Files
                    </h4>
                    <p class="works-list__text">
                        Drag and drop or browse your files to upload.
                    </p>
                </div>
                <div class="works-list__item">
                    <span class="works-list__number">
                        2
                    </span>
                    <h4 class="works-list__title title">
                        Enter Material Size
                    </h4>
                    <p class="works-list__text">
                        Specify the dimensions of your material sheet.
                    </p>
                </div>
                <div class="works-list__item">
                    <span class="works-list__number">
                        3
                    </span>
                    <h4 class="works-list__title title">
                        Optimize and Download
                    </h4>
                    <p class="works-list__text">
                        Get an optimized layout ready for cutting.
                    </p>
                </div>
            </div>
        </section>
        <section class="main__started started" id="get-started">
            <h3 class="started__title title title--medium">
                Get Started Today
            </h3>
            <p class="started__text">
                Sign up and start optimizing your laser cutting projects in
                minutes.
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
                Frequently Asked Questions
            </h3>
            <p class="faq__text">
                Stuck on something? We’re here to help with all your questions
                and answers in one place.
            </p>
            <div class="faq__list faq-list">
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        Is Nest2d has a free trial?
                    </h4>
                    <p>
                        Yes, you can try us for free until your read a limit of free
                        credding. If you want, login and send a message to me via
                        support chat.
                    </p>
                </div>
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        What is your cancellation policy?
                    </h4>
                    <p>
                        I understand that things change. You can cancel your payment
                        any time, i will provide a full refound.
                    </p>
                </div>
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        Is it a one-time payment?
                    </h4>
                    <p>
                        Just a one-time payment! No recurring charges or surprises,
                        we promise. We’re just as sick of recurring charges as you
                        are.
                    </p>
                </div>
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        What file formats do you support?
                    </h4>
                    <p>
                        Currently, we support DXF files for laser cutting.
                    </p>
                </div>
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        Can I contribute to the project?
                    </h4>
                    <p>
                        Absolutely! Check out our
                        <a
                            class="faq-list__link"
                            href="https://github.com/VovaStelmashchuk/nest2D"
                            target="_blank"
                        >
                            GitHub repository</a>
                        to contribute.
                    </p>
                </div>
                <div class="faq-list__item">
                    <h4 class="faq-list__title title">
                        I still have questions.
                    </h4>
                    <p>
                        Fill free to contact me via support chat or contant me via
                        email
                        <a 
                            class="faq-list__link"
                            href="mailto:vovochkastelmashchuk@gmail.com"
                            target="_blank"
                        >
                            vovochkastelmashchuk@gmail.com</a>
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
