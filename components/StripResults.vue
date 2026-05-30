<template>
    <MainAside @closeAside="$emit('closeAside')" label="Results">
        <div v-if="hasSlug && resultsList.length" class="results">
            <StripResultItem
                v-for="result in resultsList"
                :key="result.slug"
                :result="result"
                @openModal="openModal(result)"
                class="results__item"
            />
        </div>
        <p v-else class="results__text">
            Your nested results will be here
        </p>
        <StripResultModal v-model:isModalOpen="resultDialog" />
    </MainAside>
</template>

<script setup>
import { statusType } from '~~/constants/status.constants';

defineEmits(["closeAside"]);

const route = useRoute();
const { getters, actions } = stripStore;
const { getStripResults, setStripResults, setModalResultData } = actions;

const resultDialog = useStripResultDialog();
const openModal = (result) => {
    setModalResultData(result);
    resultDialog.value = true;
};

const resultsList = computed(() => getters.resultsList);
const slug = computed(() => route.params.slug);
const hasSlug = computed(() => Boolean(unref(slug)));

let pollTimer = null;

const hasInProgress = () =>
    unref(resultsList).some(
        (result) =>
            result.status === statusType.pending ||
            result.status === statusType.unfinished
    );

const stopPolling = () => {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
};

const startPolling = () => {
    stopPolling();
    pollTimer = setInterval(async () => {
        if (!unref(hasSlug)) return;
        await getStripResults(unref(slug));
        if (!hasInProgress()) {
            stopPolling();
        }
    }, 3000);
};

const loadResults = async () => {
    stopPolling();
    setStripResults([]);
    if (!unref(hasSlug)) return;
    await getStripResults(unref(slug));
    if (hasInProgress()) {
        startPolling();
    }
};

onMounted(loadResults);

watch(slug, loadResults);

watch(resultsList, () => {
    if (unref(hasSlug) && hasInProgress() && !pollTimer) {
        startPolling();
    }
});

onBeforeUnmount(stopPolling);
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
