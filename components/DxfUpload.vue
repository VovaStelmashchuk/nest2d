<template>
    <div
        class="upload"
        @dragover.prevent="updateDragStatus()"
        @dragenter.prevent="updateDragStatus()"
        @dragleave.prevent="updateDragStatus(false)"
        @drop.prevent="onDrop"
    >
        <label
            class="upload__label"
            :class="labelClasses"
        >
            <input
                type="file"
                name="dxf"
                accept=".dxf"
                multiple
                @change="onDXFChange"
                class="upload__input"
            />
            <MainButton 
                label="Choose files"
                tag="div"
                :theme="themeType.primary"
                class="upload__btn"
            />
            <span class="upload__text">
                or drop your files here
            </span>
            <span class="upload__text upload__text--gray">
                Up to 20 files, max 5 MB each
            </span>
        </label>
    </div>
</template>

<script setup>
import { themeType } from '~~/constants/theme.constants';

const props = defineProps({
    extensions: {
        type: Array,
        default: () => [".dxf"],
    },
});
const emit = defineEmits(["files"]);

const { extensions } = toRefs(props);
const isDragOver = ref(false);

const updateDragStatus = (newValue = true) => {
    isDragOver.value = newValue;
};
const setFiles = (newFiles) => {
    const filesList = newFiles.filter((file) => unref(extensions).includes(file.name.slice(-4).toLowerCase()));
    emit("files", filesList);
};
const onDrop = (event) => {
    updateDragStatus(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
};
const onDXFChange = (event) => {
    const addedFiles = Array.from(event.target.files);
    setFiles(addedFiles);
};

const labelClasses = computed(() => ({ 'upload__label--hover': unref(isDragOver) }));
</script>

<style lang="scss" scoped>
.upload {
    $self: &;
    position: relative;
    text-align: center;
    font-family: $sf_mono;

    &__label {
        padding: 10px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        min-height: 164px;
        background-color: rgb(0, 11, 33, 0.05);
        border: dashed 1px #000;
        border-radius: 8px;
        transition: background-color 0.3s;

        &--hover {
            background-color: rgb(0, 11, 33, 0.08);
        }
    }
    &__btn {
        position: relative;
        z-index: 1;
        margin-bottom: 16px;
    }
    &__text {
        font-size: 12px;
        line-height: 1.2;
        color: #000;

        &--gray {
            margin-top: 8px;
            color: rgb(22, 26, 33, 0.8);
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

    @media (hover:hover) {
        &:hover {
            #{$self}__label {
                background-color: rgb(0, 11, 33, 0.08);
            }
        }
    }
}
</style>
