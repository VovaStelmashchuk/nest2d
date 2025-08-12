<template>
    <div class="admin-support-chat">
        <div class="chat-header">
            <h3>Support Chat</h3>
            <span class="user-id">User ID: {{ userId }}</span>
            <div class="status" :class="{ connected: isConnected }">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
            </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
            <div v-if="loading" class="loading-messages">
                <div class="spinner"></div>
                <p>Loading messages...</p>
            </div>

            <div v-else-if="messages.length === 0" class="empty-messages">
                <p>No messages yet. Start the conversation!</p>
            </div>

            <div v-else>
                <div v-for="message in messages" :key="message._id"
                    :class="['message', message.sender === 'admin' ? 'admin-message' : 'user-message']">
                    <div class="message-content">
                        <p>{{ message.message }}</p>
                        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="chat-input">
            <textarea v-model="newMessage" @keydown.enter.prevent="sendMessage" placeholder="Type your message..."
                rows="3" :disabled="!isConnected"></textarea>
            <button @click="sendMessage" :disabled="!newMessage.trim() || !isConnected">
                Send
            </button>
        </div>

        <div v-if="error" class="error-message">
            <p>{{ error }}</p>
            <button @click="connectToChat">Retry</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

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

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data)

            switch (data.type) {
                case 'initial':
                    messages.value = data.data
                    loading.value = false
                    scrollToBottom()
                    break
                case 'newMessages':
                    messages.value.push(...data.data)
                    scrollToBottom()
                    break
                case 'heartbeat':
                    // Connection is alive
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
}

const sendMessage = async () => {
    if (!newMessage.value.trim() || !isConnected.value) return

    try {
        const messageData = {
            message: newMessage.value,
            userId: props.userId,
            sender: 'admin',
            timestamp: new Date()
        }

        // Send message to API
        await $fetch('/api/support/messages', {
            method: 'POST',
            body: messageData
        })

        // Add message to local state
        messages.value.push({
            _id: Date.now().toString(),
            ...messageData
        })

        newMessage.value = ''
        scrollToBottom()
    } catch (error) {
        console.error('Error sending message:', error)
        error.value = 'Failed to send message'
    }
}

const scrollToBottom = () => {
    setTimeout(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    }, 100)
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Watch for userId changes and reconnect
watch(() => props.userId, (newUserId) => {
    if (newUserId) {
        if (eventSource) {
            eventSource.close()
        }
        connectToChat()
    }
})

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

<style scoped>
.admin-support-chat {
    display: flex;
    flex-direction: column;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
}

.chat-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}

.user-id {
    font-size: 14px;
    color: #64748b;
}

.status {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #ef4444;
    color: white;
}

.status.connected {
    background: #10b981;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.loading-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.empty-messages {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
    font-style: italic;
}

.message {
    display: flex;
    margin-bottom: 8px;
}

.admin-message {
    justify-content: flex-end;
}

.user-message {
    justify-content: flex-start;
}

.message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 12px;
    position: relative;
}

.admin-message .message-content {
    background: #3b82f6;
    color: white;
    border-bottom-right-radius: 4px;
}

.user-message .message-content {
    background: #f1f5f9;
    color: #1e293b;
    border-bottom-left-radius: 4px;
}

.message-content p {
    margin: 0;
    line-height: 1.4;
    word-wrap: break-word;
}

.message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
    display: block;
}

.chat-input {
    padding: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

.chat-input textarea {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px 12px;
    resize: none;
    font-family: inherit;
    font-size: 14px;
}

.chat-input textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chat-input textarea:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
}

.chat-input button {
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.chat-input button:hover:not(:disabled) {
    background: #2563eb;
}

.chat-input button:disabled {
    background: #94a3b8;
    cursor: not-allowed;
}

.error-message {
    padding: 16px;
    text-align: center;
    color: #ef4444;
    border-top: 1px solid #e2e8f0;
}

.error-message button {
    margin-top: 8px;
    padding: 6px 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.error-message button:hover {
    background: #2563eb;
}
</style>