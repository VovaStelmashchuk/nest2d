<template>
    <div class="content">
        <MainTitle 
            :label="`Files: ${filesCount}`"
            class="content__title" 
        />
        <ProjectFiles 
            :projectFiles="projectFiles"
            @addFiles="addFiles"
            @increment="increment"
            @decrement="decrement"
            class="content__files" 
        />
        <MainSettings 
            v-model:widthPlate="widthPlate" 
            v-model:heightPlate="heightPlate" 
            v-model:tolerance="tolerance" 
            v-model:space="space"
        />
        <!-- <ProjectName :projectName="data.name" :slug="data.slug" /> -->
        <MainButton 
            :theme="themeType.primary"
            :label="btnLabel"
            :isDisable="btnIsDisable"
            @click="nest"
            class="content__btn" 
        />
        <div
            v-if="nestRequestError"
            class="content__error"
        >
            {{ nestRequestError }}
        </div>
        <div 
            v-if="!isNewParams && !isNesting"
            class="content__text"
        >
            Change settings or files to generate again
        </div>
    </div>
</template>

<script setup async>
import { onBeforeMount } from "vue";
import { themeType } from "~~/constants/theme.constants";
import { processingType } from "~~/constants/files.constants";

definePageMeta({
    layout: "auth",
    middleware: "auth",
});

const { getters, actions } = globalStore;
const { setResult, getProjects } = actions;
const isNesting = computed(() => getters.isNesting);

const route = useRoute();
const slug = route.params.slug;
const resultPath = `/api${route.path}/queue`

const { data } = await useFetch(`/api/project/${slug}`);

const widthPlate = ref('400');
const heightPlate = ref('560');
const tolerance = ref('0.1');
const space = ref('0.1');

const params = computed(() => ({
    width: unref(widthPlate),
    height: unref(heightPlate),
    tolerance: unref(tolerance),
    space: unref(space)
}))

const lastParams = ref('')

const projectFiles = ref(data.value.files.map(file => ({...file, count: 1})))
const isSvgLoaded = computed(() => unref(projectFiles).every(file => file.processingStatus !== processingType.inProgress))
const filesToNest = computed(() => {
    return unref(projectFiles)
    .filter((file) => {
        return file.processingStatus === processingType.done
    })
    .map(file => (
        {
            slug: file.slug,
            count: file.count,
        }
    ))
})

const filesCount = computed(() => {
    return  unref(projectFiles)
            .filter(file => file.processingStatus === processingType.done)
            .reduce((acc, curr) => acc + curr.count, 0)
})
const isValidParams = computed(() => {
    return Object.values(unref(params)).some(param => !isValidNumber(param))
})

const nestRequestError = computed(() => {
    if(unref(filesCount) < 1) {
        return 'Please select at least one file to nest.'
    }
    if(unref(isValidParams)) {
        return 'Please enter valid values for width, height, tolerance and space.'
    }

    return ''
});
const isNewParams = computed(() => {
    return unref(requestBody) !== unref(lastParams)
})
const requestBody = computed(() => {
    return JSON.stringify({
        files: unref(filesToNest),
        params: {
            width: Number(unref(params).width),
            height: Number(unref(params).height),
            tolerance: Number(unref(params).tolerance),
            space: Number(unref(params).space)
        },
    })
})


const isValidNumber = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
}
const increment = (index) => {
    projectFiles.value[index].count++
};
const decrement = (index) => {
    if(projectFiles.value[index].count > 0) {
        projectFiles.value[index].count--
    }
};
const nest = async () => {
    await fetch(`/api/project/${slug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: unref(requestBody),
    });
    await setResult(resultPath)
    await getProjects()
    lastParams.value = unref(requestBody)
};

const currentFilesSlug = computed(() => {
    return new Set(unref(projectFiles).map(file => file.slug));
})

const btnLabel = computed(() => {
    return unref(isNesting) ? 'Nesting...' : `Nest ${unref(filesCount)} files`
})
const btnIsDisable = computed(() => {
    return unref(isNesting) || Boolean(unref(nestRequestError)) || !unref(isNewParams)
})

let updateTimer;

const updateData = async () => {
    if(!unref(isSvgLoaded)) {
        try {
            const response = await fetch(`/api/project/${slug}`);

            if (!response.ok) {
                console.error("Error while update data:", response.statusText);
                return;
            }

            if (updateTimer) {
                clearTimeout(updateTimer);
            }

            const newData = await response.json();
            projectFiles.value = newData.files.map((file, filesIndex) => ({...unref(projectFiles)[filesIndex], ...file}))

            updateTimer = setTimeout(() => updateData(), 5000)
        } catch (error) { 
            console.error("Error update data:", error);
        }
    }
}

const addFiles = async (files) => {
    const formData = new FormData();
    formData.append("projectName", unref(data).name);
    files.forEach((file) => formData.append("dxf", file));

    try {
        const response = await fetch(`/api/project/${slug}/addfiles`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            console.error("Error while uploading files:", response.statusText);
            return;
        }

        const projectResponse = await fetch(`/api/project/${slug}`);

        if (!projectResponse.ok) {
            console.error("Error while retrieving updated data:", projectResponse.statusText);
            return;
        }

        const newData = await projectResponse.json();
        const newFiles = newData.files.filter(file => {
            return !unref(currentFilesSlug).has(file.slug);
        })
        projectFiles.value = [
            ...unref(projectFiles), 
            ...newFiles.map(file => ({...file, count: 1}))
        ]
        updateData()
    } catch (error) {
        console.error("Error while uploading files:", error);
    }
}

onBeforeMount(() => {
    updateData()
})
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