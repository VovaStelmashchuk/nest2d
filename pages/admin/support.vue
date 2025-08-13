<template>
    <div class="support">
        <AdminSupportChatList
            :class="{'support__chats--active': selectedUserId}"
            class="support__chats" 
            @select-chat="handleChatSelection"
        />
        <AdminSupportChat 
            v-if="selectedUserId"
            :key="selectedUserId"
            :userId="selectedUserId" 
            @back="handleBack"
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

const handleBack = () => {
    selectedUserId.value = null
}
</script>

<style lang="scss" scoped>
.support {
    display: flex;
    height: calc(100vh - 260px);
    min-height: 391px;

    @media (min-width: 568px) {
        height: calc(100vh - 280px);
    }
    &__chats {
        width: 100%;

        @media (min-width: 568px) {
            width: 200px;
        }
        @media (min-width: 1199px) {
            width: 400px;
        }

        &--active {
            display: none;

            @media (min-width: 568px) {
                display: block;
            }
        }
    }
    &__chat {
        width: 100%;

        @media (min-width: 568px) {
            width: initial;
            flex: 1 1 0;
            margin-left: 8px;
        }
    }
}

.placeholder {
    display: none;

    @media (min-width: 568px) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__text {
        border: 1px solid var(--separator-secondary);
        border-radius: 8px;
        padding: 15px;
        color: var(--label-primary);
    }
}
</style>