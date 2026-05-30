<template>
    <div class="strip">
        <MainTitle label="Upload your .DXF files for strip nesting" class="strip__title" />
        <DxfUpload @files="handleSubmit" />
        <p class="strip__text">
            All files will be save secure and available only for you
        </p>
        <div v-if="error" class="strip__error">
            {{ error }}
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: "strip",
    middleware: ["auth", "strip"],
});

const router = useRouter();

const { actions } = stripStore;
const { getStripProjects, getStripProject } = actions;

onMounted(() => {
    trackEvent('page_view', { page: 'strip' })
})

const error = ref('')

const handleSubmit = async (files) => {
    error.value = "";

    const formData = new FormData();
    files.forEach((file) => formData.append("dxf", file));

    try {
        const result = await $fetch(API_ROUTES.STRIP_PROJECT(), {
            method: "POST",
            body: formData,
        });

        // Load the newly created project into the store before navigating so
        // the project page shows its files instead of the previously opened
        // project's cached state.
        await Promise.all([
            getStripProjects(),
            getStripProject(API_ROUTES.STRIP_PROJECT(result.slug))
        ]);

        router.push({ path: `/strip/${result.slug}` });
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
.strip {
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
