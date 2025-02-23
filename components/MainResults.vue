<template>
    <div class="results">
        <MainTitle
            label="Results"
            class="results__title"
        />
        <UiScrollbar class="results__scrollbar">
            <UserQueue />
        </UiScrollbar>
	</div>
</template>
<style lang="scss" scoped>
.results {
    font-family: $sf_mono;
    &__title {
        margin-bottom: 16px;
    }
    &__scrollbar {
        max-height: 600px;
    }
}
</style>