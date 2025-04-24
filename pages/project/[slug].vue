<template>
    <div class="content">
        <MainTitle 
            :label="`Files: ${filesCount}`"
            class="content__title" 
        />
        <ProjectFiles 
            :projectFiles="projectFiles"
            @addFiles="addFiles"
            class="content__files" 
        />
        <MainSettings />
        <MainButton 
            :theme="themeType.primary"
            :label="btnLabel"
            :isDisable="btnIsDisable"
            @click="nest(slug)"
            class="content__btn" 
        />
        <div
            v-if="nestRequestError"
            class="content__error"
        >
            {{ nestRequestError }}
        </div>
        <div 
            v-if="!isNewParams"
            class="content__text"
        >
            Change settings or files to generate again
        </div>
    </div>
</template>

<script setup async>
import { themeType } from "~~/constants/theme.constants";

definePageMeta({
    layout: "auth",
    middleware: "auth",
});

const headers = useRequestHeaders(['cookie']);

const { getters } = globalStore;
const resultsList = computed(() => getters.resultsList);

const { getters:filesgetters, actions } = filesStore;

const { setProjectFiles, setProjectName, nest } = actions;

const filesCount = computed(() => filesgetters.filesCount);
const isNewParams = computed(() => filesgetters.isNewParams);
const nestRequestError = computed(() => filesgetters.nestRequestError);

const route = useRoute();
const slug = route.params.slug;
const apiPath = API_ROUTES.PROJECT(slug);

const data = filesgetters.projectFiles || await $fetch(apiPath, { headers });

const projectFiles = computed(() => {
    return filesgetters.projectFiles || data.files.map(file => ({...file, count: 1}))
})

onMounted(() => {
    if (!filesgetters.projectFiles) {
        setProjectFiles(data.files, apiPath)
        setProjectName(data.name)
    }
})

const btnLabel = computed(() => {
    return `Nest ${unref(filesCount)} files`
})
const btnIsDisable = computed(() => {
    return Boolean(unref(nestRequestError)) || !unref(isNewParams) || !unref(resultsList)
})

const addFiles = (files) => {
    actions.addFiles(files, slug)
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
