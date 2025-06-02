<template>
    <div class="user-balance">
        <span class="user-balance__label">Balance:</span>
        <span class="user-balance__count">{{ credits }}</span>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const credits = ref('')
const eventSource = ref(null)

onMounted(() => {
    eventSource.value = new EventSource('/api/user/balance')

    unref(eventSource).onmessage = (event) => {
        console.log('Received SSE message:', event.data)
        try {
            const parsed = JSON.parse(event.data)
            if (parsed.type === 'initial') {
                credits.value = parsed.data.balance
            } else if (parsed.type === 'newBalance') {
                credits.value = parsed.data.balance
            }
        } catch (e) {
            console.error('Error parsing SSE message:', e)
        }
    }

    unref(eventSource).onerror = (err) => {
        console.error('SSE connection error:', err)
    }
})
onBeforeUnmount(() => {
    if (unref(eventSource)) {
        unref(eventSource).close()
    }
})
</script>

<style lang="scss" scoped>
.user-balance {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: var(--label-primary);

    &__label {
        margin-right: 8px;
        font-weight: 500;
    }

    &__count {
        font-weight: bold;
        color: var(--label-secondary);
    }
}
</style>