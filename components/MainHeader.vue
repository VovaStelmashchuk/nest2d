<template>
    <header class="header">
        <component :is="logoTag" v-bind="logoHref" class="header__logo logo">
            <span class="logo__label">
                Nest2D
            </span>
        </component>
        <nav v-if="isSecondaryTheme" :class="navClasses" class="header__nav nav">
            <ul class="nav__list">
                <li v-for="(navItem, navIndex) in nav" :key="navIndex" @click="toggleMenu" class="nav__item">
                    <NuxtLink :to="navItem.href" class="nav__link">
                        {{ navItem.label }}
                    </NuxtLink>
                </li>
            </ul>
            <div @click="toggleMenu" class="nav__background" />
        </nav>
        <div :class="{ 'header__wrapper--is-primary': isPrimaryTheme }" class="header__wrapper">
            <div class="header__theme">
                <MainButton :theme="themeType.primary" :icon="themeIcon" :isLabelShow=false @click="updateTheme"
                    label="toogle theme" />
            </div>
            <MainButton href="https://github.com/VovaStelmashchuk/nest2d/issues/new" target="_blank"
                label="Report a problem" tag="a" class="header__btn" v-if="isSecondaryTheme" />
            <UserBalance class="header__btn" v-if="isPrimaryTheme" />
            <MainButton v-if="isSecondaryTheme" :theme="themeType.primary" @click="onLoginClick" label="Login / Sign Up"
                class="header__btn header__btn--login" />
            <Avatar v-if="isPrimaryTheme" :size="sizeType.s" class="header__avatar" />
            <div v-if="isSecondaryTheme" class="header__toggler">
                <MainButton :theme="themeType.secondary" :icon="iconType.menu" :isLabelShow=false @click="toggleMenu"
                    label="menu toggler" />
            </div>
        </div>
    </header>
</template>
<script setup>
import { NuxtLink } from '#components';
import { defaultThemeType, themeType } from "~~/constants/theme.constants";
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';

const response = await $fetch(API_ROUTES.AUTH('google'), {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
});

async function onLoginClick() {
    trackEvent('click_login', { page: 'main_header' })
    navigateTo(response.url, { external: true });
}

const { theme } = defineProps({
    theme: {
        type: String,
        default: defaultThemeType,
    },
})

const route = useRoute()

const menuIsOpen = ref(false);
const nav = [
    {
        label: 'Features',
        href: '#features',
    },
    {
        label: 'How It Works',
        href: '#how-it-works',
    },
    {
        label: 'FAQ',
        href: '#faq',
    },
    {
        label: 'Blog',
        href: '/blog',
    },
]

const isPrimaryTheme = computed(() => {
    return unref(theme) === themeType.primary
})
const isSecondaryTheme = computed(() => {
    return unref(theme) === themeType.secondary
})
const isHomePage = computed(() => {
    return route.path === '/home' || route.path === '/'
})
const logoTag = computed(() => {
    return unref(isHomePage) ? 'div' : NuxtLink
})
const logoHref = computed(() => {
    const hrefValue = unref(isPrimaryTheme) ? '/home' : '/'

    return !unref(isHomePage) ? { to: hrefValue } : {}
})
const navClasses = computed(() => ({
    'nav--is-open': unref(menuIsOpen),
    'header__nav--is-open': unref(menuIsOpen)
}))
const toggleMenu = () => {
    menuIsOpen.value = !unref(menuIsOpen)
}

const { actions } = themeStore;
const { updateTheme } = actions;

const themeCookie = useCookie('theme');
const themeGlobal = computed(() => {
    return themeCookie.value || defaultThemeType
})
const themeIcon = computed(() => {
    return unref(themeGlobal) === themeType.primary ? iconType.light : iconType.dark
})

</script>
<style lang="scss" scoped>
.header {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 12px 8px;
    flex-direction: column;

    @media (min-width: 567px) {
        flex-direction: row;
        align-items: center;
        padding: 16px 10px;
    }

    &__wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        align-items: center;

        &>*:not(:first-child) {
            margin: 4px;

            @media (min-width: 567px) {
                margin: 0 0 0 16px;
            }
        }

        @media (min-width: 567px) {
            flex-direction: initial;
            margin-top: initial;
        }

        &--is-primary {
            flex-direction: row-reverse;
            justify-content: space-between;

            @media (min-width: 567px) {
                flex-direction: initial
            }
        }
    }

    &__theme {
        @media (min-width: 567px) {
            margin-bottom: initial;
        }
    }

    &__avatar {
        position: absolute;
        top: 8px;
        right: 4px;

        @media (min-width: 567px) {
            position: initial;
            top: initial;
            right: initial;
        }
    }

    &__nav {
        z-index: 1;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        transform: translate3d(120%, 0, 0);
        transition: transform 0.3s;

        @media (min-width: 1199px) {
            position: initial;
            top: initial;
            left: initial;
            right: initial;
            bottom: initial;
            transform: initial;
        }

        &--is-open {
            transform: translate3d(0, 0, 0);

            @media (min-width: 1199px) {
                transform: initial;
            }
        }
    }

    &__toggler {
        @media (min-width: 1199px) {
            display: none;
        }
    }

    &__btn {
        &--login {
            position: absolute;
            top: 8px;
            right: 4px;

            @media (min-width: 567px) {
                position: initial;
                top: initial;
                right: initial;
            }
        }
    }
}

.logo {
    &__label {
        display: block;
        font-size: 28px;
        font-weight: 900;
        color: var(--accent-primary);
    }
}

.nav {
    padding-top: 80px;

    @media (min-width: 1199px) {
        padding-top: initial;
    }

    &__list {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        @media (min-width: 1199px) {
            position: initial;
            z-index: initial;
            justify-content: initial;
            flex-direction: initial;
        }
    }

    &__item {
        width: 100%;

        @media (min-width: 1199px) {
            margin-left: 5px;
            margin-right: 5px;
            width: initial;
        }

        &:not(:last-child) {
            margin-bottom: 20px;

            @media (min-width: 1199px) {
                margin-bottom: initial;
            }
        }
    }

    &__link {
        text-align: center;
        border-radius: 6px;
        padding: 6px 12px;
        display: block;
        font-size: 20px;
        color: var(--main-white);
        transition: color 0.3s, background-color 0.3s;

        @media (min-width: 1199px) {
            font-size: 12px;
            color: var(--label-secondary);
            background-color: var(--fill-tertiary);
        }

        @media (hover:hover) {
            &:hover {
                color: var(--accent-primary);
                background-color: var(--fill-secondary);
            }
        }
    }

    &__background {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: var(--menu-background);

        @media (min-width: 1199px) {
            display: none;
        }
    }
}
</style>