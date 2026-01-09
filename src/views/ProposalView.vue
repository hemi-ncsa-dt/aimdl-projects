<script setup lang="ts">
import { ref } from 'vue';
import { createProject } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { Project } from '@/types';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user, token } = storeToRefs(authStore);

const projectName = ref('');
const projectDescription = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function submitProposal() {
    if (!projectName.value || !projectDescription.value) {
        error.value = 'Please fill out all fields.';
        return;
    }

    submitting.value = true;
    error.value = null;
    success.value = false;

    try {
        if (!token.value || !user.value) {
            throw new Error('You must be logged in to create a project.');
        }
        const newProjectData = {
            name: projectName.value,
            description: projectDescription.value,
            owner: user.value,
            members: [],
            samples: [],
        };
        await createProject(newProjectData, token.value);
        success.value = true;
        projectName.value = '';
        projectDescription.value = '';
    } catch (e: any) {
        error.value = e.message;
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
    <div class="proposal-view">
        <div class="header">
            <h1>Submit a New Project Proposal</h1>
            <button @click="authStore.logout()">Logout</button>
        </div>
        <form @submit.prevent="submitProposal">
            <div class="form-group">
                <label for="projectName">Project Name</label>
                <input id="projectName" v-model="projectName" type="text" />
            </div>
            <div class="form-group">
                <label for="projectDescription">Project Description</label>
                <textarea id="projectDescription" v-model="projectDescription"></textarea>
            </div>
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="success" class="success-message">
                Project proposal submitted successfully!
            </div>
            <button type="submit" :disabled="submitting">
                {{ submitting ? 'Submitting...' : 'Submit Proposal' }}
            </button>
        </form>
    </div>
</template>

<style scoped>
.proposal-view {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
}

input,
textarea {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

textarea {
    min-height: 150px;
}

.error-message {
    color: red;
    margin-bottom: 1rem;
}

.success-message {
    color: green;
    margin-bottom: 1rem;
}

button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    color: #fff;
    background-color: #42b983;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:disabled {
    background-color: #ccc;
}
</style>
