<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ProjectRole } from '@/types';
import type { Project, ProjectMember, AutocompleteSuggestion, Person } from '@/types';
import FileUploader from './FileUploader.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import { VForm, VTextField, VBtn, VSelect, VIcon, VCombobox, VCheckbox, VDialog, VCard, VCardTitle, VCardText, VCardActions, VSpacer } from 'vuetify/components';
import { getOrcidSuggestions, searchUsers } from '@/services/api';
import { KNOWN_INSTRUMENTS, instrumentOptions, projectTypeOptions, priorityOptions } from '@/constants/project';
import { debounce } from 'lodash';

const props = withDefaults(defineProps<{
    project: Partial<Project>;
    isNew?: boolean;
    saving?: boolean;
    submitting?: boolean;
    error?: string | null;
}>(), {
    isNew: false,
    saving: false,
    submitting: false,
    error: null,
});

const emit = defineEmits<{
    save: [project: Partial<Project>];
    submit: [project: Partial<Project>];
    cancel: [];
    'update:error': [value: string | null];
}>();

const authStore = useAuthStore();

// Local, editable copy of the project. The parent owns persistence; this component
// only collects input and emits the payload.
const form = ref<Partial<Project> & { members: ProjectMember[] }>({
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

const orcidSuggestions = ref<AutocompleteSuggestion[]>([]);
const userSuggestions = ref<Person[]>([]);
const suggestionWatcher = ref<(() => void) | null>(null);

const orcidRule = [
    (v: string) => !!v || 'ORCID iD is required',
    (v: string) => /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]{1}$/.test(v) || 'Invalid ORCID iD format',
];

const nameRule = [
    (v: string) => !!v?.trim() || 'Project name is required',
];

const emailRule = [
    (v: string) => !!v || 'E-mail is required',
    (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
];

const roleOptions = Object.values(ProjectRole);

const selectedInstruments = ref<string[]>([]);
const otherInstrumentText = ref('');
const formRef = ref<InstanceType<typeof VForm> | null>(null);

// Snapshot of the project as it was seeded, for the unsaved-changes check (1.4).
const baseline = ref('');

// Promise-based confirm, shared by Submit (1.3) and the route guard (1.4).
const confirmState = ref({
    open: false,
    title: '',
    body: '',
    confirmText: 'Confirm',
    resolve: (() => { /* replaced per call */ }) as (ok: boolean) => void,
});

function confirm(title: string, body: string, confirmText: string): Promise<boolean> {
    return new Promise((resolve) => {
        confirmState.value = { open: true, title, body, confirmText, resolve };
    });
}

function settleConfirm(ok: boolean) {
    confirmState.value.open = false;
    confirmState.value.resolve(ok);
}

const isBusy = computed(() => props.saving || props.submitting);

const singleInstrumentConflict = computed(() =>
    form.value.projectType === 'singleInstrument' && selectedInstruments.value.length > 1
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
    otherInstrumentText.value = unknown || '';
};

watch([selectedInstruments, otherInstrumentText], () => {
    form.value.instruments = selectedInstruments.value.map(i => ({
        name: i === 'other' ? (otherInstrumentText.value.trim() || 'other') : i,
    }));
});

// The parent loads the project asynchronously, so re-seed the form whenever it arrives.
watch(() => props.project, (source) => {
    form.value = {
        ...source,
        name: source.name || '',
        description: source.description || '',
        status: source.status || 'draft',
        members: (source.members || []).map(m => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            orcidId: m.orcidId || '',
            role: m.role,
            userId: m.userId || null,
        })),
        samples: source.samples || [],
        files: source.files || [],
        projectType: source.projectType,
        instruments: source.instruments || [],
        priority: source.priority || undefined,
    };
    initInstruments(source.instruments);
    // Defer so the instruments watcher has rewritten form.instruments before we snapshot;
    // otherwise the form reads as dirty the moment it loads.
    queueMicrotask(() => { baseline.value = JSON.stringify(buildPayload()); });
}, { immediate: true });

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
    form.value.members.push({
        firstName: '',
        lastName: '',
        email: '',
        orcidId: '',
        role: ProjectRole.USER,
        userId: null,
    });
};

const removeMember = (index: number) => {
    form.value.members.splice(index, 1);
};

const buildPayload = (): Partial<Project> => {
    const { name, description, status, members, samples, files, projectType, instruments, priority } = form.value;
    return {
        name: name || '',
        description: description || '',
        status: status || 'draft',
        members: members || [],
        samples: samples || [],
        files: files || [],
        projectType,
        instruments: instruments || [],
        priority,
    };
};

const isDirty = computed(() => baseline.value !== '' && baseline.value !== JSON.stringify(buildPayload()));

// While the parent is persisting it also navigates, and that navigation must not prompt.
const isLeavingIntentionally = computed(() => props.saving || props.submitting);

const LEAVE_TITLE = 'Discard unsaved changes?';
const LEAVE_BODY = 'This proposal has edits that have not been saved. Leaving now discards them.';

onBeforeRouteLeave(async () => {
    if (!isDirty.value || isLeavingIntentionally.value) return true;
    return await confirm(LEAVE_TITLE, LEAVE_BODY, 'Discard changes');
});

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty.value || isLeavingIntentionally.value) return;
    event.preventDefault();
    event.returnValue = '';
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload));

/** Reveal the first field the rules rejected -- the form is taller than the viewport. */
function focusFirstInvalid() {
    const field = document.querySelector<HTMLElement>('.v-input--error input, .v-input--error textarea');
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
}

// D1: drafts are working documents, so Save enforces nothing.
const save = () => {
    emit('save', buildPayload());
};

// D1: the review gate is where the rules bite.
const submitForReview = async () => {
    if (singleInstrumentConflict.value) {
        emit('update:error', 'Single-instrument project requires exactly one instrument selected.');
        return;
    }

    const result = await formRef.value?.validate();
    if (result && !result.valid) {
        emit('update:error', 'Some required details are missing or invalid. They are highlighted below.');
        focusFirstInvalid();
        return;
    }

    const ok = await confirm(
        'Submit this proposal for review?',
        'Once submitted the proposal is locked and can no longer be edited or deleted. '
        + 'Save it as a draft instead if you still need to make changes.',
        'Submit for review',
    );
    if (!ok) return;

    emit('update:error', null);
    emit('submit', buildPayload());
};

const cancel = () => {
    emit('cancel');
};
</script>

<template>
    <v-form ref="formRef">
        <section class="form-card">
            <h2 class="section-title">Overview</h2>
            <v-text-field v-model="form.name" label="Project Name" :rules="nameRule"></v-text-field>

        <v-select v-model="form.projectType" :items="projectTypeOptions" item-title="title" item-value="value"
            label="Project Type" class="my-2">
            <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps"
                    :subtitle="projectTypeOptions.find(o => o.value === item.value)?.description" />
            </template>

        </v-select>

            <v-select v-model="form.priority" :items="priorityOptions" item-title="title" item-value="value"
                label="Access Category" placeholder="Select access category" class="my-2" />

            <MarkdownEditor v-model="form.description" label="Public Overview" class="my-4" />
        </section>

        <section class="form-card">
            <h2 class="section-title">Instruments</h2>
            <div v-for="instrument in instrumentOptions" :key="instrument.value">
                <v-checkbox v-model="selectedInstruments" :value="instrument.value" hide-details density="compact">
                    <template #label>
                        <span class="instrument-label">
                            <a v-if="instrument.url" :href="instrument.url" target="_blank" rel="noopener noreferrer"
                                class="text-primary font-weight-medium" @click.stop>{{ instrument.label }}</a>
                            <span v-else class="font-weight-medium">{{ instrument.label }}</span>
                            <span v-if="instrument.description" class="text-caption text-grey-darken-1">
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
        </section>

        <section class="form-card">
            <h2 class="section-title">Team members</h2>
            <div v-for="(member, index) in form.members" :key="index" class="member-row">
                <v-combobox v-model="member.firstName" :items="firstNameSuggestions" label="First Name"
                    @update:search="onUserSearch" @update:model-value="(value: string) => onFirstNameChange(value, member)">
                </v-combobox>
                <v-combobox v-model="member.lastName" :items="lastNameSuggestions" label="Last Name"
                    @update:search="onUserSearch" @update:model-value="(value: string) => onLastNameChange(value, member)">
                </v-combobox>
                <v-text-field v-model="member.email" label="Email" :rules="emailRule"></v-text-field>
                <v-combobox v-model="member.orcidId" :items="orcidSuggestions" item-title="text" item-value="text"
                    :return-object="false" label="ORCID iD" :rules="orcidRule"
                    @focus="onOrcidFocus(member)" @blur="onOrcidBlur"
                    @update:modelValue="(value: string) => onOrcidSelect(value, member)"></v-combobox>
                <v-select v-model="member.role" :items="roleOptions" label="Role"></v-select>
                <v-btn icon variant="text" :aria-label="`Remove member ${index + 1}`" @click="removeMember(index)">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </div>
            <v-btn @click="addMember" class="my-2">Add Member</v-btn>
        </section>

        <section class="form-card">
            <h2 class="section-title">Documents</h2>
            <FileUploader v-if="form.submissionFolderId" v-model="form.files!" :folder-id="form.submissionFolderId" />
            <div v-else class="text-caption text-grey">
                File uploads will be available after saving the project.
            </div>
        </section>

        <div class="action-bar">
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3" closable
                @click:close="emit('update:error', null)">
                {{ error }}
            </v-alert>
            <div class="action-bar__buttons">
                <v-btn @click="save" color="primary" :loading="saving" :disabled="submitting">
                    {{ isNew ? 'Create Draft' : 'Save Draft' }}
                </v-btn>
                <v-btn @click="submitForReview" color="secondary" :loading="submitting" :disabled="saving">
                    Submit for Review
                </v-btn>
                <v-btn @click="cancel" variant="text" :disabled="isBusy">Cancel</v-btn>
            </div>
        </div>

        <v-dialog v-model="confirmState.open" max-width="480" persistent>
            <v-card>
                <v-card-title class="text-h6">{{ confirmState.title }}</v-card-title>
                <v-card-text>{{ confirmState.body }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="settleConfirm(false)">Keep editing</v-btn>
                    <v-btn color="error" variant="flat" @click="settleConfirm(true)">
                        {{ confirmState.confirmText }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-form>
</template>

<style scoped>
/* Match the detail view: a stack of cards in a centred column, rather than a full-bleed
   run of inputs (3.3). */
.form-card {
    background: var(--c-surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-card);
    padding: 24px;
    margin-bottom: 16px;
}

/* One treatment for every peer section (3.4) — Instruments, Team members and Documents
   previously used three different heading sizes. */
.section-title {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 16px;
    color: var(--c-text);
}

/* One shared template, so every member row's columns line up (2.1). The minimums stop
   fields collapsing into unreadable slivers; below the D2 laptop floor the row wraps
   instead of compressing further. */
.member-row {
    display: grid;
    grid-template-columns:
        minmax(9rem, 1fr) minmax(9rem, 1fr) minmax(14rem, 1.6fr)
        minmax(12rem, 1.4fr) minmax(8rem, 0.9fr) auto;
    gap: 0 12px;
    align-items: start;
    margin: 8px 0;
}

/* 1024px is the supported floor (D2) and the full row still fits there. Below it, wrap to
   two equal columns rather than letting fields fall into the icon-sized track. */
@media (max-width: 1023.98px) {
    .member-row {
        grid-template-columns: minmax(10rem, 1fr) minmax(10rem, 1fr);
        row-gap: 4px;
    }

    .member-row > .v-btn {
        justify-self: start;
    }
}

.instrument-label {
    display: inline;
    line-height: 1.5;
}

.instrument-label .text-caption {
    margin-left: 4px;
}

/* Keep the actions reachable on a form taller than the viewport (2.3). */
.action-bar {
    position: sticky;
    bottom: 0;
    margin-top: 16px;
    padding: 12px 24px;
    background: var(--c-surface);
    border-top: 1px solid var(--c-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-card);
}

.action-bar__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
