<template>
    <MainAside label="Results">
        <div 
            v-if="resultsList.length"    
            class="results"
        >
            <UserResultItem 
                v-for="result in resultsList"
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
const resultDialog = useResultDialog();

const route = useRoute();

const { getters, actions } = globalStore;
const { setResults, getResults, setModalResultData } = actions;
const headers = useRequestHeaders(['cookie']);
const apiPath = computed(() => {
    return route.name === 'project-slug' ? `/api${route.path}/queue` : '/api/queue/all';
})

const data = await $fetch(unref(apiPath), { headers });

const resultsList = computed(() => {
    return getters.resultsList ? getters.resultsList : data.items
});

onMounted(() => {
    if (!getters.resultsList) {
        setResults(data.items, unref(apiPath))
    }
})

watch(
    () => route.path,
    () => getResults(unref(apiPath)),
);
const openModal = (result) => {
    setModalResultData(result)
    resultDialog.value = true
}
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