<template>
    <DialogWrapper :trackingTag="dialogTag">
        <div class="modal">
            <Subscription v-if="isStripFeatureEnable" />
            <BuyCredits v-else />
        </div>
    </DialogWrapper>
</template>

<script setup>
const { getters } = authStore;
const isStripFeatureEnable = computed(() => {
    return Boolean(unref(getters.user)?.isStripFeatureEnable);
});
const dialogTag = computed(() => {
    return unref(isStripFeatureEnable) ? 'subscription' : 'buy_credits';
});
</script>

<style lang="scss" scoped>
.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px
}
</style>