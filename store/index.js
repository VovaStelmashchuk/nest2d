import { computed, reactive, readonly } from "vue";
import { statusType } from "~~/constants/status.constants";

const state = reactive({
    queueList: [],
})
let queueTimer;

async function setQueue(path) {
    try {
        const data = await $fetch(path);
        state.queueList = [...data.items]
        // data.items[0].status = 'in-progress'
        // const unfinishedItemIndex = state.queueList.findIndex(item => [statusType.unfinished, statusType.pending].includes(item.status))
        clearInterval(queueTimer)
        if(globalStore.getters.isNesting) {
            queueTimer = setTimeout(() => setQueue(path), 5000)
        }

    } catch (error) {
        console.error("Error fetching queue:", error);
    }
}

export const globalStore = readonly({
    getters: {
        queueList: computed(() => state.queueList),
        isNesting: computed(() => state.queueList.findIndex(item => [statusType.unfinished, statusType.pending].includes(item.status)) !== -1)
    },
    mutations: {
        setQueue
    }
})