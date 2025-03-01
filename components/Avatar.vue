<template>
    <component
        :is="avatarTag"
        class="avatar"
        v-bind="avatarHref"
    >
        <img 
            :class="avatarClasses"
            :src="data.avatar"
            :alt="data.name"
            class="avatar__img"
        />
    </component>
</template>
<script setup>
import { NuxtLink } from '#components';
import { computed, unref } from 'vue';
import { defaultSizeType } from "~~/constants/size.constants";
const { size } = defineProps({
    size: {
        type: String,
        default: defaultSizeType,
    },
}) 

const route = useRoute()

const avatarClasses = computed(() => ({
    [`avatar__img--size-${unref(size)}`]: Boolean(unref(size))
}))
const isProfilePage = computed(() => {
    return route.path === '/profile'
})
const avatarTag = computed(() => {
    return unref(isProfilePage) ? 'div' : NuxtLink
})
const avatarHref = computed(() => {
    return !unref(isProfilePage) ? { to: '/profile' } : {}
})

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