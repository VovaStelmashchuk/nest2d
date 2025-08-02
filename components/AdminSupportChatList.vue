<template>
    <div class="admin-chat-list">
        <div class="header">
            <h1>Support Chat List</h1>
            <div class="status" :class="{ connected: isConnected }">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
            </div>
        </div>

        <div class="chat-list" v-if="chatList.length > 0">
            <div v-for="chat in chatList" :key="chat.userId" class="chat-item"
                :class="{ active: selectedUserId === chat.userId }" @click="selectChat(chat.userId)">
                <div class="user-info">
                    <div class="user-avatar">
                        {{ chat.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                    <div class="user-details">
                        <div class="user-name">{{ chat.user?.name || 'Unknown User' }}</div>
                        <div class="user-id">ID: {{ chat.userId }}</div>
                    </div>
                </div>
                <div class="last-message">
                    <div class="message-text">{{ chat.lastMessage }}</div>
                    <div class="message-time">{{ formatTime(chat.timestamp) }}</div>
                </div>
            </div>
        </div>

        <div v-else-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading chat list...</p>
        </div>

        <div v-else class="empty-state">
            <p>No support chats found</p>
        </div>

        <div v-if="error" class="error">
            <p>{{ error }}</p>
            <button @click="connectToChatList">Retry</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const chatList = ref([])
const loading = ref(true)
const error = ref(null)
const isConnected = ref(false)
const selectedUserId = ref(null)
let eventSource = null

const emit = defineEmits(['select-chat'])

const connectToChatList = () => {
    try {
        loading.value = true
        error.value = null
        isConnected.value = false

        eventSource = new EventSource('/api/support/admin/chatlist')

        eventSource.onopen = () => {
            isConnected.value = true
            loading.value = false
        }

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data)

            switch (data.type) {
                case 'initial':
                    chatList.value = data.data
                    loading.value = false
                    break
                case 'update':
                    chatList.value = data.data
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
        console.error('Error connecting to chat list:', err)
        error.value = 'Failed to connect to chat list'
        loading.value = false
    }
}

const selectChat = (userId) => {
    selectedUserId.value = userId
    emit('select-chat', userId)
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
        return 'Just now'
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
    } else {
        return date.toLocaleDateString()
    }
}

onMounted(() => {
    connectToChatList()
})

onUnmounted(() => {
    if (eventSource) {
        eventSource.close()
    }
})
</script>

<style lang="scss" scoped>
.admin-chat-list {
    max-width: 400px;
    border-right: 1px solid #e2e8f0;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
}

.status {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #ef4444;
    color: white;

    &.connected {
        background: #10b981;
    }
}

.chat-list {
    flex: 1;
    overflow-y: auto;
}

.chat-item {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: #f8fafc;
    }

    &.active {
        background: #dbeafe;
        border-left: 3px solid #3b82f6;
    }
}

.user-info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    margin-right: 12px;
}

.user-details {
    flex: 1;
}

.user-name {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
}

.user-id {
    font-size: 12px;
    color: #64748b;
}

.last-message {
    margin-left: 52px;
}

.message-text {
    color: #475569;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.message-time {
    font-size: 11px;
    color: #94a3b8;
}

.loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-style: italic;
}

.error {
    padding: 20px;
    text-align: center;
    color: #ef4444;

    button {
        margin-top: 12px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;

        &:hover {
            background: #2563eb;
        }
    }
}
</style>