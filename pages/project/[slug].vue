<template>
    <div class="content">
        <MainTitle :label="`Files: ${filesCount}`" class="content__title" />
        <ProjectFiles :projectFiles="projectFiles" @addFiles="addFiles" class="content__files" />
        <MainSettings />
        <MainButton :theme="themeType.primary" :label="btnLabel" :isDisable="btnIsDisable" @click="startsNest"
            class="content__btn" />
        <div v-if="nestRequestError" class="content__error">
            {{ nestRequestError }}
        </div>
        <div v-if="!sizesIsAvailable && !nestRequestError" class="content__error">
            The plate size needs to be at least {{ biggestPartSizes.width }} x {{ biggestPartSizes.height }} mm. The
            current plate size is {{ params.widthPlate }} x {{ params.heightPlate }} mm, which is too small
        </div>
        <div v-if="!isNewParams" class="content__text">
            Change settings or files to generate again
        </div>
    </div>
    <InfoAboutNestModal v-model:isModalOpen="infoAboutNestDialog" />
</template>

<script setup async>
import { themeType } from "~~/constants/theme.constants";
const infoAboutNestDialog = useInfoAboutNest();

definePageMeta({
    layout: "auth",
    middleware: "auth",
});

const headers = useRequestHeaders(['cookie']);

const { getters } = globalStore;
const resultsList = computed(() => getters.resultsList);
const { getters: filesGetters, actions } = filesStore;
const params = computed(() => filesGetters.params);
const { setProjectFiles, setProjectName, nest } = actions;
const filesCount = computed(() => filesGetters.filesCount);
const isNewParams = computed(() => filesGetters.isNewParams);
const nestRequestError = computed(() => filesGetters.nestRequestError);
const route = useRoute();
const slug = route.params.slug;
const apiPath = API_ROUTES.PROJECT(slug);
const data = filesGetters.projectFiles || await $fetch(apiPath, { headers });


const projectFiles = computed(() => {
    return filesGetters.projectFiles || data.files.map(file => ({ ...file, count: 1 }))
})
const biggestPartSizes = computed(() => {
    const parts = projectFiles.value
        .reduce((acc, file) => [...acc, ...file.parts], [])
        .map(part => ({
            width: part.width > part.height ? part.width : part.height,
            height: part.width > part.height ? part.height : part.width
        }))

    return {
        width: Math.max(...parts.map(part => part.width), 0),
        height: Math.max(...parts.map(part => part.height), 0)
    }
})
const currentSizes = computed(() => {
    const { widthPlate, heightPlate } = unref(params);
    return {
        width: widthPlate > heightPlate ? widthPlate : heightPlate,
        height: widthPlate > heightPlate ? heightPlate : widthPlate
    };
})
const sizesIsAvailable = computed(() => {
    const { width, height } = unref(currentSizes);
    const { width: partWidth, height: partHeight } = unref(biggestPartSizes);
    return width >= partWidth && height >= partHeight;
})
onMounted(() => {
    if (!filesGetters.projectFiles) {
        setProjectFiles(data.files, apiPath)
        setProjectName(data.name)
    }

    trackEvent("page_view", {
        page: "project",
        projectSlug: slug,
    });
})
const btnLabel = computed(() => {
    return `Nest ${unref(filesCount)} files`
})
const btnIsDisable = computed(() => {
    return Boolean(unref(nestRequestError)) || !unref(isNewParams) || !unref(resultsList) || !unref(sizesIsAvailable)
})
const addFiles = (files) => {
    actions.addFiles(files, slug)
}

const startsNest = () => {
    if (btnIsDisable.value) return;
    nest(slug);
}
</script>

<style lang="scss" scoped>
.wrapper {
    &>*:not(:last-child) {
        margin-bottom: 40px;
    }
}

.content {
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }

    &__files {
        margin-bottom: 40px;
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

    &__btn {
        margin-top: 40px;
        margin-right: auto;
        margin-left: auto;
    }
}
</style>
