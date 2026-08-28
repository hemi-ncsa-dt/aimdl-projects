<template>
    <div class="navigation-header">
        <button @click="goBack" class="back-button">
            &larr; Back to Proposals
        </button>
    </div>
    <div v-if="loading" class="loading-indicator">Loading...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="project" class="proposal-detail-container">
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
            <p class="proposal-detail-description" v-html="renderMarkdown(project.description)"></p>
        </div>

        <!-- Details Section -->
        <div class="proposal-detail-card">
            <h2 class="section-title">Project Details</h2>
            <dl class="detail-grid">
                <dt>Project Type</dt>
                <dd>
                    <template v-if="project.projectType">
                        {{ projectTypeLabel(project.projectType) || project.projectType }}
                        <div v-if="projectTypeDescription(project.projectType)" class="detail-hint">
                            {{ projectTypeDescription(project.projectType) }}
                        </div>
                    </template>
                    <span v-else class="detail-unset">Not specified</span>
                </dd>

                <dt>Access Category</dt>
                <dd>
                    <template v-if="project.priority">
                        {{ priorityLabel(project.priority) || project.priority }}
                    </template>
                    <span v-else class="detail-unset">Not specified</span>
                </dd>

                <dt>Instruments</dt>
                <dd>
                    <div v-if="project.instruments && project.instruments.length > 0" class="instrument-list">
                        <template v-for="instrument in project.instruments" :key="instrument.name">
                            <a v-if="instrumentUrl(instrument.name)" :href="instrumentUrl(instrument.name)"
                                target="_blank" rel="noopener noreferrer" class="instrument-chip instrument-chip--link"
                                :title="instrumentDescription(instrument.name)">
                                {{ instrument.name }}
                            </a>
                            <span v-else class="instrument-chip">{{ instrument.name }}</span>
                        </template>
                    </div>
                    <span v-else class="detail-unset">None selected</span>
                </dd>
            </dl>
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
                    </div>
                    <div v-for="file in project.files" :key="file.fileId" class="file-row">
                        <div class="file-name">
                            <v-icon class="file-icon">mdi-file-document</v-icon>
                            {{ file.name || 'Unnamed file' }}
                        </div>
                        <div class="file-type">{{ file.type }}</div>
                        <div class="file-size">{{ formatFileSize(file.size) }}</div>
                        <a :href="getDownloadUrl(file.fileId)" class="download-link" title="Download file">
                            <v-icon>mdi-download</v-icon>
                        </a>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">No files uploaded yet.</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { storeToRefs } from 'pinia';
import type { ProjectStatus } from '@/types';
import { getFileDownloadUrl } from '@/services/api';
import { renderMarkdown } from '@/utils/markdown';
import {
    instrumentUrl,
    instrumentDescription,
    projectTypeLabel,
    projectTypeDescription,
    priorityLabel,
} from '@/constants/project';
import { useAuthStore } from '@/stores/auth';
import { VIcon } from 'vuetify/components';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();
// The store owns fetching plus the loading/error state; don't duplicate either here.
const { currentProject: project, loading, error } = storeToRefs(projectStore);

onMounted(() => {
    projectStore.fetchProject(route.params.id as string);
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

function getDownloadUrl(fileId: string): string {
    return getFileDownloadUrl(fileId, authStore.token);
}
</script>

<style scoped>
.navigation-header {
    margin-bottom: 16px;
}

.back-button {
    background: none;
    border: none;
    color: var(--c-primary);
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
    background-color: var(--c-primary);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
}

.delete-button {
    margin-left: 16px;
    background-color: var(--c-danger);
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


.loading-indicator,
.error-message {
    text-align: center;
    padding: 48px;
    font-size: 16px;
}

.error-message {
    color: var(--c-error);
}

/* Details Section */
.detail-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 12px 16px;
    margin: 0;
    align-items: baseline;
}

.detail-grid dt {
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
}

.detail-grid dd {
    margin: 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.87);
}

.detail-hint {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin-top: 2px;
}

.detail-unset {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.38);
    font-style: italic;
}

.instrument-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.instrument-chip {
    display: inline-block;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 10px;
    background-color: var(--c-border);
    color: rgba(0, 0, 0, 0.87);
}

.instrument-chip--link {
    background-color: var(--c-primary-wash);
    color: var(--c-primary);
    text-decoration: none;
}

.instrument-chip--link:hover {
    background-color: var(--c-primary-wash-strong);
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
    gap: 8px;
}

.member-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--c-border);
    border-radius: 4px;
    transition: box-shadow 0.2s;
}

.member-card:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.member-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--c-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 14px;
}

.member-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.member-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.87);
}

.member-email {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

.member-orcid {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.6);
    font-family: monospace;
}

.member-role {
    margin-left: auto;
}

.role-badge {
    display: inline-block;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 10px;
    text-transform: uppercase;
}

.role-badge--pi {
    background-color: var(--c-primary);
    color: white;
}

.role-badge--manager {
    background-color: var(--c-secondary);
    color: rgba(0, 0, 0, 0.87);
}

.role-badge--user {
    background-color: var(--c-border);
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
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    padding: 12px 16px;
    background-color: var(--c-surface-muted);
    border-radius: 4px 4px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.87);
}

.file-row {
    position: relative;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    padding: 12px 16px;
    padding-right: 48px;
    border-bottom: 1px solid var(--c-border);
    align-items: center;
    transition: background-color 0.2s;
}

.file-row:hover {
    background-color: var(--c-surface-muted);
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
    margin-right: 8px;
    color: rgba(0, 0, 0, 0.6);
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

.download-link {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    text-decoration: none;
    color: rgba(0, 0, 0, 0.6);
    transition: background-color 0.2s, color 0.2s;
}

.download-link:hover {
    background-color: rgba(98, 0, 238, 0.08);
    color: var(--c-primary);
}

.empty-state {
    padding: 32px;
    text-align: center;
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
}
</style>
