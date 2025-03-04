<template>
    <div class="prodjects">
        <MainTitle
            label="Projects"
            :btnLabel="btnLabelValue"
            @btnClick="createNewProdject"
            class="prodjects__title"
        />
        <UiScrollbar 
            v-if="projectsList.length" 
            class="prodjects__scrollbar"
        >
            <UserProjectItem
                v-for="project in projectsList"
                :key="project.slug"
                :project="project"
                class="prodjects__item"
            />
        </UiScrollbar>
        <p v-else class="prodjects__text">
            Your prodjects will be here
        </p> 
	</div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();

const { getters, actions } = globalStore;
const { setProjects } = actions;
const projectsList = computed(() => getters.projectsList);

const createNewProdject = () => router.push({ name: 'home' })
const btnLabelValue = computed(() => {
    return route.name === 'home' ? '' : 'New project'
}) 
onBeforeMount(() => {
    setProjects();
})
</script>
    
<style lang="scss" scoped>
.prodjects {
    &__text {
        color: var(--label-tertiary);
    }
    &__title {
        margin-bottom: 16px;
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }
    &__scrollbar {
        max-height: 600px;
    }
}
</style>