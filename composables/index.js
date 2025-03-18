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

async function setResult(path) {
    try {
        const data = await $fetch(path);
        state.resultsList = [...data.items]

        if (resulTimer) {
            clearTimeout(resulTimer);
        }

        if(globalStore.getters.isNesting) {
            resulTimer = setTimeout(() => setResult(path), 5000)
        }

    } catch (error) {
        console.error("Error fetching result:", error);
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

function openResultModal(result) {
    state.resultModalData = {...result}
}
function openFileModal(file) {
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
        setResult,
        getProjects,
        setProjects,
        openFileModal,
        openResultModal
    }
})