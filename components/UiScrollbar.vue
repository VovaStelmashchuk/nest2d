<template>
    <div class="scrollbar">
        <slot />
	</div>
</template>
<style lang="scss" scoped>
.scrollbar {
    padding-right: 8px;
    margin-right: -8px;
    overflow: auto;

    @include firefox {
        scrollbar-width: thin;
        scrollbar-color: rgb(22, 26, 33, 0.8) rgb(0, 11, 33, 0.05);
    }

    &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgb(22, 26, 33, 0.8);
        border-radius: 5px;
    }

    &::-webkit-scrollbar-track {
        background: rgb(0, 11, 33, 0.05);
        border-radius: 3px;
    }
}
</style>