<template>
    <div class="profile">
        <MainTitle 
            v-if="user.name"
            :label="user.name"
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

const router = useRouter();

definePageMeta({
    layout: "profile",
    middleware: "auth",
});

const { getters, actions } = authStore;
const { logout } = actions;
const user = computed(() => getters.user);

const logoutHandler = async () => {
    await logout();
    await router.push({ path: '/' })
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
