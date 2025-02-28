<template>
    <AuthProgress />
</template>

<script setup>
definePageMeta({
    layout: "doc",
});
onMounted(async () => {
    const route = useRoute();
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

    navigateTo("/home");
});
</script>
