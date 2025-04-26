<template>
    <div class="main mx-auto rounded-lg min-h-screen">
        <section>
            <h2>
                Nesting For plotters, laser & plasma cutters, and other CNC
                machines
            </h2>
            <p class="mt-4">
                Upload your DXF files, input material dimensions, and let Nest2d
                reduce material waste.
            </p>
            <div class="mt-8">
                <MainButton
                    :theme="themeType.primary"
                    label="Get Started for Free"
                    @click="loginDialog = true"
                    class="mx-auto"
                />
            </div>
        </section>
        <section id="features">
            <h3>Features</h3>
            <div
                class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <div class="main__card">
                    <h4>DXF File Support</h4>
                    <p class="mt-4">
                        Easily upload DXF files for precision laser cutting.
                    </p>
                </div>
                <div class="main__card">
                    <h4>Save money</h4>
                    <p class="mt-4">
                        Minimize waste by optimizing part arrangement.
                    </p>
                </div>
                <div class="main__card">
                    <h4>No client resource require</h4>
                    <p class="mt-4">All calculation done by server.</p>
                </div>
                <div class="main__card">
                    <h4>Open Source</h4>
                    <p class="mt-4">
                        Fully open-source and built for efficiency.
                    </p>
                </div>
            </div>
        </section>
        <section id="screenshots">
            <h3>Intuitive design</h3>
            <div
                class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <img
                    src="/screenshots/project-ui.png"
                    alt="project ui"
                    class="w-full h-auto"
                />
                <img
                    src="/screenshots/nest-result.png"
                    alt="project ui"
                    class="w-full h-auto"
                />
                <img
                    src="/screenshots/preview.png"
                    alt="project ui"
                    class="w-full h-auto"
                />
            </div>
        </section>
        <section id="how-it-works">
            <h3>How It Works</h3>
            <div class="main__how-it-works mt-8">
                <div class="flex-1">
                    <h4 class="size-16 flex items-center justify-center">1</h4>
                    <h5 class="mt-4">Upload DXF Files</h5>
                    <p class="mt-2">
                        Drag and drop or browse your files to upload.
                    </p>
                </div>
                <div class="flex-1">
                    <h4 class="size-16 flex items-center justify-center">2</h4>
                    <h5 class="mt-4">Enter Material Size</h5>
                    <p class="mt-2">
                        Specify the dimensions of your material sheet.
                    </p>
                </div>
                <div class="flex-1">
                    <h4 class="size-16 flex items-center justify-center">3</h4>
                    <h5 class="mt-4">Optimize and Download</h5>
                    <p class="mt-2">
                        Get an optimized layout ready for cutting.
                    </p>
                </div>
            </div>
        </section>
        <section id="get-started">
            <h3>Get Started Today</h3>
            <p>
                Sign up and start optimizing your laser cutting projects in
                minutes.
            </p>
            <div class="mt-8">
                <MainButton
                    :theme="themeType.primary"
                    label="Login / Sign Up"
                    @click="loginDialog = true"
                    class="mx-auto"
                />
            </div>
        </section>
        <section id="faq">
            <h3>Frequently Asked Questions</h3>
            <p>
                Stuck on something? We’re here to help with all your questions
                and answers in one place.
            </p>
            <div class="mt-8 main__faq">
                <h4>Is Nest2d has a free trial?</h4>
                <p>
                    Yes, you can try us for free until your read a limit of free
                    credding. If you want, login and send a message to me via
                    support chat.
                </p>
                <h4>What is your cancellation policy?</h4>
                <p>
                    I understand that things change. You can cancel your payment
                    any time, i will provide a full refound.
                </p>
                <h4>Is it a one-time payment?</h4>
                <p>
                    Just a one-time payment! No recurring charges or surprises,
                    we promise. We’re just as sick of recurring charges as you
                    are.
                </p>
                <h4>What file formats do you support?</h4>

                <p>Currently, we support DXF files for laser cutting.</p>
                <h4>Can I contribute to the project?</h4>

                <p class="mt-2 text-gray-600">
                    Absolutely! Check out our
                    <a
                        href="https://github.com/VovaStelmashchuk/nest2D"
                        target="_blank"
                        >GitHub repository</a
                    >
                    to contribute.
                </p>

                <h4>I still have questions.</h4>
                <p>
                    Fill free to contact me via support chat or contant me via
                    email
                    <a href="mailto:vovochkastelmashchuk@gmail.com"
                        >vovochkastelmashchuk@gmail.com</a
                    >
                </p>
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

    h2 {
        font-weight: 700;
        font-size: 2.25rem;
        text-align: center;
        color: var(--accent-primary);
    }

    h3 {
        font-weight: 700;
        font-size: 2rem;
        text-align: center;
        color: var(--accent-primary);
    }

    h4 {
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--accent-primary);
    }

    h5 {
        font-weight: 700;
        font-size: 1.25rem;
        text-align: center;
        color: var(--accent-primary);
    }

    p {
        font-size: 1.125rem;
        text-align: center;
        color: var(--label-secondary);
    }

    section {
        padding: 1rem;
        margin: 1rem;
    }

    &__card {
        border-width: 1px;
        border-color: var(--separator-secondary);
        padding: 1.5rem;
        border-radius: 1rem;

        h4 {
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--accent-primary);
        }
        p {
            text-align: left;
            color: var(--label-secondary);
        }
    }

    &__how-it-works {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 2rem;

        @media (min-width: 700px) {
            flex-direction: row;
            justify-content: space-between;
        }

        h4 {
            font-size: 1.5rem;
            text-align: center;
            border-width: 1px;
            border-color: var(--separator-secondary);
            border-radius: 9999px;
            font-weight: 700;
            color: var(--accent-primary);
            margin-left: auto;
            margin-right: auto;
        }
    }

    &__faq {
        h4 {
            margin-top: 1rem;
        }

        p {
            text-align: left;
        }

        a {
            color: var(--accent-primary);
            text-decoration: underline;
        }
    }
}
</style>
