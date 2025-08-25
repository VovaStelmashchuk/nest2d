<template>
    <div class="support">
        <div @click="supportDialog = false" class="support__background"></div>
        <div class="support__wrapper">
            <div class="support__header">
                <MainTitle label="Support Chat" class="support__title" />
                <MainButton
                    label="close modal"
                    :isLabelShow="false"
                    :size="sizeType.s"
                    :icon="iconType.close"
                    :theme="themeType.primary"
                    @click="supportDialog = false"
                    class="support__close"
                />
            </div>
            <UiScrollbar ref="messagesContainer" class="support__messages message-list">
                <template
                    v-for="message in messagesList"
                    :key="message._id"
                >
                    <div v-if="message.day" class="message-list__day day">
                        <span class="day__label">
                            {{ message.day }}
                        </span>
                    </div>
                    <div 
                        class="message-list__item message"
                        :class="getMessageClasses(message.sender)"
                    >
                        <p>{{ message.message }}</p>
                        <span class="message__time">{{ formatTime(message.timestamp) }}</span>
                    </div>
                </template>
            </UiScrollbar>
            <div class="support__bottom bottom">
                <InputField
                    tag="textarea"
                    placeholder="Type your message..."
                    class="bottom__input"
                    v-model="message"
                    @keydown="handleKeyDown"
                />
                <MainButton
                    :theme="themeType.primary"
                    @click="sendMessage"
                    :isDisable="!message.trim() || isLoading"
                    label="Send"
                    class="bottom__btn"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { iconType } from '~~/constants/icon.constants'
import { sizeType } from '~~/constants/size.constants'
import { themeType } from '~~/constants/theme.constants'
import { ref, onMounted, onBeforeUnmount, unref } from 'vue'

const supportDialog = useSupportDialog()

const message = ref('')
const messages = ref([])
const isLoading = ref(false)
const eventSource = ref(null)
const messagesContainer = ref(null)

const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }
}

const sendMessage = async () => {
    if (!message.value.trim()) return
    
    isLoading.value = true

    try {
        await $fetch('/api/support/messages', {
            method: 'POST',
            body: { message: message.value }
        })
        message.value = ''
    } catch (error) {
        console.error('Failed to send message:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    eventSource.value = new EventSource('/api/support/messages')

    unref(eventSource).onmessage = async (event) => {
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
        } finally {
            await nextTick()
            scrollToBottom()
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

const getMessageClasses = (sender) => ({
    'message--is-user': sender === 'user'
})

const formatTime = (timestamp, withoutTime) => {
    const date = new Date(timestamp)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return withoutTime ? `${day}.${month}.${year}` : `${time}`
}
const messagesList = computed(() => {
    const usedDates = []
    const getDay = (timestamp) => {
        const date = new Date(timestamp)
        if(usedDates.includes(formatTime(date, true))) {
            return
        }
        usedDates.push(formatTime(date, true))
        return formatTime(date, true)
    }
    return messages.value.map(message => {
        return {
            ...message,
            day: getDay(message.timestamp)
        }
    })
})
const scrollToBottom = async () => {
    await nextTick()

    if (messagesContainer.value) {
        const element = messagesContainer.value.$el || messagesContainer.value

        element.scrollTo({
            top: element.scrollHeight,
        })
    }
}
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
        width: 100%;
        padding: 15px;
        display: flex;
        flex-direction: column;

        @media (min-width: 567px) {
            width: 400px;
        }
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__messages {
        flex-grow: 1;
        margin-top: 10px;
        margin-bottom: 10px;
        overflow: auto;
        margin-right: 0;
    }

    &__item  {
        max-width: 70%;

        &:not(:last-child) {
            margin-bottom: 10px;
        }
    }
}
.message-list {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--separator-secondary);
    display: flex;
    flex-direction: column;

    &__day {
        margin-bottom: 20px;
        margin-top: 10px;
    }
    &__item {
        max-width: 70%;

        &:not(:last-child) {
            margin-bottom: 10px;
        }
    }
}
.message {
    background-color: var(--fill-tertiary);
    border-radius: 8px 0 8px 8px;
    color: var(--label-secondary);
    font-size: 14px;
    line-height: 1.4;
    padding: 6px 8px;
    margin-left: auto;

    &--is-user {
        background-color: var(--fill-secondary);
        border-radius: 0 8px 8px;
        color: var(--label-primary);
        text-align: left;
        margin-right: auto;
        margin-left: initial;
    }

    &__time {
        color: var(--label-tertiary);
        font-size: 12px;
        margin-top: 8px;
        display: block;
    }
}

.day {
    position: relative;
    display: flex;
    justify-content: center;
    justify-content: center;

    &__label {
        margin-left: auto;
        margin-right: auto;
        background-color: var(--fill-tertiary);
        border-radius: 8px;
        padding: 6px 8px;
        color: var(--label-primary);
    }
    &::before,
    &::after {
        content: '';
        position: absolute;
        left: 2%;
        right: 2%;
        height: 1px;
        border: dashed 1px var(--fill-tertiary);
    }
    &::before {
        bottom: calc(100% + 4px);
    }
    &::after {
        top: calc(100% + 4px);
    }
}


.bottom {
    display: flex;
    align-items: flex-end;

    &__btn {
        margin-left: 10px;
    }

    &__input {
        flex-grow: 1;
    }
}
</style>

