import { computed, reactive, readonly } from "vue";
import { processingType } from "~~/constants/files.constants";

const { actions } = globalStore;
const { getResults, getProjects } = actions;

const state = reactive({
    projectFiles: null,
    projectName: '',
    lastParams: '',
    params: {
        widthPlate: '400',
        heightPlate: '560',
        tolerance: '0.1',
        space: '0.1'
    }
})

let updateTimer;

const API_ROUTES = {
    // PROJECTS: "/api/project/me",
    // RESULT: (slug) => `/api/queue/${slug}`,
};
async function getProject(path) {
    try {
        const data = await $fetch(path);
        setProjectFiles(data.files, path)
        setProjectName(data.name)
    } catch (error) {
        console.error("Error fetching project:", error);
    }
}
function setProjectName(name) {
    state.projectName = name
}
function setProjectFiles(files, path) {
    state.projectFiles = [...files.map((file, fileIndex) => ({
        ...file, 
        count: filesSlore.getters.currentFilesSlug.has(file.slug) ? state.projectFiles[fileIndex].count : 1
    }))]
    if (updateTimer) {
        clearTimeout(updateTimer);
    }
    if(!filesSlore.getters.isSvgLoaded) {
        updateTimer = setTimeout(() => getProject(path), 5000)
    }
}
async function addFiles(files, slug) {
    const formData = new FormData();
    formData.append("projectName", state.projectName);
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

        getProject(`/api/project/${slug}`)
    } catch (error) {
        console.error("Error while uploading files:", error);
    }
}
function isValidNumber(value) {
    return /^\d+(\.\d+)?$/.test(value);
}
function updateParams(param) {
    state.params = { ...state.params, ...param }
}
function increment(index) {
    state.projectFiles[index].count++
}
function decrement(index) {
    if(state.projectFiles[index].count > 0) {
        state.projectFiles[index].count--
    }
}
async function nest(slug, path) {
    await fetch(`/api/project/${slug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: filesSlore.getters.requestBody,
    });
    await getResults(path)
    await getProjects()
    state.lastParams = filesSlore.getters.requestBody
}

export const filesSlore = readonly({
    getters: {
        projectFiles: computed(() => state.projectFiles),
        isSvgLoaded: computed(() => state.projectFiles?.every(file => file.processingStatus !== processingType.inProgress) || false),
        filesStatusDone: computed(() => state.projectFiles?.filter(file => file.processingStatus === processingType.done) || []),
        filesCount: computed(() => filesSlore.getters.filesStatusDone.reduce((acc, curr) => acc + curr.count, 0)),
        filesToNest: computed(() => filesSlore.getters.filesStatusDone.map(file => ({ slug: file.slug, count: file.count }))),
        isValidParams: computed(() => Object.values(state.params).some(param => !isValidNumber(param))),
        params: computed(() => state.params),
        requestBody: computed(() => JSON.stringify({
            files: filesSlore.getters.filesToNest,
            params: {
                width: Number(state.params.widthPlate),
                height: Number(state.params.heightPlate),
                tolerance: Number(state.params.tolerance),
                space: Number(state.params.space)
            },
        })),
        currentFilesSlug: computed(() => new Set(state.projectFiles?.map(file => file.slug) || [])),
        lastParams: computed(() => state.lastParams),
        isNewParams: computed(() => filesSlore.getters.requestBody !== state.lastParams),
        nestRequestError: computed(() => {
            if(filesSlore.getters.filesCount < 1) {
                return 'Please select at least one file to nest.'
            }
            if(filesSlore.getters.isValidParams) {
                return 'Please enter valid values for width, height, tolerance and space.'
            }
        
            return ''
        })
    },
    actions: {
        setProjectFiles,
        setProjectName,
        updateParams,
        getProject,
        increment,
        decrement,
        addFiles,
        nest
    }
})