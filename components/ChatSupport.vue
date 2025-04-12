<template>
    <div class="support">
        <div
            @click="supportDialog = false"
            class="support__background">
        </div>
        <div class="support__wrapper">
            <div class="support__header">
                <MainTitle 
                    label="Support Chat"
                    class="support__title"
                />
                <MainButton 
                    label="close modal"
                    :isLabelShow=false
                    :size="sizeType.s"
                    :icon="iconType.close"
                    :theme="themeType.primary"
                    @click="supportDialog = false"
                    class="support__close"
                />
            </div>
            <UiScrollbar class="support__messages">
                <p
                    v-for="msg in messages"
                    :key="msg._id"
                    :class="getMessageClasses(msg.sender)"
                    class="support__message"
                >
                    {{ msg.message }}
                </p>
            </UiScrollbar>
            <div class="support__bottom bottom">
                <InputField
                    placeholder="Type your message..."
                    class="bottom__input"
                    v-model="message"
                    @keyup.enter="sendMessage"
                />
                <MainButton 
                    :theme="themeType.primary"
                    @click="sendMessage"
                    label="Send"
                    class="bottom__btn"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from '~~/constants/size.constants';
import { themeType } from '~~/constants/theme.constants';
import { ref, onMounted, onBeforeUnmount, unref } from 'vue'

const supportDialog = useSupportDialog();

const message = ref('')
const messages = ref([])
const messagesContainer = ref(null)
const eventSource = ref(null)

const sendMessage = async () => {
    if (!message.value.trim()) return

    try {
        await $fetch('/api/support/messages', {
            method: 'POST',
            body: { message: message.value }
        })
        message.value = ''
    } catch (error) {
        console.error('Failed to send message:', error)
    }
}

onMounted(() => {
    eventSource.value = new EventSource('/api/support/messages')

    unref(eventSource).onmessage = (event) => {
        console.log('Received SSE message:', event.data)
        try {
            const parsed = JSON.parse(event.data)
            if (parsed.type === 'initial') {
                messages.value = parsed.data
            } else if (parsed.type === 'newMessages') {
                messages.value.push(...parsed.data)
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

const getMessageClasses = (sender) => ({'support__message--is-user': sender === 'user'})
</script>

<style lang="scss" scoped>
.support {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 4;
    display: flex;
    justify-content: flex-end;

    &__background {
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background-color: var(--label-tertiary);
    }

    &__wrapper {
        z-index: 1;
        position: relative;
        background-color: var(--background-primary);
        width: 400px;
        padding: 15px;
        display: flex;
        flex-direction: column;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__messages {
        border-radius: 8px;
        border: 1px solid var(--separator-secondary);
        flex-grow: 1;
        padding: 12px;
        margin-top: 10px;
        margin-bottom: 10px;
        overflow: auto;
        margin-right: 0;
    }

    &__message {
        padding: 6px 8px;
        border-radius: 0 8px 8px 8px;
        margin-bottom: 10px;
        color: var(--label-primary);
        font-size: 14px;
        line-height: 1.4;
        width: max-content;
        max-width: 100%;
        margin-right: auto;
        text-align: left;
        background-color: var(--fill-secondary);
        color: var(--label-primary);

        &--is-user  {
            margin-left: auto;
            margin-right: initial;
            text-align: right;
            background-color: var(--fill-tertiary); 
            border-radius: 8px 0 8px 8px;
            color: var(--label-secondary);
        }
    }
}
.bottom {
    display: flex;
    align-items: center;
    align-items: center;

    &__btn {
        margin-left: 10px;
    }

    &__input {
        flex-grow: 1;
    }
}
</style>