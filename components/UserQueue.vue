<template>
    <div 
        v-if="queueList.length"    
        class="queues"
    >
        <div
            v-for="item in queueList"
            :key="item.id"
            @click="openQueueModal(item.slug)"
            class="queues__item item"
        >
            <template v-if="isItemNexting(item.status)">
                <div class="item__loader"></div>
                <p class="item__text">
                    Nesting</p>
            </template>
            <template v-else>
                <div 
                    v-if="item.status === statusType.failed"
                    class="item__placeholder"
                >
                    Err
                </div>
                <SvgDisplay
                    v-else
                    :size="sizeType.s"
                    :src="getSvgSrc(item.svg)"
                    class="item__display"
                />
                <p class="item__name">
                    {{ item.projectName }}
                </p>
                <div class="item__controls controls">
                    <!-- <div class="controls__delete">
                        <IconButton 
                            :label="`delete ${item.projectName}`"
                            :size="sizeType.s"
                            :icon="iconType.trash"
                            @click="console.log(`delete ${item.projectName}`)"
                        />
                    </div> -->
                    <MainButton 
                        v-if="item.status === statusType.completed"
                        :href="`/api/queue/${item.slug}/dxf`"
                        label="Download"
                        tag="a"
                        :size="sizeType.s"
                        :theme="themeType.primary"
                        class="controls__download"
                    />
                </div>
            </template>
        </div>
    </div>
    <p v-else class="queues__text">
        Your nested results will be here
    </p>  
</template>

<script setup>
import { baseUrl } from "~/.secret.json";
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";
import { globalStore } from "~~/store";

const route = useRoute();
const apiPath = computed(() => {
    return route.name === 'project-slug' ? `/api${route.path}/queue` : '/api/queue/all';
})

const getSvgSrc = (value) => {
    return `${baseUrl}${value}`
}
const { getters, mutations } = globalStore;
const { queueList } = toRefs(getters);
const { setQueue, openQueueModal } = mutations;

const isItemNexting = (status) => {
    return [statusType.unfinished, statusType.pending].includes(status)
}
onBeforeMount(() => {
    setQueue(unref(apiPath));
})

watch(() => route.fullPath, () => {
    setQueue(unref(apiPath));
});

</script>
<style lang="scss" scoped>
.queues {
    font-family: $sf_mono;
    &__text {
        font-size: 12px;
        line-height: 1.2;
        color: rgb(22, 26, 33, 0.5);
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }

}
.controls {
    display: flex;
    align-items: center;

    &__delete {
        opacity: 0;
        transition: opacity 0.3s;
    }
    &__download {
        margin-left: 5px;
    }
}

.item {
    cursor: pointer;
    $self: &;
    position: relative;
    display: block;
    padding: 15px;
    border: 1px solid rgb(0, 11, 33, 0.1);
    border-radius: 8px;
    transition: border-color 0.3s;
    &__display,
    &__placeholder,
    &__loader {
        width: 40px;
        height: 40px;
    }
    &__loader {
        position: relative;
        border-radius: 6px;
        background-color: rgb(0, 11, 33, 0.05);

        &::after {
            top: 50%;
            left: 50%;
            width: 1px;
            height: 1px;
            content: '';
            position: absolute;
            transform: translate(-50%, -50%);
            color: #000;
            box-shadow: -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px, -5px -5px 0 3px;
            animation: loader 6s infinite;
        }
    }
    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 6px;
        background-color: rgb(222, 0, 54, 0.05);
        border: solid 1px rgb(222, 0, 54, 0.3);
        font-size: 12px;
        line-height: 1.2;
    }
    &__name,
    &__text {
        font-size: 12px;
        line-height: 1.2;
        margin-top: 10px;
        color: rgb(22, 26, 33, 0.8);
        transition: color 0.3s;
    }
    &__text {
        &::after {
            content: '';
            animation: dots 2s infinite linear;
        }
    }
    &__controls {
        position: absolute;
        top: 8px;
        right: 8px;
    }

    @media (hover:hover) {
        &:hover {
            .controls {
                &__delete {
                    opacity: 1;
                }
            }
            border-color: rgb(0, 11, 33, 0.15);
            #{$self}__name {
                color: #000;
            }
        }
    }
}
@keyframes dots {
    0% {
        content: '';
    }
    33.33% {
        content: '.';
    }
    66.66% {
        content: '..';
    }
    100% {
        content: '...';
    }
}
@keyframes loader {
    0% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px;
    }
    8.33% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px -5px 0 3px;
    }
    16.66% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px;
    }
    24.99% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    33.32% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px -5px 0 3px;
    }
    41.65% {
        box-shadow: 5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px -5px 0 3px;
    }
    49.98% {
        box-shadow: 5px 5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px;
    }
    58.31% {
        box-shadow: -5px 5px 0 3px,
                    -5px 5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    66.64% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    74.97% {
        box-shadow: -5px -5px 0 3px,
                    5px -5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    83.3% {
        box-shadow: -5px -5px 0 3px,
                    5px 5px 0 3px,
                    5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    91.63% {
        box-shadow: -5px -5px 0 3px,
                    -5px 5px 0 3px,
                    -5px 5px 0 3px,
                    -5px 5px 0 3px;
    }
    100% {
        box-shadow: -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px,
                    -5px -5px 0 3px;
    }
}
</style>