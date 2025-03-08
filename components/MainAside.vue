<template>
    <div 
        ref="aside"
        class="aside"
    >
        <MainTitle
            ref="title"
            :label="label"
            :btnLabel="btnLabel"
            @btnClick="$emit('btnClick')"
            class="aside__title"
        />
        <UiScrollbar 
            :style="styles"    
            class="aside__scrollbar"
        >
            <slot />
        </UiScrollbar>
	</div>
</template>
<script setup>
defineProps({
    label: {
        type: String,
        required: true
    },
    btnLabel: {
        type: String,
        default: ''
    }
})

const aside = ref(null)
const title = ref(null)
const scrollbarHeight = ref(0)

const styles = computed(() => {
    return Boolean(unref(scrollbarHeight)) ? { maxHeight: `${unref(scrollbarHeight)}px` } : {}
})

const setScrollHeight = async () => {
    scrollbarHeight.value = 0
    await nextTick();

    const titleEl = unref(title)?.$el;
    const asideEl = unref(aside);

    if (!titleEl || !asideEl) return;

    const marginBottomValue = parseFloat(window.getComputedStyle(unref(title).$el).marginBottom)
    const tilteHeight = unref(title).$el.offsetHeight
    const asideHeight = unref(aside).offsetHeight

    scrollbarHeight.value = asideHeight - tilteHeight - marginBottomValue
} 

onMounted(async () => {
    await nextTick();
    setScrollHeight()
    window.addEventListener('resize', setScrollHeight)
})
onUnmounted(() => {
    window.removeEventListener('resize', setScrollHeight)
})
</script>
<style lang="scss" scoped>
.aside {
    &__title {
        margin-bottom: 16px;
    }
    &__scrollbar {
        max-height: 400px;
    }
}
</style>