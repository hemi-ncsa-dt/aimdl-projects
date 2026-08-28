<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import ProjectForm from '@/components/ProjectForm.vue';
import type { Project } from '@/types';

const projectStore = useProjectStore();
const router = useRouter();
const route = useRoute();

const project = ref<Partial<Project>>({});
const saving = ref(false);
const submitting = ref(false);
const formError = ref<string | null>(null);

onMounted(async () => {
    const id = route.params.id as string;
    if (!id) return;
    await projectStore.fetchProject(id);
    if (projectStore.currentProject) {
        project.value = { ...projectStore.currentProject };
    }
});

async function save(projectData: Partial<Project>) {
    if (!project.value._id) return;
    formError.value = null;
    saving.value = true;
    try {
        await projectStore.updateProject(project.value._id, projectData);
        router.push({ name: 'proposal-detail', params: { id: project.value._id } });
    } catch (e: any) {
        formError.value = e.message || 'An unexpected error occurred. Please try again.';
    } finally {
        saving.value = false;
    }
}

async function submit(projectData: Partial<Project>) {
    if (!project.value._id) return;
    formError.value = null;
    submitting.value = true;
    try {
        await projectStore.updateProject(project.value._id, { ...projectData, status: 'under review' });
        router.push({ name: 'proposals' });
    } catch (e: any) {
        formError.value = e.message || 'An unexpected error occurred. Please try again.';
    } finally {
        submitting.value = false;
    }
}

function cancel() {
    if (project.value._id) {
        router.push({ name: 'proposal-detail', params: { id: project.value._id } });
    } else {
        router.push({ name: 'proposals' });
    }
}
</script>

<template>
    <div class="edit-container">
        <h1 class="edit-title">Edit Proposal</h1>
        <ProjectForm :project="project" :is-new="false" :saving="saving" :submitting="submitting"
            v-model:error="formError" @save="save" @submit="submit" @cancel="cancel" />
    </div>
</template>

<style scoped>
.edit-container {
    max-width: var(--page-max-width);
    margin: 0 auto;
}

.edit-title {
    font-size: 24px;
    font-weight: 400;
    margin: 0 0 24px;
}

.proposal-container {
    display: flex;
    justify-content: center;
    padding-top: 32px;
}

.proposal-card {
    width: 100%;
    max-width: 800px;
    padding: 32px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
        0 1px 1px 0 rgba(0, 0, 0, 0.14),
        0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.proposal-title {
    font-size: 24px;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 24px;
}

.form-group {
    margin-bottom: 24px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
}

input,
textarea {
    display: block;
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid rgba(0, 0, 0, 0.42);
    border-radius: 4px;
    transition: border-color 0.3s;
    box-sizing: border-box;
}

input:focus,
textarea:focus {
    outline: none;
    border-color: var(--c-primary);
    border-width: 2px;
    padding: 9px;
}

textarea {
    min-height: 120px;
    resize: vertical;
}

.submit-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    color: #fff;
    background-color: var(--c-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: var(--c-primary-dark);
}

.submit-button:disabled {
    background-color: rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.37);
    cursor: not-allowed;
}

.error-message {
    color: var(--c-error);
    margin-bottom: 16px;
}

.success-message {
    color: #00c853;
    margin-bottom: 16px;
}
</style>

<style scoped>
.proposal-view {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
}

input,
textarea {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

textarea {
    min-height: 150px;
}

.error-message {
    color: red;
    margin-bottom: 1rem;
}

.success-message {
    color: green;
    margin-bottom: 1rem;
}

button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    color: #fff;
    background-color: #42b983;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:disabled {
    background-color: #ccc;
}
</style>
