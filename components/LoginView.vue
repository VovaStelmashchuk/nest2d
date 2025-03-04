<template>
    <DialogWrapper>
        <div class="modal">
            <MainTitle 
                label="Login to your account"
                class="modal__title"
            />
            <div class="modal__item item">
                <img
                    src="/github-logo.svg"
                    loading="lazy"
                    alt="github logo"
                    class="item__img"
                />
                <MainButton 
                    :theme="themeType.secondary"
                    @click="doAuth('github')"
                    label="Login with Github"
                />
            </div>
            <div class="modal__item item">
                <img
                    src="/google-logo.svg"
                    loading="lazy"
                    alt="google logo"
                    class="item__img"
                />
                <MainButton 
                    :theme="themeType.secondary"
                    @click="doAuth('google')"
                    label="Login with Google"
                />
            </div>
        </div>
    </DialogWrapper>
</template>

<script setup>
import { themeType } from "~~/constants/theme.constants";
import {navigateTo} from 'nuxt/app';

const doAuth = async (provider) => {
    const response = await $fetch(`/api/auth/${provider}/redirect`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    navigateTo(response.url, { external: true });
}
</script>
<style lang="scss" scoped>
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    &__item {
        margin-top: 14px;
    }
}
.item {
    display: flex;
    align-items: center;
    &__img {
        margin-right: 10px;
        width: 24px;
        height: auto;
    }
}

</style>