<template>
    <div 
        :class="prodjectClasses"
        class="prodject"
    >
        <NuxtLink 
            :to="`/project/${project.slug}`"
            class="prodject__label"
        >
            {{ project.name }}
        </NuxtLink>
        <div class="prodject__info info">
            <p class="info__time">
                {{ timeAgo }}
            </p>
            <p v-if="project.results" class="info__results">
                {{ resultsLabel }}
            </p>
        </div>
        <!-- <div class="prodject__btn">
            <IconButton 
                :label="`delete ${project.name}`"
                :size="sizeType.s"
                :theme="themeType.secondary"
                :icon="iconType.trash"
                @click="console.log(`delete ${project.name}`)"
            />
        </div> -->
    </div>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, toRefs, unref } from 'vue';
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

const { project } = defineProps({
    project: {
        type: Object,
        required: true,
    },
}) 
const route = useRoute()
const now = ref(new Date())

const prodjectClasses = computed(() => ({
    'prodject--active': unref(project).slug === route.params.slug
}))
const timeAgo = computed(() => {
    const past = new Date(project.uploadedAt);
    const diffMs = unref(now) - past;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffDays = Math.floor(diffMinutes / 1440);

    if (diffMinutes < 1) {
        return "just now";
    }
    if (diffDays >= 1) {
        const dayWord = diffDays === 1 ? "day" : "days";
        return `${diffDays} ${dayWord} ago`;
    }

    return `${diffMinutes} min ago`;
})
const resultsLabel = computed(() => {
    const resultWord = unref(project).results === 1 ? "result" : "results";
    return `${unref(project).results} ${resultWord}`;
})

let timer;
const updateTime = () => {
    clearInterval(timer)
    timer = setInterval(updateTime, 60000)
    now.value = new Date()
}

onBeforeMount(() => {
    updateTime();
})
onBeforeUnmount(() => {
    clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.prodject {
    $self: &;

    color: rgb(22, 26, 33, 0.5);
    line-height: 1.2;
    font-family: $sf_mono;
    font-size: 12px;
    position: relative;
    padding: 16px;
    border-radius: 8px;
    transition: color 0.3s;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
        border: 1px solid rgb(0, 11, 33, 0.1);
        transition: border-color 0.3s;
        border-radius: 8px;
    }

    &__label {
        display: block;
        color: rgb(22, 26, 33, 0.8);
        transition: color 0.3s;

        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
        }
    }

    &__btn {
        opacity: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        transition: opacity 0.3s;
    }

    &__info {
        margin-top: 16px;
    }

    @media (hover:hover) {
        &:hover {
            color: rgb(22, 26, 33, 0.8);

            &::after {
            border-color: rgb(0, 11, 33, 0.15);
            }
            #{$self}__label {
                color: #000;
            }
            #{$self}__btn {
                opacity: 1;
            }
        }
    }

    &--active {
        color: rgb(22, 26, 33, 0.8);
        &::after {
            border-width: 2px;
            border-color: #000;
        }
        #{$self}__label {
            color: #000;
        }

        @media (hover:hover) {
            &:hover {
                color: #000;

                &::after {
                    border-color: #000;
                }
            }
        }
    }
}

.info {
    display: flex;

    &__time,
    &__results {
        flex-basis: 50%;
    }
    &__results {
        text-align: right;
    }
}
</style>
