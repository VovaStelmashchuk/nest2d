<template>
    <NuxtLink class="avatar" to="/profile">
        <img class="avatar__img" :src="data.avatar" :alt="data.name"/>
    </NuxtLink>
</template>
<script setup>
const useAuthState = useAuth();
const data = await useAuthState.fetchUser();
</script>
<style lang="scss" scoped>
.avatar {
    &__img {
        width: 40px;
        height: 40px;
        border-radius: 100px;
    }
}
</style>