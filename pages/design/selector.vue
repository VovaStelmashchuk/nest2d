<template>
    <div class="design-page">
        <div class="design-page__container">
            <h1 class="design-page__title">SelectorField Component</h1>
            <p class="design-page__description">
                A dropdown selector component that matches the design system of MainButton and InputField.
            </p>

            <div class="design-page__section">
                <h2 class="design-page__section-title">Basic Usage</h2>
                <div class="design-page__demo">
                    <SelectorField v-model="basicValue" :options="basicOptions" />
                    <p class="design-page__output">Selected value: <strong>{{ basicValue }}</strong></p>
                </div>
            </div>

            <div class="design-page__section">
                <h2 class="design-page__section-title">With Label</h2>
                <div class="design-page__demo">
                    <SelectorField v-model="labelValue" label="Choose size:" :options="sizeOptions" />
                    <p class="design-page__output">Selected value: <strong>{{ labelValue }}</strong></p>
                </div>
            </div>

            <div class="design-page__section">
                <h2 class="design-page__section-title">Disabled State</h2>
                <div class="design-page__demo">
                    <SelectorField v-model="disabledValue" label="Status:" :options="statusOptions" :isDisable="true" />
                </div>
            </div>

            <div class="design-page__section">
                <h2 class="design-page__section-title">Multiple Selectors</h2>
                <div class="design-page__demo design-page__demo--grid">
                    <SelectorField v-model="colorValue" label="Color:" :options="colorOptions" />
                    <SelectorField v-model="shapeValue" label="Shape:" :options="shapeOptions" />
                    <SelectorField v-model="materialValue" label="Material:" :options="materialOptions" />
                </div>
                <p class="design-page__output">
                    Configuration: <strong>{{ colorValue }} {{ shapeValue }} ({{ materialValue }})</strong>
                </p>
            </div>

            <div class="design-page__section">
                <h2 class="design-page__section-title">Combined with Other Components</h2>
                <div class="design-page__demo design-page__demo--form">
                    <InputField v-model="nameValue" placeholder="Enter your name" />
                    <SelectorField v-model="countryValue" label="Country:" :options="countryOptions" />
                    <MainButton label="Submit" theme="primary" size="m" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const basicValue = ref('medium')
const labelValue = ref('m')
const disabledValue = ref('inactive')
const colorValue = ref('blue')
const shapeValue = ref('circle')
const materialValue = ref('wood')
const nameValue = ref('')
const countryValue = ref('us')

const basicOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' }
]

const sizeOptions = [
    { value: 's', label: 'S' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L' },
    { value: 'xl', label: 'XL' }
]

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
]

const colorOptions = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' }
]

const shapeOptions = [
    { value: 'circle', label: 'Circle' },
    { value: 'square', label: 'Square' },
    { value: 'triangle', label: 'Triangle' }
]

const materialOptions = [
    { value: 'wood', label: 'Wood' },
    { value: 'metal', label: 'Metal' },
    { value: 'plastic', label: 'Plastic' },
    { value: 'glass', label: 'Glass' }
]

const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
]
</script>

<style lang="scss" scoped>
.design-page {
    min-height: 100vh;
    background-color: var(--background-primary);
    padding: 40px 20px;

    &__container {
        max-width: 800px;
        margin: 0 auto;
    }

    &__title {
        font-size: 32px;
        font-weight: 700;
        color: var(--label-primary);
        margin-bottom: 12px;
    }

    &__description {
        font-size: 16px;
        color: var(--label-secondary);
        margin-bottom: 40px;
        line-height: 1.5;
    }

    &__section {
        margin-bottom: 48px;
    }

    &__section-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--label-primary);
        margin-bottom: 16px;
    }

    &__demo {
        background-color: var(--fill-tertiary);
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 12px;

        &--grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        &--form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 400px;
        }
    }

    &__output {
        font-size: 14px;
        color: var(--label-secondary);
        margin-top: 12px;

        strong {
            color: var(--accent-primary);
            font-weight: 600;
        }
    }
}
</style>
