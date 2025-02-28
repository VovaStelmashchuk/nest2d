<template>
    <footer class="footer"> 
        <div class="footer__content content">
            <ul class="list">
                <li class="list__item">
                    <a
                        href="https://github.com/VovaStelmashchuk/nest2donline"
                        target="_blank"
                        class="list__link"
                    >
                        GitHub
                    </a>
                </li>
                <li class="list__item">
                    <NuxtLink 
                        to="/terms-and-conditions"
                        class="list__link"
                    >
                        Terms and Conditions
                    </NuxtLink>
                </li>
                <li class="list__item">
                    <NuxtLink 
                        to="/licences" 
                        class="list__link"
                    >
                        Licences
                    </NuxtLink>
                </li>
                <li class="list__item">
                    <NuxtLink 
                        to="/blog" 
                        class="list__link"
                    >
                        Blog
                    </NuxtLink>
                </li>
            </ul>
            <p class="footer__copyright">
                © 2025 Vova Stelmashchuk. All rights reserved. Built with ♥ and open source principles
            </p>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
.footer {
    padding-left: 10px;
    padding-right: 10px;
    font-family: $sf_mono;
    padding-top: 16px;
    padding-bottom: 16px;
    background-color: #000;
    &__content {
        max-width: 1300px;
        margin-right: auto;
        margin-left: auto;
    }
    &__copyright {
        text-align: center;
        margin-top: 16px;
        color: rgb(255, 255, 255, 0.7);
        display: block;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 600;

        @media (min-width: 1199px) {
            margin-top: initial;
            text-align: initial;
        }
    }
}
.content {
    @media (min-width: 1199px) {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
}
.list {
    @media (min-width: 568px) {
        display: flex;
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 10px;

            @media (min-width: 568px) {
                margin-right: 40px;
                margin-bottom: initial;
            }
        }
    }
    &__link {
        text-align: center;
        color: rgb(255, 255, 255, 0.7);
        display: block;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 600;
        transition: color 0.3s;

        @media (min-width: 568px) {
            text-align: initial;
        }

        @media (hover:hover) {
            &:hover {
                color: #fff
            }
        }
    }
}

</style>