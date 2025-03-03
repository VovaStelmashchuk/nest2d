<template>
    <article class="max-w-4xl mx-auto p-6 bg-gray-50 text-gray-800 shadow-lg rounded-lg">
        <h2 class="text-4xl font-bold text-gray-900">
            {{ post.title }}
        </h2>
        <p class="text-sm text-gray-500">
            Published on
            <time :datetime="post.datetime">
                {{ date }}
            </time>
            by 
            {{ author }}
        </p>
        <div 
            v-for="(section, sectionIndex) in post.sections" 
            :key="sectionIndex" 
            class="space-y-2"
        >
            <h3 
                v-if="section.title"
                class="text-2xl font-semibold text-gray-900"
            >
                {{ section.title }}
            </h3>
            <ul
                v-if="Array.isArray(section.content)"
                class="list-disc pl-6"
            >
                <li 
                    v-for="(item, itemIndex) in section.content"
                    :key="itemIndex"
                >
                    {{ item }}
                </li>
            </ul>
            <p v-else>
                {{ section.content }}
            </p>
        </div>
    </article>
</template>

<script setup>
const { post } = defineProps({
    post: {
        type: Object,
        required: true
    },
});

const author = computed(() => {
    return unref(post)?.author ? unref(post)?.author : 'nest2d'
})
const date = computed(() => {
    const datetime = unref(post)?.datetime;

    if (!datetime) {
        return 'Invalid Date';
    }

    const newValue = new Date(datetime);

    if (!(newValue instanceof Date) || isNaN(newValue)) {
        return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }).format(newValue);
})
</script>
