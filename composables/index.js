import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    resultsList: null,
    projectsList: null,
    resultModalData: {},
    fileModalData: {}
})

let resulTimer;

async function getResults(slug) {
    try {
        const data = await $fetch(API_ROUTES.RESULTS(slug));
        setResults(data.items, slug)
    } catch (error) {
        console.error("Error fetching result:", error);
    }
}
function setResults(results, slug) {
    state.resultsList = [...results]
    if (resulTimer) {
        clearTimeout(resulTimer);
    }

    if(globalStore.getters.isNesting) {
        resulTimer = setTimeout(() => getResults(slug), 5000)
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
        isNesting: computed(() => state.resultsList && state.resultsList.some(item => [statusType.unfinished, statusType.pending].includes(item.status))),
        projectsList: computed(() => state.projectsList),
        resultModalData: computed(() => state.resultModalData),
        fileModalData: computed(() => state.fileModalData),
    },
    actions: {
        getResults,
        setResults,
        getProjects,
        setProjects,
        setModalFileData,
        setModalResultData
    }
})