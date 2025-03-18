import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    resultsList: [],
    projectsList: null,
    resultModalData: {},
    fileModalData: {}
})

let resulTimer;

const API_ROUTES = {
    PROJECTS: "/api/project/me",
    RESULT: (slug) => `/api/queue/${slug}`,
};

async function getResults(path) {
    try {
        const data = await $fetch(path);
        setResults(data.items, path)
    } catch (error) {
        console.error("Error fetching result:", error);
    }
}
function setResults(results, path) {
    state.resultsList = [...results]

    if (resulTimer) {
        clearTimeout(resulTimer);
    }

    if(globalStore.getters.isNesting) {
        resulTimer = setTimeout(() => getResults(path), 5000)
    }
}

async function getProjects() {
    try {
        const data = await $fetch(API_ROUTES.PROJECTS);
        setProjects(data.projects)
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}
function setProjects(projects) {
    state.projectsList = [...projects]
}

function setModalResultData(result) {
    state.resultModalData = {...result}
}
function setModalFileData(file) {
    state.fileModalData = {...file}
}

export const globalStore = readonly({
    getters: {
        resultsList: computed(() => state.resultsList),
        isNesting: computed(() => state.resultsList.some(item => [statusType.unfinished, statusType.pending].includes(item.status))),
        projectsList: computed(() => state.projectsList),
        resultModalData: computed(() => state.resultModalData),
        fileModalData: computed(() => state.fileModalData),
    },
    actions: {
        getResults,
        getProjects,
        setProjects,
        setModalFileData,
        setModalResultData
    }
})