<template>
    <div class="wrapper">
        <div class="content">
            <MainTitle class="content__title" :label="`Files: ${selectedFileCount}`" />
            <!-- <ProjectName :projectName="data.name" :slug="data.slug" /> -->
            <div class="content__files files">
                <DxfUpload @files="handleSubmit" />
                <div
                    v-for="(file, fileIndex) in files"
                    :key="file.slug"
                    class="files__item file"
                >
                    <SvgDisplay
                        :size="sizeType.s"
                        :svgContent="file.svg"
                        class="file__display"
                    />
                    <p class="file__name">
                        {{ file.name }}
                    </p>
                    <div class="counter">
                        <MainButton 
                            :size="sizeType.s"
                            :icon="iconType.minus"
                            :isDisable="file.count < 1"
                            :isLabelShow=false
                            @click="decrement(fileIndex)"
                            label="decrement"
                            class="counter__btn"
                        />
                        <p class="counter__value">
                            {{ file.count }}
                        </p>
                        <MainButton 
                            :size="sizeType.s"
                            :icon="iconType.plus"
                            :isLabelShow=false
                            @click="increment(fileIndex)"
                            label="increment"
                            class="counter__btn"
                        />
                    </div>
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
            </div>
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
                        <MainButton
                            v-if="isHeightLock"
                            @click="updateHeightLock()"
                            :isLabelShow=false
                            :icon="iconType.lock"
                            :theme="themeType.secondary"
                            label="unlock height"
                            class="size__btn"
                        />
                        <MainButton
                            v-else
                            @click="updateHeightLock()"
                            :isLabelShow=false
                            :icon="iconType.unlock"
                            label="lock height"
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
                :isDisable="btnIsDisable"
                @click="nest"
                class="nest__btn" 
            />
            <div
                v-if="nestRequestError"
                class="nest__error"
            >
                {{ nestRequestError }}
            </div>
            <div v-if="!isNewParams && !isNesting" class="nest__text">
                Change settings or files to generate again
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: "auth",
    middleware: "auth",
});
import { sizeType } from "~~/constants/size.constants";
import { iconType } from "~~/constants/icon.constants";
import { themeType } from "~~/constants/theme.constants";
import { computed, unref } from "vue";

const { getters, actions } = globalStore;
const { setQueue, setProjects } = actions;
const isNesting = computed(() => getters.isNesting);

const route = useRoute();

const slug = route.params.slug;
const queuePath = `/api${route.path}/queue`

const { data } = await useFetch(`/api/project/${slug}`);

const widthPlate = ref('400');
const heightPlate = ref('560');
const tolerance = ref('0.1');
const space = ref('0.1');
const lastParams = ref('')
const files = ref(data.value.files.map(file => ({...file, count: 1})))
const isHeightLock = ref(false)

const filesToNest = computed(() => {
    return unref(files).map((file) => (
        {
            slug: file.slug,
            count: file.count
        }
    ))
})
const selectedFileCount = computed(() => {
    return unref(files).reduce((acc, curr) => acc + curr.count, 0)
})
const btnIsDisable = computed(() => {
    return unref(isNesting) || Boolean(unref(nestRequestError)) || !unref(isNewParams)
})
const btnLabel = computed(() => {
    return unref(isNesting) ? 'Nesting...' : `Nest ${unref(selectedFileCount)} files`
})
const isValidParams = computed(() => {
    return Object.values(unref(params)).find(params => !isValidNumber(params))
})
const params = computed(() => ({
    width: unref(widthPlate),
    height: unref(heightPlate),
    tolerance: unref(tolerance),
    space: unref(space)
}))
const nestRequestError = computed(() => {
    if(unref(selectedFileCount) < 1) {
        return 'Please select at least one file to nest.'
    }
    if(unref(isValidParams)) {
        return 'Please enter valid values for width, height, tolerance and space.'
    }

    return ''
});
const isNewParams = computed(() => {
    return unref(requestBody) !== unref(lastParams)
})
const requestBody = computed(() => {
    return JSON.stringify({
        files: unref(filesToNest),
        params: {
            width: Number(unref(params).width),
            height: Number(unref(params).height),
            tolerance: Number(unref(params).tolerance),
            space: Number(unref(params).space)
        },
    })
})
// const currentAnchor = ref(1)
// const getAnchorClasses = (index) => ({'anchor__item--active': index === unref(currentAnchor)})
const updateHeightLock = () => {
    isHeightLock.value = !unref(isHeightLock)
}
const isValidNumber = (value) => {
    return /^\d+(\.\d+)?$/.test(value);
}
const increment = (index) => {
    files.value[index].count++
};
const decrement = (index) => {
    files.value[index].count--
};
const nest = async () => {
    await fetch(`/api/project/${slug}/nest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: unref(requestBody),
    });
    await setQueue(queuePath)
    await setProjects()
    lastParams.value = unref(requestBody)
};
const handleSubmit = async (newFiles) => {
    const formData = new FormData();
    formData.append("projectName", unref(data).name);
    newFiles.forEach((file) => formData.append("dxf", file));

    // const response = await fetch("/api/upload", {
    //     method: "POST",
    //     body: formData,
    // });
}
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
    border: 1px solid var(--separator-secondary);
    transition: border-color 0.3s;

    &__display {
        width: 56px;
        height: 56px;
    }
    &__name {
        margin-top: 16px;
        margin-bottom: 16px;
        color: var(--label-secondary);
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
            border-color: var(--separator-primary);

            #{$self}__name {
                color: var(--main-back);
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
        color: var(--label-secondary);
        margin-left: 8px;
        margin-right: 8px;
        min-width: 24px;
        text-align: center;
    }
}
.nest {
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
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        border-radius: 8px;
    }

    &__settings {
        width: 320px;
        margin-left: auto;
        margin-right: auto;
    }
    &__text {
        color: var(--label-secondary);
        margin-top: 16px;
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
                background-color: var(--main-back);
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
