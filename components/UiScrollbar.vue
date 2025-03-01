<template>
    <div class="scrollbar">
        <slot />
	</div>
</template>
<style lang="scss" scoped>
.scrollbar {
    padding-bottom: 4px;
    padding-right: 8px;
    margin-right: -8px;
    overflow: auto;

    @include firefox {
        scrollbar-width: thin;
        scrollbar-color: var(--label-secondary) var(--fill-tertiary);
    }

    &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--label-secondary);
        border-radius: 5px;
    }

    &::-webkit-scrollbar-track {
        background: var(--fill-tertiary);
        border-radius: 3px;
    }
}
</style>