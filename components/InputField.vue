<template>
    <label 
        :class="inputClasses"
        class="input"
    >
        <span v-if="prefix" class="input__prefix">
            {{ prefix }}
        </span>
        <component
            :is="tag"
            ref="inputElement"
            :type="type"
            :placeholder="placeholder"
            :value="modelValue"
            @input="handleInput"
            @keydown="$emit('keydown', $event)"
            class="input__value"
        />
        <span v-if="suffix" class="input__suffix">
            {{ suffix }}
        </span>
    </label>
</template>

<script setup>

const inputElement = ref(null)

const { isDisable, tag, modelValue } = defineProps({
    prefix: { 
        type: String, 
        default: "" 
    },
    suffix: { 
        type: String, 
        default: "" 
    },
    modelValue: { 
        type: [String, Number], 
        required: true 
    },
    type: { 
        type: String, 
        default: "text" 
    },
    placeholder: { 
        type: String, 
        default: "" 
    },
    isDisable: {
        type: Boolean,
        default: false
    },
    tag: {
        type: String,
        default: "input"
    }
});

const emit = defineEmits(['update:modelValue', 'keydown'])

const handleInput = (event) => {
    emit('update:modelValue', event.target.value)
}

const autoResize = (element) => {
    element.style.height = '14.39px'

    if (element.scrollHeight > 14.39) {
        element.style.height = element.scrollHeight + 'px'
    }
}

watch(() => modelValue, async () => {
    if (tag === 'textarea') {
        await nextTick()
        if (inputElement.value) {
            autoResize(inputElement.value)
        }
    }
})

const inputClasses = computed(() => ({
    'input--disable': isDisable
}))
</script>
<style lang="scss" scoped>
.input {
    $self: &;
    border-radius: 6px;
    background-color: var(--fill-tertiary);
    padding: 10px 12px;
    display: flex;
    align-items: center;
    font-weight: 500;
    border: 2px solid transparent;
    transition: border-color 0.3s, background-color 0.3s;
    &__prefix,
    &__suffix {
        color: var(--label-secondary);
        flex-shrink: 0;
    }
    &__prefix {
        margin-right: 8px;
    }
    &__suffix {
        margin-left: 8px;
    }
    &__value {
        color: var(--accent-primary);
        flex-grow: 1;
        background-color: transparent;
        outline: none;
        min-width: 26px;
        resize: none; 
        overflow: hidden; 
        line-height: 1.4;

        &:is(textarea) {
            min-height: 14.39px;
            height: 14.39px; 
            line-height: 1.2;
        }
    }

    &__value,
    &__suffix,
    &__prefix {
        transition: opacity 0.3s;   
    }

    @media (hover:hover) {
        &:hover {
            background-color: var(--fill-secondary);
        }
    }

    &:focus-within {
        border-color: var(--accent-primary);
    }

    &--disable {
        pointer-events: none;

        #{$self}__value,
        #{$self}__suffix,
        #{$self}__prefix {
            opacity: 0.3;
        }
    }
}
</style>