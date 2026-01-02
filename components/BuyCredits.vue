<template>
    <div class="modal">
        <MainTitle label="Buy Credits" class="modal__title" />
        <UserBalance class="modal__balance" />
        <div class="buy-credits__options">
            <div v-for="option in data?.options" :key="option.stripePriceId" class="buy-credits__option">
                <div class="buy-credits__info">
                    <div class="buy-credits__title">{{ option.title }}</div>
                    <div class="buy-credits__desc">{{ option.description }}</div>
                    <div class="buy-credits__credit">Credits: <b>{{ option.credit }}</b></div>
                </div>
                <MainButton :label="'Go'" :theme="themeType.primary" :size="sizeType.m" class="buy-credits__buy-btn"
                    @click="buy(option)" />
            </div>
        </div>

        <div class="buy-credits__notes">
            <div class="buy-credits__note">
                ✨ Pay as you go. <b>No subscription.</b>
            </div>
            <div class="buy-credits__note">
                🛡️ 14-day money-back guarantee. No questions asked.
            </div>
        </div>
    </div>
</template>

<script setup>
import MainButton from './MainButton.vue'
import MainTitle from './MainTitle.vue'
import { themeType } from '~~/constants/theme.constants'
import { sizeType } from '~~/constants/size.constants'

const props = defineProps({
    isModalOpen: {
        type: Boolean,
        default: false,
    },
})
const emit = defineEmits(['update:isModalOpen'])

const { data } = await useFetch('/api/payment/options')

const buy = async (option) => {
    const response = await $fetch(`/api/payment/paywalllink?stripePriceId=${option.stripePriceId}`)
    navigateTo(response.url, { external: true })
}
</script>

<style lang="scss" scoped>
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
}

.buy-credits__options {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 18px;
    min-width: 320px;
    max-width: 420px;
}

.buy-credits__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 16px;
    border-radius: 8px;
    background: var(--fill-tertiary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.buy-credits__info {
    flex: 1;
    min-width: 0;
}

.buy-credits__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--label-primary);
    margin-bottom: 4px;
}

.buy-credits__desc {
    font-size: 13px;
    color: var(--label-secondary);
    margin-bottom: 6px;
}

.buy-credits__credit {
    font-size: 13px;
    color: var(--accent-primary);
    margin-bottom: 0;
}

.buy-credits__buy-btn {
    margin-left: 18px;
    min-width: 90px;
}

.modal__balance {
    margin-bottom: 18px;
}

.buy-credits__notes {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.buy-credits__note {
    font-size: 13px;
    color: var(--label-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
}
</style>
