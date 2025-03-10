<template>
    <div class="authenticating">
        <MainTitle 
            label="Authenticating..."
            class="authenticating__title"
        />
        <MainLoader
            :size="sizeType.l"
            class="authenticating__loader"
        />
        <p class="authenticating__text">
            Please wait a moment while we process your authentication.
        </p>
    </div>
</template>
<script setup>
    import { sizeType } from "~~/constants/size.constants";
</script>
<style lang="scss" scoped>
.authenticating {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    
    &__loader {
        margin-top: 20px;
        margin-bottom: 40px;
        width: 120px;
        height: 120px;
    }
}
</style>