<template>
    <div class="profile">
        <MainTitle 
            :label="data.name"
            class="profile__title"
        />
        <div class="profile__content">
            <Avatar/>
            <MainButton 
                label="Logout"
                :theme="themeType.primary"
                @click="logoutHandler"
                class="profile__btn"
            />
        </div>
    </div>
</template>

<script setup>
import { themeType } from '~~/constants/theme.constants';

const { data } = await useFetch("/api/user", {
  credentials: "include",
});

const { logout } = useAuth();

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