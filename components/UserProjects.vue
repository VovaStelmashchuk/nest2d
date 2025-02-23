<template>
    <div class="prodjects">
        <MainTitle
            label="Projects"
            :btnLabel="btnLabelValue"
            @btnClick="createNewProdject"
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
const route = useRoute();
const router = useRouter();

const createNewProdject = () => router.push({ name: 'home' })
const btnLabelValue = computed(() => route.name === 'home' ? '' : 'New project') 

const { data } = useFetch("/api/project/me", {
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