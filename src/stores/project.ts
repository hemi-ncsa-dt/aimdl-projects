import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Project } from '@/types';
import { getProjects } from '@/services/api';
import { useAuthStore } from './auth';

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchProjects() {
        const authStore = useAuthStore();
        if (!authStore.token) {
            error.value = 'Authentication token not found.';
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            projects.value = await getProjects(authStore.token);
        } catch (e: any) {
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    }

    return { projects, loading, error, fetchProjects };
});
