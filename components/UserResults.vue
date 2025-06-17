<template>
    <MainAside label="Results">
        <div 
            v-if="getters.resultsList.length"    
            class="results"
        >
            <UserResultItem 
                v-for="result in getters.resultsList"
                :key="result.id"
                :result="result"
                @openModal="openModal(result)"
                class="results__item"
            />
        </div>
        <p v-else class="results__text">
            Your nested results will be here
        </p>
        <ResultModal v-model:isModalOpen="resultDialog" />
    </MainAside>
</template>

<script setup>
const route = useRoute();
const resultDialog = useResultDialog();
const { getters, actions } = globalStore;
const { setResults, setModalResultData } = actions;
const eventSource = ref(null)

const slug = computed(() => route.params.slug);

onMounted(() => {
    updateResults()
})
const updateResults = () => {
    setResults([])

    if (unref(eventSource)) {
        unref(eventSource).close()
    }

    eventSource.value = new EventSource(API_ROUTES.RESULTS(unref(slug)))

    unref(eventSource).onmessage = (event) => {
        try {
            const parsed = JSON.parse(event.data)
            if (parsed.type === 'initial' || parsed.type === 'update') {
                setResults(parsed.data.items) 
            }
        } catch (e) {
            console.error('Error parsing SSE message:', e)
        }
    }
    unref(eventSource).onerror = (err) => {
        console.error('SSE connection error:', err)
    }
}


const openModal = (result) => {
    setModalResultData(result)
    resultDialog.value = true
}

onBeforeUnmount(() => {
    if (unref(eventSource)) {
        unref(eventSource).close()
    }
})

watch(
    () => route.path,
    () => updateResults(),
);

</script>
<style lang="scss" scoped>
.results {
    &__text {
        color: var(--label-tertiary);
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }
}
</style>