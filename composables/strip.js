import { computed, reactive, readonly } from 'vue'
import { processingType } from '~~/constants/files.constants'

const state = reactive({
    projectsList: null,
    projectFiles: null,
    projectName: '',
    isSvgLoaded: computed(
        () =>
            state.projectFiles?.every(
                (file) => file.processingStatus !== processingType.inProgress
            ) || false
    ),
})

let updateTimer

async function getStripProjects() {
    try {
        const data = await $fetch(API_ROUTES.STRIP_PROJECTS)
        setStripProjects(data.projects)
    } catch (error) {
        console.error('Error fetching strip projects:', error)
    }
}
function setStripProjects(projects) {
    state.projectsList = [...projects]
}
function setProjectName(name) {
    state.projectName = name
}
function setProjectFiles(files, path) {
    state.projectFiles = [...files]
    if (updateTimer) {
        clearTimeout(updateTimer)
    }
    if (!state.isSvgLoaded) {
        updateTimer = setTimeout(() => getStripProject(path), 5000)
    }
}
async function getStripProject(path) {
    try {
        const data = await $fetch(path)
        setProjectFiles(data.files, path)
        setProjectName(data.name)
    } catch (error) {
        console.error('Error fetching strip project:', error)
        navigateTo('/strip')
    }
}
async function addFiles(files, slug) {
    const formData = new FormData()
    files.forEach((file) => formData.append('dxf', file))
    try {
        await $fetch(API_ROUTES.STRIP_ADDFILES(slug), {
            method: 'POST',
            body: formData
        })

        await getStripProject(API_ROUTES.STRIP_PROJECT(slug))
    } catch (error) {
        console.error('Error while uploading strip files:', error)
    }
}

export const stripStore = readonly({
    getters: {
        projectsList: computed(() => state.projectsList),
        projectFiles: computed(() => state.projectFiles),
        projectName: computed(() => state.projectName),
    },
    actions: {
        getStripProjects,
        setStripProjects,
        setProjectName,
        setProjectFiles,
        getStripProject,
        addFiles,
    }
})
