<template>
    <div class="support">
        <AdminSupportChatList 
            class="support__chats" 
            @select-chat="handleChatSelection"
        />
        <AdminSupportChat 
            v-if="selectedUserId" 
            :userId="selectedUserId" 
            class="support__chat" 
        />
        <div 
            v-else
            class="support__chat placeholder"
        >
            <p class="placeholder__text">Select a chat from the list to start messaging</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
    layout: "support",
    middleware: "auth",
});

const selectedUserId = ref(null)

const handleChatSelection = (userId) => {
    selectedUserId.value = userId
}
</script>

<style lang="scss" scoped>
.support {
    display: flex;
    height: calc(100vh - 280px);
    
    &__chats {
        width: 400px;
        overflow-y: auto;
    }
    &__chat {
        flex: 1 1 0;
        width: 100%;
        overflow-y: auto;
    }
}

.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;

    &__text {
        border: 1px solid var(--separator-secondary);
        border-radius: 8px;
        padding: 15px;
        color: var(--label-primary);
    }
}
</style>