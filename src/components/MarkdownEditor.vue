<script setup lang="ts">
import { ref, watch } from 'vue';
import { VTextarea, VTabs, VTab, VCard, VCardText } from 'vuetify/components';

const props = defineProps<{
    modelValue: string | undefined;
    label?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const tab = ref(0);
const localValue = ref(props.modelValue || '');

watch(() => props.modelValue, (newValue) => {
    localValue.value = newValue || '';
});

watch(localValue, (newValue) => {
    emit('update:modelValue', newValue);
});

// Simple markdown to HTML conversion
const renderMarkdown = (markdown: string): string => {
    if (!markdown) return '';

    let html = markdown
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Line breaks: double line break for paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Single line breaks
        .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
};

const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.value.substring(start, end);

    const newText = localValue.value.substring(0, start) +
        before + selectedText + after +
        localValue.value.substring(end);

    localValue.value = newText;

    // Set cursor position
    setTimeout(() => {
        const newPosition = start + before.length + selectedText.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
};
</script>

<template>
    <v-card>
        <v-tabs v-model="tab" bg-color="primary">
            <v-tab>Edit</v-tab>
            <v-tab>Preview</v-tab>
        </v-tabs>

        <v-card-text v-show="tab === 0">
            <div class="toolbar mb-2">
                <button type="button" @click.prevent="insertMarkdown('**', '**')" title="Bold" class="toolbar-btn">
                    <strong>B</strong>
                </button>
                <button type="button" @click.prevent="insertMarkdown('*', '*')" title="Italic" class="toolbar-btn">
                    <em>I</em>
                </button>
            </div>

            <v-textarea v-model="localValue" :label="label" rows="10" auto-grow></v-textarea>

            <div class="text-caption text-grey mt-1">
                Formatting: **bold**, *italic*. Use Enter twice for new paragraphs.
            </div>
        </v-card-text>

        <v-card-text v-show="tab === 1">
            <div class="preview-content" v-html="renderMarkdown(localValue)"></div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
}

.toolbar-btn {
    padding: 6px 12px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.toolbar-btn:hover {
    background-color: #e0e0e0;
}

.toolbar-btn:active {
    background-color: #d0d0d0;
}

.preview-content {
    min-height: 200px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 4px;
    line-height: 1.6;
}

.preview-content :deep(p) {
    margin: 0 0 1em 0;
}

.preview-content :deep(p:last-child) {
    margin-bottom: 0;
}

.preview-content :deep(strong) {
    font-weight: 600;
}

.preview-content :deep(em) {
    font-style: italic;
}
</style>
