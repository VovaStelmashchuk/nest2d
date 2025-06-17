import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    resultsList: [],
    projectsList: null,
    resultModalData: {},
    screenshotModalData: {},
    fileModalData: {},
    nestDialogData: {},
    needNotification: false
})

function setResults(results) {
    state.resultsList = [...results]
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
    state.resultModalData = { ...result }
}
function setModalScreenshotData(result) {
    state.screenshotModalData = result
}
function setModalNestData(result) {
    state.nestDialogData = { ...result }
}
function setModalFileData(file) {
    state.fileModalData = { ...file }
}
function updateNotification(value) {
    state.needNotification = value
}
export const globalStore = readonly({
    getters: {
        resultsList: computed(() => state.resultsList),
        isNesting: computed(() => state.resultsList && state.resultsList.some(item => [statusType.unfinished, statusType.pending].includes(item.status))),
        projectsList: computed(() => state.projectsList),
        resultModalData: computed(() => state.resultModalData),
        screenshotModalData: computed(() => state.screenshotModalData),
        fileModalData: computed(() => state.fileModalData),
        nestDialogData: computed(() => state.nestDialogData),
        needNotification: computed(() => state.needNotification)
    },
    actions: {
        setResults,
        getProjects,
        setProjects,
        setModalFileData,
        setModalResultData,
        setModalScreenshotData,
        updateNotification,
        setModalNestData
    }
})