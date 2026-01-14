<template>
    <div class="navigation-header">
        <button @click="goBack" class="back-button">
            &larr; Back to Proposals
        </button>
    </div>
    <div v-if="project" class="proposal-detail-container">
        <div class="proposal-detail-card">
            <div class="proposal-detail-header">
                <h1 class="proposal-detail-title">{{ project.name }}</h1>
                <div>
                    <span class="status-chip" :class="getStatusChipClass(project.status)">
                        {{ project.status }}
                    </span>
                    <button v-if="project.status === 'draft'" @click="goToEdit" class="edit-button">
                        Edit
                    </button>
                    <button v-if="project.status === 'draft'" @click="deleteProject" class="delete-button">
                        Delete
                    </button>
                </div>
            </div>
            <p class="proposal-detail-description">{{ project.description }}</p>
        </div>
    </div>
    <div v-else-if="loading" class="loading-indicator">Loading...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { storeToRefs } from 'pinia';
import type { Project, ProjectStatus } from '@/types';
import { getProject } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const { projects, loading, error } = storeToRefs(projectStore);
const project = ref<Project | null>(null);

onMounted(async () => {
    const projectId = route.params.id as string;
    const existingProject = projects.value.find(p => p._id === projectId);

    if (existingProject) {
        project.value = existingProject;
    } else {
        const authStore = useAuthStore();
        if (authStore.token) {
            try {
                loading.value = true;
                project.value = await getProject(projectId, authStore.token);
            } catch (e: any) {
                error.value = e.message;
            } finally {
                loading.value = false;
            }
        }
    }
});

function goBack() {
    router.push({ name: 'proposals' });
}

function getStatusChipClass(status: ProjectStatus) {
    return `status-chip--${status.replace(' ', '-')}`;
}

function goToEdit() {
    if (project.value) {
        router.push({ name: 'proposal-edit', params: { id: project.value._id } });
    }
}

async function deleteProject() {
    if (project.value) {
        await projectStore.deleteProject(project.value._id);
        router.push({ name: 'proposals' });
    }
}
</script>

<style scoped>
.navigation-header {
    margin-bottom: 16px;
}

.back-button {
    background: none;
    border: none;
    color: #6200ee;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
}

.proposal-detail-container {
    max-width: 960px;
    margin: 0 auto;
}

.proposal-detail-card {
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
        0 1px 1px 0 rgba(0, 0, 0, 0.14),
        0 1px 3px 0 rgba(0, 0, 0, 0.12);
    padding: 24px;
}

.proposal-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.edit-button {
    margin-left: 16px;
    background-color: #6200ee;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
}

.delete-button {
    margin-left: 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
}

.proposal-detail-title {
    font-size: 24px;
    font-weight: 400;
    margin: 0;
}

.proposal-detail-description {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.87);
}

.status-chip {
    display: inline-block;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 16px;
    text-transform: capitalize;
}

.status-chip--draft {
    background-color: #e0e0e0;
    color: rgba(0, 0, 0, 0.87);
}

.status-chip--under-review {
    background-color: #ffc107;
    color: rgba(0, 0, 0, 0.87);
}

.status-chip--accepted {
    background-color: #4caf50;
    color: white;
}

.status-chip--rejected {
    background-color: #f44336;
    color: white;
}

.loading-indicator,
.error-message {
    text-align: center;
    padding: 48px;
    font-size: 16px;
}

.error-message {
    color: #b00020;
}
</style>
