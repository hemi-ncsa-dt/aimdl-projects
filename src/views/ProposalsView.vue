<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { Project, ProjectStatus, ProjectMember } from '@/types';
import { ProjectRole } from '@/types';

const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const { projects, loading, error } = storeToRefs(projectStore);

onMounted(() => {
    projectStore.fetchProjects();
    authStore.fetchUser();
});

async function startNewProposal() {
    const members: ProjectMember[] = [];
    if (authStore.user) {
        members.push({
            firstName: authStore.user.firstName,
            lastName: authStore.user.lastName,
            email: authStore.user.email,
            orcidId: '',
            role: ProjectRole.PI,
            userId: authStore.user._id,
        });
    }
    await projectStore.createProject({
        name: 'New Draft Proposal',
        description: '',
        members,
        samples: [],
        status: 'draft',
        files: [],
    });
    if (projectStore.currentProject) {
        router.push({ name: 'proposal-detail', params: { id: projectStore.currentProject._id } });
    }
}

function goToProposalDetail(projectId: string) {
    router.push({ name: 'proposal-detail', params: { id: projectId } });
}

function getStatusChipClass(status: ProjectStatus) {
    return `status-chip--${status.replace(' ', '-')}`;
}
</script>

<template>
    <div class="proposals-container">
        <div class="proposals-header">
            <h1 class="proposals-title">My Proposals</h1>
            <button class="create-button" @click="startNewProposal">
                Start a New Proposal
            </button>
        </div>

        <div v-if="loading" class="loading-indicator">Loading...</div>
        <div v-if="error" class="error-message">{{ error }}</div>

        <div v-if="!loading && !error" class="proposals-list">
            <div v-if="projects.length === 0" class="empty-state">
                <p>You don't have any proposals yet.</p>
            </div>
            <div v-else>
                <div v-for="project in projects" :key="project._id" class="proposal-item"
                    @click="goToProposalDetail(project._id)">
                    <div class="proposal-item__info">
                        <h2 class="proposal-item__name">{{ project.projectId }}: {{ project.name }}</h2>
                        <p class="proposal-item__description">{{ project.description }}</p>
                    </div>
                    <div class="proposal-item__status">
                        <span class="status-chip" :class="getStatusChipClass(project.status)">
                            {{ project.status }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.proposals-container {
    max-width: 960px;
    margin: 0 auto;
}

.proposals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.proposals-title {
    font-size: 24px;
    font-weight: 400;
    margin: 0;
}

.create-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    color: #fff;
    background-color: #6200ee;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.create-button:hover {
    background-color: #3700b3;
}

.proposals-list {
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
        0 1px 1px 0 rgba(0, 0, 0, 0.14),
        0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.empty-state {
    padding: 48px;
    text-align: center;
    color: rgba(0, 0, 0, 0.6);
}

.proposal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.proposal-item:last-child {
    border-bottom: none;
}

.proposal-item__name {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px 0;
}

.proposal-item__description {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0;
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
