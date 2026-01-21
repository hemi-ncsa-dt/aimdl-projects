import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Project } from '@/types';
import * as api from '@/services/api';
import { useAuthStore } from './auth';

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([]);
    const currentProject = ref<Project | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const authStore = useAuthStore();

    async function fetchProjects() {
        if (!authStore.token) {
            error.value = 'Authentication token not found.';
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            projects.value = await api.getProjects(authStore.token);
        } catch (e: any) {
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    }

    async function fetchProject(id: string) {
        if (!authStore.token) {
            error.value = 'Authentication token not found.';
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            currentProject.value = await api.getProject(id, authStore.token);
        } catch (e: any) {
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    }

    async function createProject(projectData: Omit<Project, '_id' | 'owner' | 'created' | 'updated' | 'submissionFolderId' | 'projectId'>) {
        if (!authStore.token) return;
        try {
            const newProject = await api.createProject(projectData, authStore.token);
            projects.value.push(newProject);
            currentProject.value = newProject;
        } catch (e: any) {
            error.value = e.message;
        }
    }

    async function updateProject(id: string, projectData: Partial<Omit<Project, 'projectId' | 'submissionFolderId'>>) {
        if (!authStore.token) return;
        try {
            const updatedProject = await api.updateProject(id, projectData, authStore.token);
            const index = projects.value.findIndex((p) => p._id === id);
            if (index !== -1) {
                projects.value[index] = updatedProject;
            }
            if (currentProject.value?._id === id) {
                currentProject.value = updatedProject;
            }
        } catch (e: any) {
            error.value = e.message;
        }
    }

    async function deleteProject(id: string) {
        if (!authStore.token) return;
        try {
            await api.deleteProject(id, authStore.token);
            projects.value = projects.value.filter((p) => p._id !== id);
            if (currentProject.value?._id === id) {
                currentProject.value = null;
            }
        } catch (e: any) {
            error.value = e.message;
        }
    }

    return { projects, currentProject, loading, error, fetchProjects, fetchProject, createProject, updateProject, deleteProject };
});
