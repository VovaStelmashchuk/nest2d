<template>
    <div class="space-y-8 text-gray-800">
        <BlogEntry
            v-for="(post, postIndex) in posts"
            :key="postIndex"
            :post="post"
        />
    </div>
</template>

<script setup>
import { posts } from "~~/data/blog";

definePageMeta({
    layout: "doc",
});
</script>
