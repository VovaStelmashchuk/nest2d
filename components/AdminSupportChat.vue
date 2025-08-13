<template>
    <div class="chat">
        <div class="chat__header header">
            <MainTitle label="Support Chat" class="header__title" />
            <span class="header__id">User ID: {{ userId }}</span>
        </div>
        <UiScrollbar ref="messagesContainer" class="chat__messages messages">
            <div v-if="loading" class="chat__loading loading">
                <MainLoader :size="sizeType.l" class="loading__loader" />
                <p>Loading messages...</p>
            </div>
            <div v-else-if="messages.length === 0" class="chat__empty empty">
                <p class="empty__text">No messages yet. Start the conversation!</p>
            </div>
            <div 
                class="message-list" 
                v-else
            >
                <div v-for="message in messages" :key="message._id"
                    class="message-list__item message"
                    :class="[message.sender === 'support' ? '' : 'message--is-user']"
                >
                    <p>{{ message.message }}</p>
                    <span class="message__time">{{ formatTime(message.timestamp) }}</span>
                </div>
            </div>
        </UiScrollbar>
        <div class="chat__footer footer">
            <MainButton
                :theme="themeType.primary"
                :icon="iconType.arrowPrev"
                :isLabelShow="false"
                @click="$emit('back')"
                label="Send" 
                class="footer__back" 
            />
            <InputField tag="textarea" placeholder="Type your message..." class="footer__input" v-model="newMessage"
                @keydown="handleKeyDown" :isDisable="!isConnected" />
            <MainButton :theme="themeType.primary" :isDisable="!newMessage.trim() || !isConnected" @click="sendMessage"
                label="Send" class="footer__btn" />
        </div>

        <div v-if="error" class="error-message">
            <p>{{ error }}</p>
            <button @click="connectToChat">Retry</button>
        </div>
    </div>
</template>

<script setup>
import { themeType } from '~~/constants/theme.constants'
import { iconType } from '~~/constants/icon.constants';
import { sizeType } from "~~/constants/size.constants"
import { nextTick } from 'vue';

const props = defineProps({
    userId: {
        type: String,
        required: true,
    },
});

const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const error = ref(null)
const isConnected = ref(false)
const messagesContainer = ref(null)
let eventSource = null

const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            return 
        } else {
            event.preventDefault()
            sendMessage()
        }
    }
}

const connectToChat = () => {
    try {
        loading.value = true
        error.value = null
        isConnected.value = false
        messages.value = []

        eventSource = new EventSource(`/api/support/admin/${props.userId}`)

        eventSource.onopen = () => {
            isConnected.value = true
        }

        eventSource.onmessage = async (event) => {
            const data = JSON.parse(event.data)
            switch (data.type) {
                case 'initial':
                    messages.value = data.data
                    loading.value = false
                    await nextTick()
                    scrollToBottom()
                    break
                case 'newMessages':
                    messages.value.push(...data.data)
                    await nextTick()
                    scrollToBottom()
                    break
                case 'heartbeat':
                    break
            }
        }

        eventSource.onerror = (error) => {
            console.error('EventSource error:', error)
            isConnected.value = false
            error.value = 'Connection failed. Please try again.'
            loading.value = false
        }
    } catch (err) {
        console.error('Error connecting to chat:', err)
        error.value = 'Failed to connect to chat'
        loading.value = false
    }

    scrollToBottom()
}

const sendMessage = async () => {
    if (!newMessage.value.trim() || !isConnected.value) return

    try {
        const messageData = {
            message: newMessage.value,
        }

        await $fetch(`/api/support/admin/${props.userId}`, {
            method: 'POST',
            body: messageData
        })

        newMessage.value = ''

        await nextTick()
        scrollToBottom()
    } catch (error) {
        console.error('Error sending message:', error)
        error.value = 'Failed to send message'
    }
}

const scrollToBottom = async () => {
    await nextTick()

    if (messagesContainer.value) {
        const element = messagesContainer.value.$el || messagesContainer.value

        element.scrollTo({
            top: element.scrollHeight,
        })
    }
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
    if (props.userId) {
        connectToChat()
    }
})

onUnmounted(() => {
    if (eventSource) {
        eventSource.close()
    }
})
</script>

<style lang="scss" scoped>
.chat {
    display: flex;
    flex-direction: column;

    &__header {
        margin-bottom: 16px;
    }

    &__footer {
        margin-top: 16px;
    }

    &__empty,
    &__messages {
        width: 100%;
        height: 100%;
    }

    &__loading {
        width: 100%;
        height: 100%;
    }
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;

    &__id {
        color: var(--label-primary);
    }
    &__title {
        margin-right: 20px;
    }
}

.message-list {
    display: flex;
    flex-direction: column;

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

.loading {
    flex-direction: column;
    text-align: center;
    display: flex;
    padding: 16px;
    justify-content: center;
    align-items: center;
    color: var(--label-secondary);

    &__loader {
        margin-bottom: 60px;
    }
}

.empty {
    text-align: center;
    display: flex;
    padding: 16px;
    justify-content: center;
    align-items: center;
    color: var(--label-secondary);
}

.footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    &__input {
        flex: 1;
    }

    &__btn {
        margin-left: 10px;
    }

    &__back {
        margin-right: 10px;

        @media (min-width: 567px) {
            display: none;
        }
    }
}
</style>