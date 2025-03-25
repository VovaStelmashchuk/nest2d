<template>
    <AuthProgress />
</template>

<script setup>
definePageMeta({
    layout: "doc",
});
const router = useRouter()
const route = useRoute();

onMounted(async () => {
    const query = route.query;
    const githubCode = query.code;
    const request = {
        githubCode: githubCode,
    };

    await $fetch(API_ROUTES.LOGIN('github'), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    router.push({ path: '/home' })
});
</script>
