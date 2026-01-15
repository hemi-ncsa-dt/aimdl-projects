<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { useAuthStore } from '@/stores/auth';
import { ProjectRole } from '@/types';
import type { Project, ProjectMember } from '@/types';
import { VForm, VTextField, VTextarea, VBtn, VSelect, VIcon } from 'vuetify/components';

const projectStore = useProjectStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const project = ref<Partial<Project> & { members: ProjectMember[] }>({
    name: '',
    description: '',
    status: 'draft',
    members: [],
    samples: [],
});

const isNew = ref(true);

const orcidRule = [
    (v: string) => !!v || 'ORCID iD is required',
    (v: string) => /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]{1}$/.test(v) || 'Invalid ORCID iD format',
];

const emailRule = [
    (v: string) => !!v || 'E-mail is required',
    (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
];

const roleOptions = Object.values(ProjectRole);

onMounted(async () => {
    await authStore.fetchUser();
    const id = route.params.id as string;
    if (id) {
        isNew.value = false;
        await projectStore.fetchProject(id);
        if (projectStore.currentProject) {
            const members = projectStore.currentProject.members || [];
            project.value = {
                ...projectStore.currentProject,
                members: members.map(m => ({
                    firstName: m.firstName,
                    lastName: m.lastName,
                    email: m.email,
                    orcidId: m.orcidId || '',
                    role: m.role
                }))
            };
        }
    }
});

const addMember = () => {
    project.value.members.push({
        firstName: '',
        lastName: '',
        email: '',
        orcidId: '',
        role: ProjectRole.USER,
    });
};

const removeMember = (index: number) => {
    project.value.members.splice(index, 1);
};

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
        const { name, description, status, members, samples } = project.value;
        await projectStore.updateProject(project.value._id!, { name, description, status, members, samples });
    }
    router.push('/proposals');
};

const submitForReview = async () => {
    project.value.status = 'under review';
    const { name, description, status, members, samples } = project.value;
    await projectStore.updateProject(project.value._id!, { name, description, status, members, samples });
    router.push('/proposals');
};
</script>

<template>
    <v-form>
        <v-text-field v-model="project.name" label="Project Name"></v-text-field>
        <v-textarea v-model="project.description" label="Project Description"></v-textarea>

        <h2>Members</h2>
        <div v-for="(member, index) in project.members" :key="index" class="d-flex align-center my-2">
            <v-text-field v-model="member.firstName" label="First Name" class="mr-2"></v-text-field>
            <v-text-field v-model="member.lastName" label="Last Name" class="mr-2"></v-text-field>
            <v-text-field v-model="member.email" label="Email" :rules="emailRule" class="mr-2"></v-text-field>
            <v-text-field v-model="member.orcidId" label="ORCID iD" :rules="orcidRule" class="mr-2"></v-text-field>
            <v-select v-model="member.role" :items="roleOptions" label="Role" class="mr-2"></v-select>
            <v-btn icon @click="removeMember(index)">
                <v-icon>mdi-delete</v-icon>
            </v-btn>
        </div>
        <v-btn @click="addMember" class="my-2">Add Member</v-btn>

        <div class="mt-4">
            <v-btn @click="save" color="primary">Save Draft</v-btn>
            <v-btn @click="submitForReview" color="secondary" class="ml-2">Submit for Review</v-btn>
        </div>
    </v-form>
</template>