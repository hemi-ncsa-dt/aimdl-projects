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
    <div class="proposal-container">
        <div class="proposal-card">
            <h1 class="proposal-title">Submit a New Project Proposal</h1>
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
                <button class="submit-button" type="submit" :disabled="submitting">
                    {{ submitting ? 'Submitting...' : 'Submit Proposal' }}
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.proposal-container {
    display: flex;
    justify-content: center;
    padding-top: 32px;
}

.proposal-card {
    width: 100%;
    max-width: 800px;
    padding: 32px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
        0 1px 1px 0 rgba(0, 0, 0, 0.14),
        0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.proposal-title {
    font-size: 24px;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 24px;
}

.form-group {
    margin-bottom: 24px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
}

input,
textarea {
    display: block;
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid rgba(0, 0, 0, 0.42);
    border-radius: 4px;
    transition: border-color 0.3s;
    box-sizing: border-box;
}

input:focus,
textarea:focus {
    outline: none;
    border-color: #6200ee;
    border-width: 2px;
    padding: 9px;
}

textarea {
    min-height: 120px;
    resize: vertical;
}

.submit-button {
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

.submit-button:hover {
    background-color: #3700b3;
}

.submit-button:disabled {
    background-color: rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.37);
    cursor: not-allowed;
}

.error-message {
    color: #b00020;
    margin-bottom: 16px;
}

.success-message {
    color: #00c853;
    margin-bottom: 16px;
}
</style>

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
