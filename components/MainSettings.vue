<template>
    <div class="settings">
        <MainTitle 
            label="Nesting settings"
            class="settings__title" 
        />
        <div class="settings__content content">
            <div class="content__size size">
                <div class="size__line">
                    <InputField
                        prefix="W"
                        suffix="mm"
                        v-model="localWidth"
                        class="size__input"
                    />
                    <InputField
                        prefix="H"
                        suffix="mm"
                        v-model="localHeight"
                        class="size__input"
                    />
                </div>
                <InputField
                    prefix="Spacing"
                    suffix="mm"
                    v-model="localTolerance"
                    class="size__input"
                />
                <InputField
                    prefix="Tolerance"
                    suffix="mm"
                    v-model="localSpace"
                    class="size__input"
                />
            </div>
            <!-- <div class="content__anchor anchor">
                <p class="anchor__title">
                    Anchor
                </p>
                <ul class="anchor__list">
                    <li v-for="index in 9" 
                        :label="index" 
                        :key="index" 
                        @click="currentAnchor = index"
                        :class="getAnchorClasses(index)"
                        class="anchor__item">
                    </li>
                </ul>
            </div> -->
        </div>
    </div>
</template>

<script setup>

const emit = defineEmits(["update:widthPlate", "update:heightPlate", "update:tolerance", "update:space"]);

const props = defineProps({
    widthPlate: {
        type: String,
        required: true,
    },
    heightPlate: {
        type: String,
        required: true,
    },
    tolerance: {
        type: String,
        required: true,
    },
    space: {
        type: String,
        required: true,
    },
})
const localWidth = computed({
  get: () => props.widthPlate,
  set: value => emit("update:widthPlate", value),
});

const localHeight = computed({
  get: () => props.heightPlate,
  set: value => emit("update:heightPlate", value),
});

const localTolerance = computed({
  get: () => props.tolerance,
  set: value => emit("update:tolerance", value),
});

const localSpace = computed({
  get: () => props.space,
  set: value => emit("update:space", value),
});

// const currentAnchor = ref(1)
// const getAnchorClasses = (index) => ({'anchor__item--active': index === unref(currentAnchor)})

</script>

<style lang="scss" scoped>
.settings {
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }
    &__content {
        width: 320px;
        margin-left: auto;
        margin-right: auto;
    }

}
.content {
    display: flex;
    justify-content: center;

    &__size {
        width: 221px;
    }
    &__anchor {
        width: 91px;
        margin-left: 8px;
    }
}
.size {
    &>*:not(:last-child) {
        margin-bottom: 8px;
    }

    &__line {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    &__input {
        flex-grow: 1;
        min-width: 80px;
    }
}
.anchor {
    padding: 4px;
    border-radius: 6px;
    background-color: var(--fill-tertiary);
    
    &__title {
        text-align: left;
        padding-top: 8px;
        padding-bottom: 2px;
        padding-left: 8px;
        color: var(--label-secondary);
        margin-bottom: 15px;
    }
    &__list {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
    }
    &__item {
        cursor: pointer;
        padding-top: 100%;
        display: block;
        position: relative;
        border-radius: 4px;
        transition: background-color 0.3s;

        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 4px;
            height: 4px;
            border-radius: 4px;
            background-color: var(--label-tertiary);
            transition: background-color 0.3s, transform 0.3s;
        }

        @media (hover:hover) {
            &:hover {
                background-color: var(--fill-tertiary);
                &::after {
                    background-color: var(--label-secondary);
                }
            }
        }

        &--active {
            pointer-events: none;

            &::after {
                background-color: var(--accent-primary);
                transform: translate(-50%, -50%) scale(1.5);
            }
        }
    }
    &__input {
        opacity: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        position: absolute;
        z-index: -1;
        top: 0;
        left: 0;
    }
}
</style>