<template>
    <div class="results">
        <MainTitle
            label="Results"
            class="results__title"
        />
        <UserQueue />
	</div>
</template>
<script>
export default {
    name: "MainResults",
};
</script>
<style lang="scss" scoped>
.results {
    font-family: $sf_mono;
    &__title {
        margin-bottom: 16px;
    }
}
</style>