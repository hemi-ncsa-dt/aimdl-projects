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
    <div class="login-view">
        <h1>Login</h1>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-for="provider in providers" :key="provider.name">
            <button @click="login(provider.url)">
                Login with {{ provider.name }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.login-view {
    max-width: 400px;
    margin: 5rem auto;
    padding: 2rem;
    text-align: center;
}

button {
    display: block;
    width: 100%;
    padding: 0.75rem 1.5rem;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #fff;
    background-color: #42b983;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.error-message {
    color: red;
    margin-bottom: 1rem;
}
</style>
