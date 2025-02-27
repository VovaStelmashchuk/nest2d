<template>
    <NuxtLink 
        class="avatar" 
        to="/profile"
    >
        <img 
            :class="avatarClasses"
            :src="data.avatar"
            :alt="data.name"
            class="avatar__img"
        />
    </NuxtLink>
</template>
<script setup>
import { defaultSizeType } from "~~/constants/size.constants";

const { size } = defineProps({
    size: {
        type: String,
        default: defaultSizeType,
    },
}) 

const avatarClasses = computed(() => ({
    [`avatar__img--size-${unref(size)}`]: Boolean(unref(size))
}))


const useAuthState = useAuth();
const data = await useAuthState.fetchUser();
</script>
<style lang="scss" scoped>
.avatar {
    &__img {
        border-radius: 100px;

        &--size-s {
            width: 40px;
            height: 40px;
        }
        &--size-m {
            width: 140px;
            height: 140px;
        }
    }
}
</style>