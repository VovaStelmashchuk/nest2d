<template>
    <div class="prodjects">
        <MainTitle
            label="Projects"
            btnLabel="New project"
            @btnClick="console.log('new project')"
            class="prodjects__title"
        />
        <UserProjectItem
            v-for="project in data.projects"
            :key="project.slug"
            :project="project"
            class="prodjects__item"
        />
	</div>
</template>

<script setup>
const { data, pending, error } = await useFetch("/api/project/me", {
  credentials: "include",
});
</script>
<style lang="scss" scoped>
.prodjects {
    &__title {
        margin-bottom: 16px;
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }
}
</style>