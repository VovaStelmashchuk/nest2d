<template>
    <div class="home">
        <MainTitle label="Upload your .DXF files" class="home__title" />
        <DxfUpload @files="handleSubmit" />
        <p class="home__text">
            All files will be save secure and available only for you
        </p>
        <div v-if="error" class="home__error">
            {{ error }}
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: "auth",
    middleware: "auth",
});

const router = useRouter();

onMounted(async () => {
    const checkoutInternalId = useRoute().query.checkoutInternalId
    if (checkoutInternalId) {
        const { status } = await $fetch('/api/payment/check?checkoutInternalId=' + checkoutInternalId, {
            method: "POST",
        });
        console.log(status)
    }
})

const { actions } = globalStore;
const { actions: filesActions } = filesStore;
const { getProjects } = actions;
const { getProject } = filesActions;

const error = ref('')

const handleSubmit = async (files) => {
    error.value = "";

    const formData = new FormData();
    files.forEach((file) => formData.append("dxf", file));

    try {
        const data = await $fetch(API_ROUTES.PROJECT(), {
            method: "POST",
            body: formData,
        });

        await Promise.all([
            getProjects(),
            getProject(API_ROUTES.PROJECT(data.slug))
        ]);

        router.push({ path: `/project/${data.slug}` });
    } catch (err) {
        if (err.response) {
            const errorData = await err.response.json();
            error.value = errorData.message;
        } else {
            error.value = "An unexpected error occurred.";
        }
    }
}
</script>

<style lang="scss" scoped>
.home {
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }

    &__text {
        margin-top: 16px;
        color: var(--label-tertiary);
    }

    &__error {
        margin-top: 16px;
        padding: 12px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        border-radius: 8px;
    }
}
</style>