<template>
    <div class="results">
        <MainTitle
            label="Results"
            class="results__title"
        />
        <p class="results__text">
            Your nested results will be here
        </p>  
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
    &__text {
        font-size: 12px;
        line-height: 1.2;
        color: rgb(22, 26, 33, 0.5);
    }
}
</style>