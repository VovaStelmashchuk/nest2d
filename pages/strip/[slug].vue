<template>
    <div class="content">
        <MainTitle :label="`Files: ${projectFiles.length}`" class="content__title" />
        <div class="content__files files">
            <DxfUpload @files="addFiles" />
            <template v-for="file in projectFiles" :key="file.slug">
                <FileInProgress
                    v-if="fileIsProcessing(file.processingStatus)"
                    :file="file"
                    class="files__item"
                />
                <FileError
                    v-else-if="fileIsError(file.processingStatus)"
                    :file="file"
                    class="files__item"
                />
                <div v-else class="files__item file">
                    <p class="file__name">{{ file.name }}</p>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { processingType } from "~~/constants/files.constants";

definePageMeta({
    layout: "strip",
    middleware: "auth",
});

const headers = useRequestHeaders(['cookie']);

const { getters, actions } = stripStore;
const { setProjectFiles, setProjectName } = actions;

const route = useRoute();
const slug = route.params.slug;
const apiPath = API_ROUTES.STRIP_PROJECT(slug);
const data = getters.projectFiles || await $fetch(apiPath, { headers });

const projectFiles = computed(() => {
    return getters.projectFiles || data.files
})

const fileIsProcessing = (status) => status === processingType.inProgress
const fileIsError = (status) => status === processingType.error

const addFiles = (files) => {
    actions.addFiles(files, slug)
}

onMounted(() => {
    if (!getters.projectFiles) {
        setProjectFiles(data.files, apiPath)
        setProjectName(data.name)
    }

    trackEvent("page_view", {
        page: "strip_project",
        stripSlug: slug,
    });
})
</script>

<style lang="scss" scoped>
.content {
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }
}

.files {
    display: grid;
    grid-template-columns: repeat(2, calc(100% / 2 - 4px));
    gap: 4px;

    @media (min-width: 567px) {
        grid-template-columns: repeat(3, calc(100% / 3 - 8px));
        gap: 8px;
    }
}

.file {
    position: relative;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--separator-secondary);

    &__name {
        margin-top: 16px;
        margin-bottom: 16px;
        color: var(--label-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
