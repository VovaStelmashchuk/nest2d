<template>
    <div class="content">
        <MainTitle :label="`Files: ${projectFiles.length}`" class="content__title" />
        <div class="content__files files">
            <DxfUpload @files="addFiles" />
            <StripFile
                v-for="file in projectFiles"
                :key="file.slug"
                :file="file"
                @openModal="openModal(file)"
                class="files__item"
            />
        </div>
        <StripFileModal v-model:isModalOpen="fileDialog" />
    </div>
</template>

<script setup>
definePageMeta({
    layout: "strip",
    middleware: ["auth", "strip"],
});

const headers = useRequestHeaders(['cookie']);

const { getters, actions } = stripStore;
const { setProjectFiles, setProjectName, setModalFileData } = actions;

const route = useRoute();
const slug = route.params.slug;
const apiPath = API_ROUTES.STRIP_PROJECT(slug);
const data = getters.projectFiles || await $fetch(apiPath, { headers });

const projectFiles = computed(() => {
    return getters.projectFiles || data.files
})

const fileDialog = useStripFileDialog();
const openModal = (file) => {
    setModalFileData(file)
    fileDialog.value = true
}

const addFiles = (files) => {
    actions.addFiles(files, slug)
}

onMounted(() => {
    if (!getters.projectFiles) {
        setProjectFiles(data.files)
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
</style>
