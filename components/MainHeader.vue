<template>
    <header class="header">
        <NuxtLink to="/home" class="header__logo logo">
           <span class="logo__label">
                Nest2D
           </span> 
        </NuxtLink>
        <div class="header__wrapper">
            <MainButton 
                href="https://github.com/VovaStelmashchuk/nest2d/issues/new"
                target="_blank"
                label="Report a problem"
                tag="a"
                class="header__btn"
            />
            <Avatar 
                :size="sizeType.s"
                class="header__avatar"
            />
        </div>
    </header>
</template>
<script setup>
import { sizeType } from "~~/constants/size.constants";
</script>
<style lang="scss" scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    padding-bottom: 16px;

    &__wrapper {
        display: flex;
        align-items: center;

        &>*:not(:last-child) {
            margin-right: 16px;
        }
    }
}
.logo {
    &__label {
        display: block;
        line-height: 1.2;
        font-family: $sf_mono;
        font-size: 28px;
        font-weight: 900;
        color: #000;
    }
}
</style>