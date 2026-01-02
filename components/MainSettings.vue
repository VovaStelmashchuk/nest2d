<template>
    <div class="settings">
        <MainTitle label="Nesting settings" class="settings__title" />
        <div class="settings__content content">
            <div class="content__size size">
                <div class="size__line">
                    <InputField prefix="W" suffix="mm" v-model="localWidth" class="size__input" />
                    <InputField prefix="H" suffix="mm" v-model="localHeight" class="size__input" />
                </div>
                <InputField prefix="Spacing" suffix="mm" v-model="localSpace" class="size__input" />
                <InputField prefix="Sheet Count" suffix="units" v-model="localSheetCount" class="size__input" />
                <label class="size__checkbox">
                    <input type="checkbox" v-model="localAddOutShape">
                    Add out shape
                </label>
            </div>
        </div>
    </div>
</template>

<script setup>
const { getters, actions } = filesStore;
const { updateParams } = actions;
const params = computed(() => getters.params);

const localWidth = computed({
    get: () => unref(params).widthPlate,
    set: value => updateParams({ widthPlate: value }),
});

const localHeight = computed({
    get: () => unref(params).heightPlate,
    set: value => updateParams({ heightPlate: value }),
});

const localSheetCount = computed({
    get: () => unref(params).sheetCount,
    set: value => updateParams({ sheetCount: value })
});

const localSpace = computed({
    get: () => unref(params).space,
    set: value => updateParams({ space: value }),
});

const localAddOutShape = computed({
    get: () => unref(params).addOutShape,
    set: value => updateParams({ addOutShape: value }),
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

}

.content {
    display: flex;
    justify-content: center;

    &__size {
        width: 221px;
    }
}

.size {
    &>*:not(:last-child) {
        margin-bottom: 8px;
    }

    &__line {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    &__input {
        flex-grow: 1;
        min-width: 80px;
    }

    &__checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--label-primary);
        cursor: pointer;
        padding: 0 12px;

        input {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }
    }
}
</style>
