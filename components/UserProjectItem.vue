<template>
    <div class="prodject">
        <NuxtLink 
            :to="`/project/${project.slug}`"
            class="prodject__label"
        >
            {{ project.name }}
        </NuxtLink>
        <div class="prodject__info info">
            <p class="info__time">
                lorem ipsum
            </p>
            <p class="info__results">
                lorem ipsum
            </p>
        </div>
        <div class="prodject__btn">
            <IconButton 
                :label="`delete ${project.name}`"
                :size="sizeType.s"
                :theme="themeType.secondary"
                :icon="iconType.trash"
                @click="console.log(`delete ${project.name}`)"
            />
        </div>
    </div>
</template>

<script>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';

export default {
    name: "ProjectGridItem",
    props: {
        project: {
            type: Object,
            required: true,
        },
    },
    setup() {
        return {
            iconType,
            sizeType,
            themeType
        }
    }
};
const navigateToProject = () => {
    console.log("Navigating to project");
};
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
    border: 1px solid rgb(0, 11, 33, 0.1);
    transition: border-color 0.3s, color 0.3s;

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
            border-color: rgb(0, 11, 33, 0.15);

            #{$self}__label {
                color: #000;
            }
            #{$self}__btn {
                opacity: 1;
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
