<template>
    <div class="navigation-header">
        <button @click="goBack" class="back-button">
            &larr; Back to Proposals
        </button>
    </div>
    <div v-if="project" class="proposal-detail-container">
        <div class="proposal-detail-card">
            <div class="proposal-detail-header">
                <h1 class="proposal-detail-title">{{ project.projectId }}: {{ project.name }}</h1>
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

        <!-- Members Section -->
        <div class="proposal-detail-card">
            <h2 class="section-title">Team Members</h2>
            <div v-if="project.members && project.members.length > 0" class="members-container">
                <div v-for="member in project.members" :key="member.orcidId" class="member-card">
                    <div class="member-info">
                        <div class="member-avatar">
                            {{ getInitials(member.firstName, member.lastName) }}
                        </div>
                        <div class="member-details">
                            <div class="member-name">{{ member.firstName }} {{ member.lastName }}</div>
                            <div class="member-email">{{ member.email }}</div>
                            <div class="member-orcid">ORCID: {{ member.orcidId }}</div>
                        </div>
                    </div>
                    <div class="member-role">
                        <span class="role-badge" :class="`role-badge--${member.role.toLowerCase()}`">
                            {{ member.role }}
                        </span>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">No team members added yet.</div>
        </div>

        <!-- Files Section -->
        <div class="proposal-detail-card">
            <h2 class="section-title">Project Files</h2>
            <div v-if="project.files && project.files.length > 0" class="files-container">
                <div class="files-grid">
                    <div class="files-grid-header">
                        <span>Name</span>
                        <span>Type</span>
                        <span>Size</span>
                        <span>File ID</span>
                    </div>
                    <div v-for="file in project.files" :key="file.fileId" class="file-row">
                        <div class="file-name">
                            <span class="file-icon">📄</span>
                            {{ file.name || 'Unnamed file' }}
                        </div>
                        <div class="file-type">{{ file.type }}</div>
                        <div class="file-size">{{ formatFileSize(file.size) }}</div>
                        <div class="file-id">{{ file.fileId }}</div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">No files uploaded yet.</div>
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

function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatFileSize(size: number | undefined): string {
    if (!size) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024;
        unitIndex++;
    }

    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
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

/* Members Section */
.section-title {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 16px 0;
    color: rgba(0, 0, 0, 0.87);
}

.members-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.member-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    transition: box-shadow 0.2s;
}

.member-card:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.member-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #6200ee;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 18px;
}

.member-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.member-name {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.87);
}

.member-email {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
}

.member-orcid {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    font-family: monospace;
}

.member-role {
    margin-left: auto;
}

.role-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
    text-transform: uppercase;
}

.role-badge--pi {
    background-color: #6200ee;
    color: white;
}

.role-badge--manager {
    background-color: #03dac6;
    color: rgba(0, 0, 0, 0.87);
}

.role-badge--user {
    background-color: #e0e0e0;
    color: rgba(0, 0, 0, 0.87);
}

/* Files Section */
.files-container {
    width: 100%;
}

.files-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.files-grid-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    gap: 16px;
    padding: 12px 16px;
    background-color: #f5f5f5;
    border-radius: 4px 4px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.87);
}

.file-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    align-items: center;
    transition: background-color 0.2s;
}

.file-row:hover {
    background-color: #f5f5f5;
}

.file-row:last-child {
    border-bottom: none;
}

.file-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.87);
}

.file-icon {
    font-size: 20px;
}

.file-type {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    text-transform: uppercase;
}

.file-size {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
}

.file-id {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
}

.empty-state {
    padding: 32px;
    text-align: center;
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
}
</style>
