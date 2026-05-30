<template>
    <div class="settings">
        <MainTitle label="Nesting settings" class="settings__title" />
        <div class="settings__content content">
            <div class="content__size size">
                <InputField prefix="H" suffix="mm" v-model="localHeight" :isError="isHeightTooSmall"
                    class="size__input" />
            </div>
        </div>
        <p
            v-if="requiredHeight != null"
            :class="{ 'settings__hint--error': isHeightTooSmall }"
            class="settings__hint"
        >
            Required height: at least {{ requiredHeight }}mm (5% above the tallest selected part).
        </p>
    </div>
</template>

<script setup>
const { getters, actions } = stripStore;
const { updateParams } = actions;
const params = computed(() => getters.params);
const isHeightTooSmall = computed(() => getters.isHeightTooSmall);
const requiredHeight = computed(() => {
    const value = unref(getters.requiredHeight);
    if (value == null) {
        return null;
    }
    return Math.round(value * 100) / 100;
});

const localHeight = computed({
    get: () => unref(params).height,
    set: value => updateParams({ height: value }),
});
</script>

<style lang="scss" scoped>
.settings {
    text-align: center;

    &__title {
        margin-bottom: 16px;
    }

    &__content {
        width: 320px;
        margin-left: auto;
        margin-right: auto;
    }

    &__hint {
        margin-top: 8px;
        font-size: 12px;
        color: var(--label-tertiary);

        &--error {
            color: rgb(222, 0, 54);
        }
    }
}

.content {
    display: flex;
    justify-content: center;

    &__size {
        width: 221px;
    }
}

.size {
    &__input {
        flex-grow: 1;
        min-width: 80px;
    }
}
</style>
