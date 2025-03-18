<template>
    <MainAside 
        label="Results"
    >
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
const apiPath = computed(() => {
    return route.name === 'project-slug' ? `/api${route.path}/queue` : '/api/queue/all';
})
const { getters, actions } = globalStore;
const { setResult, setModalResultData } = actions;
const resultsList = computed(() => getters.resultsList);

onBeforeMount(() => {
    setResult(unref(apiPath));
})
const openModal = (result) => {
    setModalResultData(result)
    resultDialog.value = true
}
watch(() => route.fullPath, () => {
    setResult(unref(apiPath));
});

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