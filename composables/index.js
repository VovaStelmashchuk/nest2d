import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    resultsList: [],
    projectsList: [],
    resultModalData: {},
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

async function setProjects() {
    try {
        const data = await $fetch(API_ROUTES.PROJECTS);
        state.projectsList = [...data.projects]

    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

async function openResultModal(result) {
    state.resultModalData = {...result}
}

export const globalStore = readonly({
    getters: {
        resultsList: computed(() => state.resultsList),
        isNesting: computed(() => state.resultsList.findIndex(item => [statusType.unfinished, statusType.pending].includes(item.status)) !== -1),
        projectsList: computed(() => state.projectsList),
        resultModalData: computed(() => state.resultModalData)
    },
    actions: {
        setResult,
        setProjects,
        openResultModal
    }
})