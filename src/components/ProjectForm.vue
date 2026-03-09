<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { useAuthStore } from '@/stores/auth';
import { ProjectRole } from '@/types';
import type { Project, ProjectMember, AutocompleteSuggestion, Person, ProjectFile } from '@/types';
import FileUploader from './FileUploader.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import { VForm, VTextField, VTextarea, VBtn, VSelect, VIcon, VAutocomplete, VCombobox, VCheckbox } from 'vuetify/components';
import { getOrcidSuggestions, searchUsers } from '@/services/api';
import { debounce } from 'lodash';

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
    files: [],
    projectType: undefined,
    instruments: [],
    priority: undefined,
});

const isNew = ref(true);
const orcidSuggestions = ref<AutocompleteSuggestion[]>([]);
const userSuggestions = ref<Person[]>([]);
const suggestionWatcher = ref<(() => void) | null>(null);

const orcidRule = [
    (v: string) => !!v || 'ORCID iD is required',
    (v: string) => /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]{1}$/.test(v) || 'Invalid ORCID iD format',
];

const emailRule = [
    (v: string) => !!v || 'E-mail is required',
    (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
];

const roleOptions = Object.values(ProjectRole);

const KNOWN_INSTRUMENTS = ['MAXIMA', 'HELIX', 'SPHINX'];

interface InstrumentOption {
    value: string;
    label: string;
    description: string;
    url: string;
}

const instrumentOptions: InstrumentOption[] = [
    {
        value: 'MAXIMA',
        label: 'MAXIMA',
        description: 'Multimodal Automated X-ray Investigation of Materials',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745259387828-044ce224-dc05',
    },
    {
        value: 'HELIX',
        label: 'HELIX',
        description: 'High-throughput Extreme Laser Impact eXperiments',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745356027264-0fcae1de-66a4',
    },
    {
        value: 'SPHINX',
        label: 'SPHINX',
        description: 'Scanning Probe for High-resolution INdentation eXperiments',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745438879173-208b1f97-0fd2',
    },
    {
        value: 'other',
        label: 'Other',
        description: '',
        url: '',
    },
];

const projectTypeOptions = [
    {
        value: 'integrated',
        title: 'Integrated project',
        description: 'Experiments using AIMD-L as an integrated facility involving two or more experimental stations',
    },
    {
        value: 'singleInstrument',
        title: 'Single-instrument project',
        description: 'Usage of one or more instruments in a stand-alone manner',
    },
    {
        value: 'development',
        title: 'Development project',
        description: 'Work to develop the capabilities of AIMD-L, either as an integrated facility or of its individual stations',
    },
];

const priorityOptions = [
    { value: 1, title: 'CAIMEE principal investigator (or collaborator)' },
    { value: 2, title: 'Researcher from primary partner institution' },
    { value: 3, title: 'HEMI fellow' },
    { value: 4, title: 'WSE faculty' },
    { value: 5, title: 'Other JHU faculty' },
    { value: 6, title: 'External researcher' },
];

const selectedInstruments = ref<string[]>([]);
const otherInstrumentText = ref('');
const isSaving = ref(false);
const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const singleInstrumentConflict = computed(() =>
    project.value.projectType === 'singleInstrument' && selectedInstruments.value.length > 1
);

const initInstruments = (instruments: { name: string }[] | undefined) => {
    if (!instruments?.length) {
        selectedInstruments.value = [];
        otherInstrumentText.value = '';
        return;
    }
    const names = instruments.map(i => i.name);
    const known = names.filter(n => KNOWN_INSTRUMENTS.includes(n));
    const unknown = names.find(n => !KNOWN_INSTRUMENTS.includes(n));
    const hasOther = !!unknown;
    selectedInstruments.value = hasOther ? [...known, 'other'] : [...known];
    if (unknown) {
        otherInstrumentText.value = unknown;
    }
};

watch([selectedInstruments, otherInstrumentText], () => {
    project.value.instruments = selectedInstruments.value.map(i => ({
        name: i === 'other' ? (otherInstrumentText.value.trim() || 'other') : i,
    }));
});

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
                    role: m.role,
                    userId: m.userId || null,
                })),
                files: projectStore.currentProject.files || [],
                priority: projectStore.currentProject.priority || undefined,
            };
            initInstruments(projectStore.currentProject.instruments);
        }
    }
});

const fetchSuggestions = async (member: ProjectMember) => {
    if (member.firstName && member.lastName && authStore.token) {
        const query = `${member.firstName} ${member.lastName}`;
        orcidSuggestions.value = await getOrcidSuggestions(query, authStore.token);
    }
};

const onOrcidFocus = (member: ProjectMember) => {
    fetchSuggestions(member);
    if (suggestionWatcher.value) {
        suggestionWatcher.value();
    }
    suggestionWatcher.value = watch(() => `${member.firstName} ${member.lastName}`, () => {
        fetchSuggestions(member);
    });
};

const onOrcidBlur = () => {
    if (suggestionWatcher.value) {
        suggestionWatcher.value();
        suggestionWatcher.value = null;
    }
};

const onOrcidSelect = (value: string, member: ProjectMember) => {
    if (value) {
        const match = value.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            const orcid = match[1];
            if (/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]{1}$/.test(orcid)) {
                member.orcidId = orcid;
            }
        }
    }
};

const firstNameSuggestions = computed(() =>
    userSuggestions.value.map(u => u.firstName)
);

const lastNameSuggestions = computed(() =>
    userSuggestions.value.map(u => u.lastName)
);

const debouncedSearch = debounce(async (query: string) => {
    if (query && authStore.token) {
        userSuggestions.value = await searchUsers(query, authStore.token);
        console.log('User suggestions:', userSuggestions.value);
    }
}, 300);

const onUserSearch = (query: string) => {
    debouncedSearch(query);
};

const onUserSelect = (user: Person, member: ProjectMember) => {
    if (user) {
        member.firstName = user.firstName;
        member.lastName = user.lastName;
        member.email = user.email;
        member.userId = user._id;
    }
};

const onFirstNameChange = (value: string, member: ProjectMember) => {
    member.firstName = value;
    // Check if this matches a user from suggestions
    const matchedUser = userSuggestions.value.find(u => u.firstName === value);
    if (matchedUser) {
        onUserSelect(matchedUser, member);
    }
};

const onLastNameChange = (value: string, member: ProjectMember) => {
    member.lastName = value;
    // Check if this matches a user from suggestions
    const matchedUser = userSuggestions.value.find(u => u.lastName === value);
    if (matchedUser) {
        onUserSelect(matchedUser, member);
    }
};

const addMember = () => {
    project.value.members.push({
        firstName: '',
        lastName: '',
        email: '',
        orcidId: '',
        role: ProjectRole.USER,
        userId: null,
    });
};

const removeMember = (index: number) => {
    project.value.members.splice(index, 1);
};

const save = async () => {
    formError.value = null;
    isSaving.value = true;
    try {
        if (isNew.value) {
            const { name, description, status, members, samples, files, projectType, instruments, priority } = project.value;
            await projectStore.createProject({
                name: name || '',
                description: description || '',
                status: status || 'draft',
                members: members || [],
                samples: samples || [],
                files: files || [],
                projectType,
                instruments: instruments || [],
                priority,
            });
        } else {
            const { name, description, status, members, samples, files, projectType, instruments, priority } = project.value;
            await projectStore.updateProject(project.value._id!, { name, description, status, members, samples, files, projectType, instruments, priority });
        }
        router.push(`/proposal/${projectStore.currentProject?._id}`);
    } catch (e: any) {
        formError.value = e.message || 'An unexpected error occurred. Please try again.';
    } finally {
        isSaving.value = false;
    }
};

const submitForReview = async () => {
    formError.value = null;
    isSubmitting.value = true;
    try {
        project.value.status = 'under review';
        const { name, description, status, members, samples, files, projectType, instruments, priority } = project.value;
        await projectStore.updateProject(project.value._id!, { name, description, status, members, samples, files, projectType, instruments, priority });
        router.push('/proposals');
    } catch (e: any) {
        project.value.status = 'draft';
        formError.value = e.message || 'An unexpected error occurred. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
};

const cancel = () => {
    if (project.value._id) {
        router.push(`/proposal/${project.value._id}`);
    } else {
        router.push('/proposals');
    }
};
</script>

<template>
    <v-form>
        <v-text-field v-model="project.name" label="Project Name"></v-text-field>

        <v-select v-model="project.projectType" :items="projectTypeOptions" item-title="title" item-value="value"
            label="Project Type" class="my-2" :error="singleInstrumentConflict"
            :error-messages="singleInstrumentConflict ? 'Single-instrument project requires exactly one instrument' : undefined">
            <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps"
                    :subtitle="projectTypeOptions.find(o => o.value === item.value)?.description" />
            </template>
        </v-select>

        <div class="my-4">
            <div class="text-subtitle-1 mb-1">Instruments</div>
            <div v-for="instrument in instrumentOptions" :key="instrument.value">
                <v-checkbox v-model="selectedInstruments" :value="instrument.value" hide-details density="compact">
                    <template #label>
                        <span class="d-flex align-center flex-wrap">
                            <a v-if="instrument.url" :href="instrument.url" target="_blank" rel="noopener noreferrer"
                                class="text-primary font-weight-medium" @click.stop>{{ instrument.label }}</a>
                            <span v-else class="font-weight-medium">{{ instrument.label }}</span>
                            <span v-if="instrument.description" class="text-caption text-grey-darken-1 ml-2">
                                &mdash; {{ instrument.description }}
                            </span>
                        </span>
                    </template>
                </v-checkbox>
                <v-text-field v-if="instrument.value === 'other' && selectedInstruments.includes('other')"
                    v-model="otherInstrumentText" label="Please specify" density="compact" variant="outlined"
                    class="ml-8 mt-1" style="max-width: 400px" />
            </div>
            <div v-if="singleInstrumentConflict" class="text-caption text-error mt-2 ml-2">
                Single-instrument project requires exactly one instrument selected.
            </div>
        </div>

        <v-select v-model="project.priority" :items="priorityOptions" item-title="title" item-value="value"
            label="Access Category" placeholder="Select access category" class="my-2" />

        <MarkdownEditor v-model="project.description" label="Public Overview" class="my-4" />

        <h2>Members</h2>
        <div v-for="(member, index) in project.members" :key="index" class="d-flex align-center my-2">
            <v-combobox v-model="member.firstName" :items="firstNameSuggestions" label="First Name" class="mr-2"
                @update:search="onUserSearch" @update:model-value="(value: string) => onFirstNameChange(value, member)">
            </v-combobox>
            <v-combobox v-model="member.lastName" :items="lastNameSuggestions" label="Last Name" class="mr-2"
                @update:search="onUserSearch" @update:model-value="(value: string) => onLastNameChange(value, member)">
            </v-combobox>
            <v-text-field v-model="member.email" label="Email" :rules="emailRule" class="mr-2"></v-text-field>
            <v-autocomplete v-model="member.orcidId" :items="orcidSuggestions" item-title="text" item-value="text"
                label="ORCID iD" :rules="orcidRule" class="mr-2" @focus="onOrcidFocus(member)" @blur="onOrcidBlur"
                @update:modelValue="(value: string) => onOrcidSelect(value, member)"></v-autocomplete>
            <v-select v-model="member.role" :items="roleOptions" label="Role" class="mr-2"></v-select>
            <v-btn icon @click="removeMember(index)">
                <v-icon>mdi-delete</v-icon>
            </v-btn>
        </div>
        <v-btn @click="addMember" class="my-2">Add Member</v-btn>

        <FileUploader v-if="project.submissionFolderId" v-model="project.files!"
            :folder-id="project.submissionFolderId" />
        <div v-else class="my-4 text-caption text-grey">
            File uploads will be available after saving the project.
        </div>

        <v-alert v-if="formError" type="error" variant="tonal" class="mt-4" closable @click:close="formError = null">
            {{ formError }}
        </v-alert>

        <div class="mt-4">
            <v-btn @click="save" color="primary" :loading="isSaving" :disabled="isSubmitting">Save Draft</v-btn>
            <v-btn @click="submitForReview" color="secondary" class="ml-2" :loading="isSubmitting"
                :disabled="isSaving">Submit
                for Review</v-btn>
            <v-btn @click="cancel" class="ml-2" :disabled="isSaving || isSubmitting">Cancel</v-btn>
        </div>
    </v-form>
</template>
