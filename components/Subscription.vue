<template>
    <div class="subscription">
        <MainTitle label="Subscription" class="subscription__title" />

        <div v-if="isActive" class="subscription__card">
            <div class="subscription__status">
                <span class="subscription__badge">{{ statusLabel }}</span>
            </div>
            <p class="subscription__desc">
                You have unlimited nesting while your subscription is active.
            </p>
        </div>

        <div v-else class="subscription__card">
            <div v-if="data?.plan" class="subscription__plan">
                <div class="subscription__plan-title">{{ data.plan.title || 'Monthly plan' }}</div>
                <div class="subscription__price">
                    {{ formatPrice(data.plan.amount, data.plan.currency) }}
                    <span class="subscription__interval">/ {{ data.plan.interval }}</span>
                </div>
                <div class="subscription__free">
                    {{ data.freeRemaining }} free nesting operation{{ data.freeRemaining === 1 ? '' : 's' }} left
                </div>
                <MainButton
                    :label="`Start ${data.plan.trialDays}-day free trial`"
                    :theme="themeType.primary"
                    :size="sizeType.m"
                    :isDisable="isLoading"
                    trackingTag="subscription_start_trial"
                    class="subscription__btn"
                    @click="subscribe"
                />
                <p class="subscription__note">
                    🛡️ Cancel anytime during the trial and you won't be charged.
                </p>
            </div>
            <div v-else class="subscription__desc">
                The subscription plan is currently unavailable. Please try again later.
            </div>
        </div>

        <div v-if="error" class="subscription__error">{{ error }}</div>
    </div>
</template>

<script setup>
import MainButton from './MainButton.vue'
import MainTitle from './MainTitle.vue'
import { themeType } from '~~/constants/theme.constants'
import { sizeType } from '~~/constants/size.constants'

const { data } = await useFetch('/api/payment/subscription')

const isLoading = ref(false)
const error = ref('')

const isActive = computed(() => {
    const status = unref(data)?.subscriptionStatus
    return status === 'active' || status === 'trialing'
})

const statusLabel = computed(() => {
    const status = unref(data)?.subscriptionStatus
    if (status === 'trialing') return 'Free trial active'
    if (status === 'active') return 'Active'
    return status || ''
})

const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

const subscribe = async () => {
    if (isLoading.value) return
    error.value = ''
    isLoading.value = true
    try {
        const response = await $fetch('/api/payment/subscribe')
        navigateTo(response.url, { external: true })
    } catch (err) {
        error.value = err?.data?.statusMessage || 'Failed to start subscription. Please try again.'
        isLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.subscription {
    display: flex;
    flex-direction: column;
    align-items: center;

    &__title {
        margin-bottom: 18px;
    }

    &__card {
        min-width: 320px;
        max-width: 420px;
        padding: 24px 20px;
        border-radius: 8px;
        background: var(--fill-tertiary);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
        text-align: center;
    }

    &__badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        color: var(--background-primary);
        background-color: var(--accent-primary);
    }

    &__desc {
        margin-top: 12px;
        font-size: 14px;
        color: var(--label-secondary);
    }

    &__plan-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--label-primary);
        margin-bottom: 6px;
    }

    &__price {
        font-size: 28px;
        font-weight: 800;
        color: var(--label-primary);
    }

    &__interval {
        font-size: 14px;
        font-weight: 500;
        color: var(--label-secondary);
    }

    &__free {
        margin: 12px 0 18px;
        font-size: 13px;
        color: var(--accent-primary);
    }

    // Override MainButton's default `width: max-content` so the trial button
    // stretches to the full width of the card. The descendant selector raises
    // specificity enough to win against the child component's own scoped rule.
    &__card &__btn {
        width: 100%;
    }

    &__note {
        margin-top: 14px;
        font-size: 13px;
        color: var(--label-secondary);
    }

    &__error {
        margin-top: 16px;
        padding: 12px;
        border-radius: 8px;
        color: rgb(222, 0, 54);
    }
}
</style>
