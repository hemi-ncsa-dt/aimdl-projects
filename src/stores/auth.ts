import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser } from '@/services/api';
import type { Person } from '@/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(sessionStorage.getItem('girderToken'));
    const user = ref<Person | null>(null);
    const router = useRouter();

    function setToken(newToken: string) {
        token.value = newToken;
        sessionStorage.setItem('girderToken', newToken);
    }

    function clearToken() {
        token.value = null;
        user.value = null;
        sessionStorage.removeItem('girderToken');
    }

    async function fetchUser() {
        if (!token.value) {
            user.value = null;
            return;
        }

        try {
            const userData = await getCurrentUser(token.value);
            if (userData) {
                user.value = userData;
            } else {
                clearToken();
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            clearToken();
        }
    }

    function logout() {
        clearToken();
        // We need to force a reload to ensure the router guard is triggered correctly
        // after the auth state is cleared.
        window.location.href = '/login';
    }

    return { token, user, setToken, logout, fetchUser };
});
