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

    await $fetch("/api/auth/github/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    router.push({ path: '/home' })
});
</script>
