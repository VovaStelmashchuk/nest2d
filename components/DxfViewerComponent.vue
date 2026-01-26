<template>
    <div
        ref="containerRef"
        :class="containerClasses"
        class="dxf-viewer-container"
    >
        <div
            v-if="isLoading"
            class="loading-overlay"
        >
            <MainLoader :size="sizeType.s" />
        </div>
        <div
            v-if="error"
            class="error-overlay"
        >
            Err
        </div>
    </div>
</template>

<script setup>
import { defaultSizeType, sizeType } from "~~/constants/size.constants";

const props = defineProps({
    size: {
        type: String,
        default: defaultSizeType
    },
    dxfUrl: {
        type: String,
        default: null
    },
    options: {
        type: Object,
        default: () => ({
            autoResize: true,
            colorCorrection: true,
            clearColor: 0xE9E9E7,
        })
    }
})
const containerRef = ref(null)
const isLoading = ref(false)
const error = ref(null)
let dxfViewer = null

const loadDxf = async (url) => {
    if (!url || !dxfViewer) return

    isLoading.value = true
    error.value = null

    try {
        await dxfViewer.Load({ url })
    } catch (err) {
        console.error('DXF loading error:', err)
        error.value = err.message || err.toString()
    } finally {
        isLoading.value = false
    }
}

const clearViewer = () => {
    if (dxfViewer) {
        dxfViewer.Clear()
        error.value = null
    }
}

const containerClasses = computed(() => ({
    [`dxf-viewer-container--size-${unref(props.size)}`]: Boolean(unref(props.size))
}))

onMounted(async () => {
    await nextTick()
    
    if (process.client && containerRef.value) {
        const [{ DxfViewer }, THREE] = await Promise.all([
            import('dxf-viewer'),
            import('three')
        ])
        const viewerOptions = {
            ...props.options
        }
        if (props.options.clearColor !== undefined) {
            viewerOptions.clearColor = new THREE.Color(props.options.clearColor)
        }
        dxfViewer = new DxfViewer(containerRef.value, viewerOptions)
        if (props.dxfUrl) {
            await loadDxf(props.dxfUrl)
        }
    }
})

onBeforeUnmount(() => {
    if (dxfViewer) {
        dxfViewer.Destroy()
        dxfViewer = null
    }
})

watch(() => props.dxfUrl, async (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
        if (newUrl) {
            await loadDxf(newUrl)
        } else {
            clearViewer()
        }
    }
})

defineExpose({
    getViewer: () => dxfViewer,
    loadDxf,
    clearViewer
})
</script>

<style scoped lang="scss">
$loading: '.loading-overlay';
$error: '.error-overlay';

.dxf-viewer-container {
    position: relative;
    max-height: 100%;
    max-width: 100%;
    min-height: 320px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    canvas {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
    }

    &--size-s {
        border-radius: 6px;

        #{$loading} {
            border-radius: 6px;
        }
        #{$error} {
            border-radius: 6px;
        }
    }
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--fill-tertiary);
    z-index: 10;
    border-radius: 8px;
}

.error-overlay {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 8px;
    background-color: var(--error-background);
    border: solid 1px var(--error-border);
    color: var(--label-primary);
}
</style>
