<template>
    <MainAside 
        label="Projects"
        :btnLabel="btnLabelValue"
        @btnClick="createNewProdject"
    >
        <div  
            v-if="projectsList.length"
            class="projects"
        >
            <UserProjectItem
                v-for="project in projectsList"
                :key="project.slug"
                :project="project"
                class="projects__item"
            />
        </div>
        <p v-else class="projects__text">
            Your projects will be here
        </p> 
    </MainAside>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const { getters, actions } = globalStore;
const { setProjects } = actions;
const projectsList = computed(() => getters.projectsList);

const btnLabelValue = computed(() => {
    return route.name === 'home' ? '' : 'New project'
}) 

const createNewProdject = () => router.push({ name: 'home' })

onBeforeMount(() => {
    setProjects();
})
</script>
    
<style lang="scss" scoped>
.projects {
    &__text {
        color: var(--label-tertiary);
    }
    &__item {
        &:not(:last-child) {
            margin-bottom: 8px;
        }
    }
}
</style>