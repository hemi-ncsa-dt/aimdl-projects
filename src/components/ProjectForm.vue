<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import type { Project } from '@/types';
import { VForm, VTextField, VTextarea, VBtn } from 'vuetify/components';

const projectStore = useProjectStore();
const router = useRouter();
const route = useRoute();

const project = ref<Partial<Project>>({
    name: '',
    description: '',
    status: 'draft',
    members: [],
    samples: [],
});

const isNew = ref(true);

onMounted(async () => {
    const id = route.params.id as string;
    if (id) {
        isNew.value = false;
        await projectStore.fetchProject(id);
        if (projectStore.currentProject) {
            project.value = { ...projectStore.currentProject };
        }
    }
});

const save = async () => {
    if (isNew.value) {
        const { name, description, status, members, samples } = project.value;
        await projectStore.createProject({
            name: name || '',
            description: description || '',
            status: status || 'draft',
            members: members || [],
            samples: samples || [],
        });
    } else {
        await projectStore.updateProject(project.value._id!, project.value);
    }
    router.push('/proposals');
};

const submitForReview = async () => {
    project.value.status = 'under review';
    await save();
};
</script>

<template>
    <v-form @submit.prevent="save">
        <v-text-field v-model="project.name" label="Project Name"></v-text-field>
        <v-textarea v-model="project.description" label="Project Description"></v-textarea>
        <v-btn type="submit" color="primary">Save Draft</v-btn>
        <v-btn @click="submitForReview" color="secondary">Submit for Review</v-btn>
    </v-form>
</template>
