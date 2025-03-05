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
            <MainButton 
                :label="`delete ${project.name}`"
                :size="sizeType.s"
                :theme="themeType.secondary"
                :icon="iconType.trash"
                :isLabelShow=false
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
    const past = new Date(project.createdAt);
    const diffMs = unref(now) - past;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffMinutes / 1440);

    if (diffMinutes < 1) {
        return "just now";
    }
    if (diffHours >= 1  && diffHours < 24) {
        const hoursWord = diffHours === 1 ? "hours" : "hours";
        return `${diffHours} ${hoursWord} ago`;
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

    color: var(--label-tertiary);
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
        border: 1px solid var(--separator-secondary);
        transition: border-color 0.3s;
        border-radius: 8px;
    }

    &__label {
        display: block;
        color: var(--label-secondary);
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
            color: var(--label-secondary);

            &::after {
                border-color: var(--separator-primary);
            }
            #{$self}__label {
                color: var(--main-back);
            }
            #{$self}__btn {
                opacity: 1;
            }
        }
    }

    &--active {
        color: var(--label-secondary);
        &::after {
            border-width: 2px;
            border-color: var(--main-back);
        }
        #{$self}__label {
            color: var(--main-back);
        }

        @media (hover:hover) {
            &:hover {
                color: var(--main-back);

                &::after {
                    border-color: var(--main-back);
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
