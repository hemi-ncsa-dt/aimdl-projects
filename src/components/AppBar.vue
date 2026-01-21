<template>
    <header class="app-bar">
        <div class="app-bar__title">
            <img src="/CAIMEE-Icon.png" alt="CAIMEE Icon" class="app-bar__icon" />
            AIMD-L Project Proposals
        </div>
        <div class="app-bar__user" v-if="user">
            <span>{{ user.firstName }} {{ user.lastName }}</span>
            <button @click="logout">Logout</button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const logout = () => {
    authStore.logout();
    router.push({ name: 'login' });
};
</script>

<style scoped>
.app-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    height: 64px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
}

.app-bar__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 500;
}

.app-bar__icon {
    height: 40px;
    width: auto;
}

.app-bar__user {
    display: flex;
    align-items: center;
}

.app-bar__user span {
    margin-right: 16px;
}
</style>
