<template>
    <div class="page-admin-support">
        <AdminSupportChatList @select-chat="handleChatSelection" />
        <AdminSupportChat v-if="selectedUserId" :userId="selectedUserId" />
        <div v-else class="no-chat-selected">
            <p>Select a chat from the list to start messaging</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
    layout: "profile",
    middleware: "auth",
});

const selectedUserId = ref(null)

const handleChatSelection = (userId) => {
    selectedUserId.value = userId
}
</script>

<style lang="scss" scoped>
.page-admin-support {
    display: flex;
    flex-direction: row;
    height: 100vh;
    min-height: 400px;
    max-width: 1200px;
    margin: 0 auto;
    background: var(--background-primary);
}

.page-admin-support> :first-child {
    width: 400px;
    min-width: 400px;
    max-width: 400px;
    border-right: 1px solid #eee;
    height: 100%;
    overflow-y: auto;
}

.page-admin-support> :last-child {
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
}

.no-chat-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
    font-style: italic;
    text-align: center;
}
</style>