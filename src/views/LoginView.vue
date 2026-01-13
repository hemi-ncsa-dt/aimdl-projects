<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getLoginProviders } from '@/services/api';

const providers = ref<{ name: string; url: string }[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
    try {
        const redirectUrl = window.location.origin + '/';
        providers.value = await getLoginProviders(redirectUrl);
    } catch (e: any) {
        error.value = e.message;
    }
});

function login(url: string) {
    window.location.href = url;
}
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <h1 class="login-title">Login</h1>
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-for="provider in providers" :key="provider.name">
                <button class="login-button" @click="login(provider.url)">
                    Login with {{ provider.name }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 64px);
    /* Subtract app bar height */
    background-color: #f5f5f5;
}

.login-card {
    width: 100%;
    max-width: 400px;
    padding: 32px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
        0 1px 1px 0 rgba(0, 0, 0, 0.14),
        0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.login-title {
    text-align: center;
    font-size: 24px;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 24px;
}

.login-button {
    display: block;
    width: 100%;
    padding: 10px 16px;
    margin-bottom: 16px;
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

.login-button:hover {
    background-color: #3700b3;
}

.error-message {
    color: #b00020;
    margin-bottom: 16px;
    text-align: center;
}
</style>
