import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    queueList: [],
    projectsList: [],
    queueModalData: {},
})

let queueTimer;

const API_ROUTES = {
    PROJECTS: "/api/project/me",
    QUEUE: (slug) => `/api/queue/${slug}`,
};

async function setQueue(path) {
    try {
        const data = await $fetch(path);
        state.queueList = [...data.items]

        if (queueTimer) {
            clearTimeout(queueTimer);
        }

        if(globalStore.getters.isNesting) {
            queueTimer = setTimeout(() => setQueue(path), 5000)
        }

    } catch (error) {
        console.error("Error fetching queue:", error);
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

async function openQueueModal(slug) {
    try {
        const data = await $fetch(API_ROUTES.QUEUE(slug));
        state.queueModalData = {...data}

    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

export const globalStore = readonly({
    getters: {
        queueList: computed(() => state.queueList),
        isNesting: computed(() => state.queueList.findIndex(item => [statusType.unfinished, statusType.pending].includes(item.status)) !== -1),
        projectsList: computed(() => state.projectsList),
        queueModalData: computed(() => state.queueModalData)
    },
    actions: {
        setQueue,
        setProjects,
        openQueueModal
    }
})