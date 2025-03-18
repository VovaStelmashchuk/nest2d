<template>
    <div class="files">
        <DxfUpload @files="addFiles" />
        <template
            v-for="(file, fileIndex) in projectFiles"
            :key="file.slug"
        >
            <FileDone
                :file="file"
                :fileIndex="fileIndex"
                @increment="increment"
                @decrement="decrement"
                @openModal="openModal(file)"
                v-if="fileIsDone(file.processingStatus)"
                class="files__item file"
            />
            <FileInProgress
                :file="file"
                v-if="fileIsProcessing(file.processingStatus)"
                class="files__item file"
            />
            <FileError
                :file="file"
                v-if="fileIsError(file.processingStatus)"
                class="files__item file"
            />
        </template>
        <FileModal v-model:isModalOpen="fileDialog" />
    </div>
</template>
<script setup>
import { processingType } from "~~/constants/files.constants";
import FileError from "./FileError.vue";

defineProps({
    projectFiles: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(["addFiles", "increment", "decrement"])

const addFiles = (files) => emit("addFiles", files)
const increment = (index) => emit("increment", index)
const decrement = (index) => emit("decrement", index)

const fileIsDone = (status) => status === processingType.done
const fileIsProcessing = (status) => status === processingType.inProgress
const fileIsError = (status) => status === processingType.error

const { actions } = globalStore;
const { setModalFileData } = actions;

const fileDialog = useFileDialog();
const openModal = (file) => {
    setModalFileData(file)
    fileDialog.value = true
}
</script>

<style lang="scss" scoped>
.files {
    display: grid;
    grid-template-columns: repeat(3, calc(100% / 3 - 8px));
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
                color: var(--label-primary);
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
</style>
