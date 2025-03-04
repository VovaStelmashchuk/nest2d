import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    queueList: [],
    projectsList: [],
    queueModalData: {},
})
let queueTimer;

async function setQueue(path) {
    try {
        const data = await $fetch(path);
        state.queueList = [...data.items]
        if(globalStore.getters.isNesting) {
            queueTimer = setTimeout(() => setQueue(path), 5000)
        }

    } catch (error) {
        console.error("Error fetching queue:", error);
    }
}

async function setProjects() {
    try {
        const data = await $fetch('/api/project/me');
        state.projectsList = [...data.projects]

    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

async function openQueueModal(slug) {
    try {
        const data = await $fetch(`/api/queue/${slug}`);
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
    mutations: {
        setQueue,
        setProjects,
        openQueueModal
    }
})