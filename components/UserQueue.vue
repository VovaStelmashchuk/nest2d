<template>
    <div 
        v-if="queueList.length"    
        class="queues"
    >
        <div
            v-for="item in queueList"
            :key="item.id"
            class="queues__item item"
        >
            <template v-if="isItemNexting(item.status)">
                <MainLoader 
                    :size="sizeType.s"
                    :theme="themeType.secondary"
                    class="item__loader"
                />
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
                        <MainButton 
                            :label="`delete ${item.projectName}`"
                            :size="sizeType.s"
                            :icon="iconType.trash"
                            :isLabelShow=false
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
                <div
                    @click="openModal(item.slug)" 
                    class="item__area"
                />
            </template>
        </div>
    </div>
    <p v-else class="queues__text">
        Your nested results will be here
    </p>
    <QueueModal v-model:isModalOpen="queueDialog" />
</template>

<script setup>
import { baseUrl } from "~/.secret.json";
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { statusType } from "~~/constants/status.constants";
import { globalStore } from "~~/store";

const queueDialog = useQueueDialog();

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

const openModal = (slug) => {
    openQueueModal(slug)
    queueDialog.value = true
}
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
    &__text {
        color: var(--label-tertiary);
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
    $self: &;
    position: relative;
    display: block;
    padding: 15px;
    border: 1px solid var(--separator-secondary);
    border-radius: 8px;
    transition: border-color 0.3s;
    &__display,
    &__placeholder,
    &__loader {
        width: 40px;
        height: 40px;
    }
    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 6px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
    }
    &__name,
    &__text {
        margin-top: 10px;
        color: var(--label-secondary);
        transition: color 0.3s;
    }
    &__text {
        &::after {
            content: '';
            animation: dots 2s infinite linear;
        }
    }
    &__area {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        cursor: pointer;
    }
    &__controls {
        z-index: 1;
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
            border-color: var(--separator-primary);
            #{$self}__name {
                color: var(--main-back);
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

</style>