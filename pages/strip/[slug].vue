<template>
    <div class="content">
        <MainTitle :label="`Files: ${filesCount}`" class="content__title" />
        <div class="content__files files">
            <DxfUpload @files="addFiles" />
            <StripFile
                v-for="(file, fileIndex) in projectFiles"
                :key="file.slug"
                :file="file"
                :fileIndex="fileIndex"
                @openModal="openModal(file)"
                class="files__item"
            />
        </div>
        <StripSettings class="content__settings" />
        <MainButton :theme="themeType.primary" :label="btnLabel" :isDisable="btnIsDisable" @click="startNest"
            class="content__btn" />
        <FreeNestBanner />
        <div v-if="nestRequestError" class="content__error">
            {{ nestRequestError }}
        </div>
        <div v-if="!isNewParams && !nestRequestError && !isNesting" class="content__text">
            Change settings or files to generate again
        </div>
        <StripFileModal v-model:isModalOpen="fileDialog" />
    </div>
</template>

<script setup>
import { themeType } from "~~/constants/theme.constants";

definePageMeta({
    layout: "strip",
    middleware: ["auth", "strip"],
});

const headers = useRequestHeaders(['cookie']);

const { getters, actions } = stripStore;
const { setProjectFiles, setProjectName, setModalFileData, nest } = actions;

const route = useRoute();
const slug = route.params.slug;
const apiPath = API_ROUTES.STRIP_PROJECT(slug);

// Only reuse the cached store state when it actually belongs to this project.
// Otherwise (e.g. right after creating a new project, or switching projects)
// the store still holds the previously opened project's files.
const hasCachedProject = getters.projectFiles !== null && getters.projectSlug === slug;
const data = hasCachedProject ? null : await $fetch(apiPath, { headers });

const projectFiles = computed(() => {
    if (getters.projectFiles !== null && getters.projectSlug === slug) {
        return getters.projectFiles
    }
    return (data?.files || []).map(file => ({ ...file, count: 1 }))
})
const filesCount = computed(() => getters.filesCount)
const nestRequestError = computed(() => getters.nestRequestError)
const isNewParams = computed(() => getters.isNewParams)
const isNesting = computed(() => getters.isNesting)

const btnLabel = computed(() => `Nest ${unref(filesCount)} files`)
const btnIsDisable = computed(() =>
    Boolean(unref(nestRequestError)) || !unref(isNewParams) || unref(isNesting)
)

const fileDialog = useStripFileDialog();
const openModal = (file) => {
    setModalFileData(file)
    fileDialog.value = true
}

const addFiles = (files) => {
    actions.addFiles(files, slug)
}

const startNest = async () => {
    if (btnIsDisable.value) return;
    try {
        await nest(slug);
    } catch (error) {
        console.error("Strip nesting request failed:", error);
    }
}

onMounted(() => {
    if (!hasCachedProject) {
        setProjectFiles(data.files, data.slug)
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

    &__settings {
        margin-top: 40px;
    }

    &__btn {
        margin-top: 40px;
        margin-right: auto;
        margin-left: auto;
    }

    &__error {
        margin-top: 16px;
        padding: 12px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        color: var(--label-secondary);
        border-radius: 8px;
    }

    &__text {
        color: var(--label-secondary);
        margin-top: 16px;
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
