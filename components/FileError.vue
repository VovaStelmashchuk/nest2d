<template>
    <div class="file">
        <div class="file__display">
            Err
        </div>
        <p class="file__name">
            {{ file.name }}
        </p>
        <MainButton 
            :size="sizeType.s"
            :theme="themeType.secondary"
            href="https://github.com/VovaStelmashchuk/nest2d/issues/new"
            target="_blank"
            label="Report a problem"
            tag="a"
            class="file__problem"
        />
        <!-- <div class="file__btn">
            <MainButton 
                :label="`delete ${file.name}`"
                :size="sizeType.s"
                :icon="iconType.trash"
                :isLabelShow=false
                @click="console.log(`delete ${file.name}`)"
            />
        </div> -->
    </div>
</template>
<script setup>
import { sizeType } from "~~/constants/size.constants";
import { themeType } from '~~/constants/theme.constants';

defineProps({
    file: {
        type: Object,
        required: true
    },
})

</script>

<style lang="scss" scoped>
.file {
    position: relative;
    $self: &;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--separator-secondary);
    transition: border-color 0.3s;

    &__display {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 8px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        color: var(--label-primary);
        font-size: 16px;
    }
    &__name {
        margin-top: 16px;
        margin-bottom: 16px;
        color: var(--label-secondary);
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    &__btn {
        opacity: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        transition: opacity 0.3s;
    }
    &__problem {
        margin-left: auto;
        margin-right: auto;
    }

    @media (hover:hover) {
        &:hover {
            border-color: var(--separator-primary);

            #{$self}__name {
                color: var(--label-primary);
            }
            #{$self}__btn {
                opacity: 1;
            }
        }
    }
}
</style>
