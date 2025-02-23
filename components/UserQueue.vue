<template>
    <div class="queues" v-if="data?.items">
        <div
            v-for="item in data.items"
            :key="item.id"
            class="queues__item item"
        >
            <SvgDisplay class="item__display" :svgContent="``" />
            <!-- <img
                class="w-8 h-8"
                :src="getIcon(item.status)"
                :alt="`Icon for ${item.status}`"
            /> -->
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
                    v-if="item.status === 'completed'"
                    :href="`/api/queue/${item.slug}/dxf`"
                    label="Download"
                    tag="a"
                    :size="sizeType.s"
                    :theme="themeType.primary"
                    class="controls__download"
                />
            </div>
        </div>
    </div>
    <p v-else class="queues__text">
        Your nested results will be here
    </p>  
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

const data = ref(null);
let intervalId;

const fetchData = async () => {
    try {
        const response = await $fetch(`/api/queue/all`);
        data.value = response;
    } catch (err) {}
};

const startPolling = () => {
    fetchData();
    intervalId = setInterval(fetchData, 5000);
};

const stopPolling = () => {
    if (intervalId) clearInterval(intervalId);
};

onMounted(() => {
    startPolling();
});

onBeforeUnmount(() => {
    stopPolling();
});

function getIcon(status) {
    switch (status) {
        case "completed":
            return "/done.svg";
        case "in-progress":
            return "/processing.svg";
        case "pending":
            return "/pending.svg";
        case "failed":
            return "/fail.svg";
        default:
            return "/unknown.svg";
    }
}
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
    $self: &;
    position: relative;
    display: block;
    padding: 15px;
    border: 1px solid rgb(0, 11, 33, 0.1);
    border-radius: 8px;
    transition: border-color 0.3s;
    &__display {
        width: 40px;
        height: 40px;
    }
    &__name {
        font-size: 12px;
        line-height: 1.2;
        margin-top: 10px;
        color: rgb(22, 26, 33, 0.8);
        transition: color 0.3s;
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
</style>