<template>
    <MainAside @closeAside="$emit('closeAside')" label="Results">
        <p class="results__text">
            Your nested results will be here
        </p>
    </MainAside>
</template>

<script setup>
defineEmits(["closeAside"]);
</script>

<style lang="scss" scoped>
.results {
    &__text {
        color: var(--label-tertiary);
    }
}
</style>
