<template>
    <div class="authenticating">
        <MainTitle 
            label="Authenticating..."
            class="authenticating__title"
        />
        <MainLoader class="authenticating__loader" />
        <p class="authenticating__text">
            Please wait a moment while we process your authentication.
        </p>
    </div>
</template>
<style lang="scss" scoped>
.authenticating {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    &__text {
        font-family: $sf_mono;
        font-size: 12px;
        line-height: 1.2;
    }
    &__loader {
        margin-top: 20px;
        margin-bottom: 40px;
        width: 120px;
        height: 120px;
    }
}
</style>