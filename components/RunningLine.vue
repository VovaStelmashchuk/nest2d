<template>
    <div class="line">
        <div class="line__body">
            <span :key="index" v-for="index in 10" class="line__label">
                {{ textValue }}
            </span>
        </div>
    </div>
</template>
<script setup>
const { size } = defineProps({
    textValue: {
        type: String,
        default: 'The project still under development',
    },
}) 
</script>
<style lang="scss" scoped>
@keyframes line {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-100%);
    }
}
.line {
    overflow: hidden;
    padding-top: 2px;
    padding-bottom: 2px;
    background-color: #000;
    &__body {
        display: flex;
    }
    &__label {
        animation: 5s line linear infinite;
        white-space: nowrap;
        padding-right: 40px;
        font-family: $sf_mono;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        opacity: 0.7;
    }
}
</style>