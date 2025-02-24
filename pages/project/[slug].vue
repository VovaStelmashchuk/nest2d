<template>
    <div class="wrapper">
        <div class="content">
            <MainTitle class="content__title" :label="`Files: ${selectedFileCount}`" />
            <!-- <ProjectName :projectName="data.name" :slug="data.slug" /> -->
            <ul class="content__files files">
                <li
                    v-for="file in data.files"
                    :key="file.slug"
                    class="files__item file"
                >
                    <SvgDisplay class="file__display" :svgContent="file.svg" />
                    <p class="file__name">
                        {{ file.name }}
                    </p>
                    <div class="counter">
                        <IconButton 
                            :size="sizeType.s"
                            :icon="iconType.minus"
                            :isDisable="counters[file.slug] < 1"
                            @click="decrement(file.slug)"
                            label="decrement"
                            class="counter__btn"
                        />
                        <p class="counter__value">
                            {{ counters[file.slug] }}
                        </p>
                        <IconButton 
                            :size="sizeType.s"
                            :icon="iconType.plus"
                            @click="increment(file.slug)"
                            label="increment"
                            class="counter__btn"
                        />
                    </div>
                    <!-- <div class="file__btn">
                        <IconButton 
                            :label="`delete ${file.name}`"
                            :size="sizeType.s"
                            :icon="iconType.trash"
                            @click="console.log(`delete ${file.name}`)"
                        />
                    </div> -->
                </li>
            </ul>
        </div>
        <div class="nest">
            <MainTitle class="nest__title" label="Nesting settings" />
            <div class="nest__settings settings">
                <div class="settings__size size">
                    <div class="size__line">
                        <InputField
                            prefix="W"
                            suffix="mm"
                            v-model="widthPlate"
                            class="size__input"
                        />
                        <IconButton
                            v-if="isHeightLock"
                            @click="updateHeightLock()"
                            label="unlock height"
                            :icon="iconType.lock"
                            :theme="themeType.secondary"
                            class="size__btn"
                        />
                        <IconButton
                            v-else
                            @click="updateHeightLock()"
                            label="lock height"
                            :icon="iconType.unlock"
                            class="size__btn"
                        />
                        <InputField
                            :isDisable="isHeightLock"
                            prefix="H"
                            suffix="mm"
                            v-model="heightPlate"
                            class="size__input"
                        />
                    </div>
                    <InputField
                        prefix="Spacing"
                        suffix="mm"
                        v-model="space"
                        class="size__input"
                    />
                    <InputField
                        prefix="Tolerance"
                        suffix="mm"
                        v-model="tolerance"
                        class="size__input"
                    />
                </div>
                <!-- <div class="settings__anchor anchor">
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
            <MainButton 
                :theme="themeType.primary"
                :label="btnLabel"
                :isDisable="isNesting"
                @click="nest"
                class="nest__btn" 
            />
            <div
                v-if="nestRequestError"
                class="nest__error"
            >
                {{ nestRequestError }}
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: "auth",
});
import { useRoute } from "vue-router";
import { useFetch } from "#app";
import { computed, watch } from "vue";
import { sizeType } from "~~/constants/size.constants";
import { iconType } from "~~/constants/icon.constants";
import { themeType } from "~~/constants/theme.constants";
import { globalStore } from "~~/store";

const { getters, mutations } = globalStore;
const { isNesting } = toRefs(getters);
const { setQueue } = mutations;

const route = useRoute();
const queuePath = `/api${route.path}/queue`

const btnLabel = computed(() => {
    return unref(isNesting) ? 'Nesting...' : `Nest ${unref(selectedFileCount)} files`
}) 

const slug = route.params.slug;
const query = route.query;
const widthPlate = ref(query.width || 400);
const heightPlate = ref(query.height || 560);
const tolerance = ref(query.tolerance || 0.1);
const space = ref(query.space || 0.1);

const counters = ref({});
const selectedFileCount = computed(() => Object.values(unref(counters)).reduce((acc, curr) => acc + curr, 0))

const { data, pending, error } = await useFetch(`/api/project/${slug}`);

// const currentAnchor = ref(1)
// const getAnchorClasses = (index) => ({'anchor__item--active': index === unref(currentAnchor)})

const isHeightLock = ref(false)
const updateHeightLock = () => {
    isHeightLock.value = !unref(isHeightLock)
}

const nestRequestError = ref('');

const fileKeys = Object.keys(query).filter((key) => key.startsWith("file-"));

if (fileKeys.length) {
    fileKeys.forEach((key) => {
        const slug = key.replace("file-", "");
        counters.value[slug] = parseInt(query[key]);
    });
    data.value.files.forEach((file) => {
        if (!counters.value[file.slug]) {
            counters.value[file.slug] = 0;
        }
    });
} else {
    data.value.files.forEach((file) => {
        counters.value[file.slug] = 1;
    });
}

const increment = (slug) => {
    counters.value[slug]++;
    nestRequestError.value = null
};

const decrement = (slug) => {
    if (counters.value[slug] > 0) {
        counters.value[slug]--;
    }
    nestRequestError.value = null
};

const nest = async () => {
    nestRequestError.value = null;

    const filesToNest = Object.entries(counters.value)
    .filter(([_, count]) => count > 0)
    .map(([slug, count]) => {
        return {
            slug,
            count,
        };
    });

    if (filesToNest.length === 0) {
        nestRequestError.value = "Please select at least one file to nest.";
        return;
    }

    const widthValue = parseFloat(widthPlate.value);
    const heightValue = parseFloat(heightPlate.value);
    const toleranceValue = parseFloat(tolerance.value);
    const spaceValue = parseFloat(space.value);

    if (
        isNaN(widthValue) ||
        isNaN(heightValue) ||
        isNaN(toleranceValue) ||
        isNaN(spaceValue)
    ) {
        nestRequestError.value = "Please enter valid values for width, height, tolerance and space.";
        return;
    }

    const request = {
        files: filesToNest,
        params: {
            width: widthValue,
            height: heightValue,
            tolerance: toleranceValue,
            space: spaceValue,
        },
    };

    const nestResultResponse = await fetch(`/api/project/${slug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });
    const nestResult = await nestResultResponse.json();
    setQueue(queuePath)
    // navigateTo(`/queue/${nestResult.slug}`);
};
</script>

<style lang="scss" scoped>
.wrapper {
    &>*:not(:last-child) {
        margin-bottom: 40px;
    }
}
.content {
    &__title {
        margin-bottom: 16px;
    }
}
.files {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
}
.file {
    position: relative;
    $self: &;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid rgb(0, 11, 33, 0.1);
    transition: border-color 0.3s;

    &__display {
        width: 56px;
        height: 56px;
    }
    &__name {
        line-height: 1.2;
        margin-top: 16px;
        margin-bottom: 16px;
        font-family: $sf_mono;
        font-size: 12px;
        color: rgb(22, 26, 33, 0.8);
        transition: color 0.3s;
    }
    &__btn {
        opacity: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        transition: opacity 0.3s;
    }

    @media (hover:hover) {
        &:hover {
            border-color: rgb(0, 11, 33, 0.15);
            #{$self}__name {
                color: #000;
            }
            #{$self}__btn {
                opacity: 1;
            }
        }
    }
}
.counter {
    display: flex;
    align-items: center;

    &__value {
        line-height: 1.2;
        font-family: $sf_mono;
        font-size: 12px;
        color: rgb(22, 26, 33, 0.8);
        margin-left: 8px;
        margin-right: 8px;
        min-width: 24px;
        text-align: center;
    }
}
.nest {
    font-family: $sf_mono;
    font-size: 12px;
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }

    &__btn {
        margin-top: 40px;
        margin-right: auto;
        margin-left: auto;
    }
    &__error {
        margin-top: 16px;
        padding: 12px;
        background-color: rgb(222, 0, 54, 0.05);
        border: solid 1px rgb(222, 0, 54);
        border-radius: 8px;
    }

    &__settings {
        width: 320px;
        margin-left: auto;
        margin-right: auto;
    }
}
.settings {
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
        display: flex;
        align-items: center;
    }
    &__btn {
        flex-shrink: 0;
        margin-left: 2px;
        margin-right: 2px;
    }
    &__input {
        flex-grow: 1;
        min-width: 80px;
    }
}
.anchor {
    padding: 4px;
    border-radius: 6px;
    background-color: rgb(0, 11, 33, 0.05);
    &__title {
        line-height: 1.2;
        text-align: left;
        padding-top: 8px;
        padding-bottom: 2px;
        padding-left: 8px;
        font-family: $sf_mono;
        font-size: 12px;
        color: rgb(22, 26, 33, 0.8);
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
            background-color: rgb(22, 26, 33, 0.5);
            transition: background-color 0.3s, transform 0.3s;
        }

        @media (hover:hover) {
            &:hover {
                background-color: rgb(0, 11, 33, 0.05);
                &::after {
                    background-color: rgb(22, 26, 33, 0.8);
                }
            }
        }

        &--active {
            pointer-events: none;

            &::after {
                background-color: #000;
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
