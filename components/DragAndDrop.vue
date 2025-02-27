<template>
    <div class="drag-and-drop">
        <DxfUpload @files="handleDxfChange" />
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

const dxfFiles = ref([])
const error = ref('')

const handleSubmit = async () => {
    error.value = "";

    if (unref(dxfFiles).length === 0) {
        error.value = "At least one DXF file is required.";
        return;
    }

    const formData = new FormData();
    unref(dxfFiles).forEach((file) => formData.append("dxf", file));

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

const handleDxfChange = (files) => {
    dxfFiles.value = [...files];
    handleSubmit()
    console.log("from child DXF files event: ", files);
}
</script>

<style lang="scss" scoped>
.drag-and-drop {
    font-family: $sf_mono;
    font-size: 12px;
    text-align: center;

    &__text {
        margin-top: 16px;
        color: rgb(22, 26, 33, 0.5);
    }

    &__error {
        margin-top: 16px;
        padding: 12px;
        background-color: rgb(222, 0, 54, 0.05);
        border: solid 1px rgb(222, 0, 54, 0.3);
        border-radius: 8px;
    }
}
</style>