<template>
    <div class="profile">
        <MainTitle 
            :label="data.name"
            class="profile__title"
        />
        <div class="profile__content">
            <Avatar/>
            <MainButton 
                :theme="themeType.primary"
                @click="logoutHandler"
                label="Logout"
                class="profile__btn"
            />
        </div>
    </div>
</template>
<script setup>
import { themeType } from '~~/constants/theme.constants';

definePageMeta({
    layout: "auth",
});

const { logout } = useAuth();
const { data } = await useFetch("/api/user", {
  credentials: "include",
});

const logoutHandler = async () => {
    await logout();
    navigateTo("/");
};
</script>
<style lang="scss" scoped>
.profile {
    &__title {
        margin-bottom: 16px;
    }
    &__content {
        display: flex;
        align-items: center;
    }
    &__btn {
        margin-left: 24px;
    }
}
</style>
