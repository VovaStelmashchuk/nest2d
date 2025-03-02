<template>
    <div class="drag-and-drop">
        <DxfUpload @files="handleSubmit" />
        <p class="drag-and-drop__text">
            All files will be save secure and available only for you
        </p>

        <div
            v-if="error"
            class="drag-and-drop__error"
        >
            {{ error }}
        </div>
    </div>
</template>

<script setup>
import { globalStore } from "~~/store";

const router = useRouter();

const { mutations } = globalStore;
const { setProjects } = mutations;

const error = ref('')

const handleSubmit = async (files) => {
    error.value = "";

    if (files.length === 0) {
        error.value = "At least one DXF file is required.";
        return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("dxf", file));

    const response = await fetch("/api/project", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        error.value = errorData.message;
    } else {
        const data = await response.json();
        await setProjects()
        await router.push({ path: `/project/${data.slug}` });
    }
}
</script>

<style lang="scss" scoped>
.drag-and-drop {
    text-align: center;

    &__text {
        margin-top: 16px;
        color: var(--label-tertiary);
    }

    &__error {
        margin-top: 16px;
        padding: 12px;
        background-color: var(--error-background);
        border: solid 1px var(--error-border);
        border-radius: 8px;
    }
}
</style>