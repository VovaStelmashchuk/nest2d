import { ref, computed } from 'vue'
const defaultTitle = 'Nest2D - Smart Nesting for Laser Cutting and CNC machining'

export default defineNuxtPlugin((nuxtApp) => {
    let interval
    const isTabActive = ref(true)
    const nestTitle = ref('Nest ready')

    const updateVisibility = () => {
        isTabActive.value = document.visibilityState === 'visible'

        if (globalStore.getters.needNotification && isTabActive.value) {
            globalStore.actions.updateNotification(false)
        }

        clearInterval(interval)

        interval = setInterval(() => {
            if (nestTitle.value !== 'Nest ready') {
                nestTitle.value = 'Nest ready'
            } else {
                nestTitle.value = defaultTitle
            }
        }, 500)
    }

    updateVisibility()
    document.addEventListener('visibilitychange', () => updateVisibility())

    const title = computed(() => globalStore.getters.needNotification && !isTabActive.value ? nestTitle.value : defaultTitle)

    useHead({
        title: title
    })

    nuxtApp.provide('isTabActive', isTabActive)
})