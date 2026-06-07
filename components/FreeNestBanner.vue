<template>
    <div v-if="show" class="free-nest" :class="{ 'free-nest--empty': isEmpty }">
        <template v-if="isEmpty">
            <span class="free-nest__text">You've used all free nesting operations.</span>
            <button type="button" class="free-nest__link" @click="openPaywall">
                Start free trial
            </button>
        </template>
        <template v-else>
            <span class="free-nest__text">
                {{ freeRemaining }} free nesting operation{{ freeRemaining === 1 ? '' : 's' }} left
            </span>
        </template>
    </div>
</template>

<script setup>
const { getters } = authStore;

const user = computed(() => unref(getters.user) || {});

const isSubscribed = computed(() => {
    const status = user.value.subscriptionStatus;
    return status === 'active' || status === 'trialing';
});

const freeRemaining = computed(() => Number(user.value.freeRemaining || 0));

// Only relevant for feature-flagged users who are not yet subscribed.
const show = computed(() =>
    Boolean(user.value.isStripFeatureEnable) && !isSubscribed.value
);

const isEmpty = computed(() => freeRemaining.value <= 0);

const buyCreditsDialog = useBuyCreditsDialog();
const openPaywall = () => {
    buyCreditsDialog.value = true;
};
</script>

<style lang="scss" scoped>
.free-nest {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--label-secondary);

    &--empty {
        color: var(--accent-primary);
    }

    &__link {
        font-weight: 700;
        color: var(--accent-primary);
        text-decoration: underline;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        font-size: 13px;
    }
}
</style>
