<template>
    <div class="chats">
        <div class="chats__header header">
            <MainTitle
                label="Support Chat List"
                class="header__title"
            />
            <MainButton 
                :label="isConnected ? 'Connected' : 'Disconnected'"
                tag="div"
                isNotClickable
                :theme="themeType.primary"
            />
        </div>
        <UiScrollbar class="chats__scrollbar">
            <div class="chats__list" v-if="chatList.length > 0">
                <div
                    v-for="chat in chatList" 
                    :key="chat.userId" 
                    class="chats__item chats-item"
                    :class="{ active: selectedUserId === chat.userId }" 
                    @click="selectChat(chat.userId)"
                >
                    <div class="user">
                        <div class="user__avatar">
                            {{ chat.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                        </div>
                        <div class="user__details">
                            <div class="user__name">{{ chat.user?.name || 'Unknown User' }}</div>
                            <div class="user__id">ID: {{ chat.userId }}</div>
                        </div>
                    </div>
                    <div class="chats-item__message message">
                        <div class="message__text">{{ chat.lastMessage }}</div>
                    </div>
                </div>
            </div> 
            <div v-else-if="loading" class="chats__loading loading">
                <MainLoader
                    :size="sizeType.l"
                    class="loading__loader"
                />
                <p class="loading__text">Loading chat list...</p>
            </div>
            <div v-else class="chats__empty empty">
                <p class="empty__text">No support chats found</p>
            </div>
            <div v-if="error" class="chats__error error">
                <p class="error__text">1231{{ error }}</p>
                <MainButton 
                    label="Retry"
                    tag="button"
                    :theme="themeType.primary"
                    class="error__btn"
                    @click="connectToChatList"
                />
            </div>
        </UiScrollbar>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { sizeType } from "~~/constants/size.constants"
import { themeType } from '~~/constants/theme.constants'

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
.chats {
    display: flex;
    flex-direction: column;

    &__header {
        margin-bottom: 16px;
    }

    &__scrollbar {
        width: 100%;
        height: 100%;
    }

    &__empty,
    &__loading,
    &__error {
        width: 100%;
        height: 100%;  
    }

    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 13px;
}

.chats-item {
    border-radius: 8px;
    color: var(--label-tertiary);
    padding: 16px;
    position: relative;
    transition: color .3s;
    cursor: pointer;

    &:after {
        border: 1px solid var(--separator-secondary);
        border-radius: 8px;
        bottom: 0;
        content: "";
        left: 0;
        pointer-events: none;
        position: absolute;
        right: 0;
        top: 0;
        transition: border-color .3s;
    }

    &:hover:after {
        border-color: var(--separator-primary);
    }

    &.active {
        pointer-events: none;

        &:after {
            border-width: 2px;
            border-color: var(--accent-primary);
        }
    }

    &__message {
        margin-top: 16px;
    }
}

.user {
    display: flex;
    align-items: center;

    &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--accent-primary);
        color: var(--background-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-right: 24px;
    }

    &__details {
        flex: 1;
    }

    &__name {    
        font-weight: 500;
        color: var(--label-secondary);
        margin-bottom: 8px;
    }

    &__id {     
        font-size: 12px;
        color: var(--label-tertiary);
    }
}

.message {
    &__text {
        font-weight: 500;
        color: var(--label-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.empty {
    text-align: center;
    display: flex;
    padding: 16px;
    justify-content: center;
    align-items: center;
}
.loading  {
    flex-direction: column;
    text-align: center;
    display: flex;
    padding: 16px;
    justify-content: center;
    align-items: center;

    &__loader {
        margin-bottom: 60px;
    }
}
.error {
    flex-direction: column;
    text-align: center;
    display: flex;
    padding: 16px;
    justify-content: center;
    align-items: center;

    &__text {
        color: #ef4444;
        margin-bottom: 40px;
    }
}
</style>