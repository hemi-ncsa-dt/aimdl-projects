<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { VFileInput, VSelect, VBtn, VProgressLinear, VCard, VCardText, VIcon, VChip } from 'vuetify/components';
import { FileType, type ProjectFile, type FileUploadResult } from '@/types';
import { initiateUpload, uploadChunk, getFileDetails, deleteItem } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
    folderId: string;
    modelValue: ProjectFile[];
}>();

const emit = defineEmits<{
    'update:modelValue': [value: ProjectFile[]];
}>();

const authStore = useAuthStore();
const selectedFiles = ref<File[]>([]);
const fileTypes = ref<Record<string, FileType>>({});
const uploadProgress = ref<Record<string, number>>({});
const uploadingFiles = ref<Set<string>>(new Set());
const uploadedFiles = computed(() => props.modelValue || []);
const fileDetailsCache = ref<Map<string, { name: string; size: number; itemId: string }>>(new Map());

const fileTypeOptions = Object.values(FileType);

const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks

onMounted(async () => {
    // Fetch details for any uploaded files that don't have name/size
    const token = authStore.token;
    if (!token) return;

    for (const file of uploadedFiles.value) {
        if (!file.name || !file.size) {
            try {
                const details = await getFileDetails(file.fileId, token);
                fileDetailsCache.value.set(file.fileId, {
                    name: details.name,
                    size: details.size,
                    itemId: details.itemId,
                });
            } catch (error) {
                console.error(`Failed to fetch details for file ${file.fileId}:`, error);
            }
        }
    }
});

const getFileName = (file: ProjectFile): string => {
    return file.name || fileDetailsCache.value.get(file.fileId)?.name || `File ${file.fileId}`;
};

const getFileSize = (file: ProjectFile): string => {
    const size = file.size || fileDetailsCache.value.get(file.fileId)?.size;
    if (!size) return 'Unknown size';

    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;

    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
};

const onFilesSelected = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    selectedFiles.value = fileArray;
    fileArray.forEach(file => {
        if (!fileTypes.value[file.name]) {
            fileTypes.value[file.name] = FileType.OTHER;
        }
        uploadProgress.value[file.name] = 0;
    });
};

const uploadFile = async (file: File): Promise<{ fileId: string; itemId: string }> => {
    const token = authStore.token;
    if (!token) {
        throw new Error('No authentication token');
    }

    uploadingFiles.value.add(file.name);
    uploadProgress.value[file.name] = 0;

    try {
        // Initiate upload
        const upload = await initiateUpload(
            props.folderId,
            'folder',
            file.name,
            file.size,
            token,
            file.type
        );

        // Upload file in chunks
        let offset = 0;
        while (offset < file.size) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const result = await uploadChunk(upload._id, offset, chunk, token);

            offset += chunk.size;
            uploadProgress.value[file.name] = Math.round((offset / file.size) * 100);

            // If this is the last chunk, the result will be a FileUploadResult
            if (offset >= file.size && '_modelType' in result && result._modelType === 'file') {
                const fileResult = result as FileUploadResult;
                return { fileId: fileResult._id, itemId: fileResult.itemId };
            }
        }

        throw new Error('Upload completed but no file ID received');
    } finally {
        uploadingFiles.value.delete(file.name);
    }
};

const uploadAllFiles = async () => {
    const results: ProjectFile[] = [...uploadedFiles.value];

    for (const file of selectedFiles.value) {
        try {
            const { fileId, itemId } = await uploadFile(file);
            results.push({
                type: fileTypes.value[file.name] || FileType.OTHER,
                fileId,
                itemId,
                name: file.name,
                size: file.size,
            });
        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            // Continue with other files
        }
    }

    emit('update:modelValue', results);
    selectedFiles.value = [];
};

const removeUploadedFile = async (index: number) => {
    const token = authStore.token;
    if (!token) {
        console.error('No authentication token');
        return;
    }

    const fileToRemove = uploadedFiles.value[index];
    if (!fileToRemove) return;

    try {
        // Get itemId - fetch from server if not available
        let itemId = fileToRemove.itemId;
        if (!itemId) {
            const fileDetails = await getFileDetails(fileToRemove.fileId, token);
            itemId = fileDetails.itemId;
        }

        // Delete from server using itemId
        await deleteItem(itemId, token);
    } catch (error) {
        console.error(`Failed to delete file ${fileToRemove.fileId}:`, error);
        // Optionally show error to user
    }
    // Remove from local array
    const newFiles = [...uploadedFiles.value];
    newFiles.splice(index, 1);
    emit('update:modelValue', newFiles);
};

const updateFileType = (index: number, newType: FileType) => {
    const newFiles = [...uploadedFiles.value];
    if (index < 0 || index >= newFiles.length) return;

    const oldFile = newFiles[index];
    if (!oldFile) return;

    const { fileId, name, size } = oldFile;
    newFiles[index] = {
        fileId,
        type: newType,
        name,
        size,
    };
    emit('update:modelValue', newFiles);
};

const isUploading = computed(() => uploadingFiles.value.size > 0);
</script>

<template>
    <div class="file-uploader">
        <h3>File Uploads</h3>

        <!-- Display uploaded files -->
        <div v-if="uploadedFiles.length > 0" class="uploaded-files mb-4">
            <h4>Uploaded Files</h4>
            <v-card v-for="(file, index) in uploadedFiles" :key="file.fileId" class="mb-2">
                <v-card-text class="d-flex align-center">
                    <v-select :model-value="file.type" @update:model-value="(value) => updateFileType(index, value)"
                        :items="fileTypeOptions" label="File Type" density="compact"
                        style="min-width: 150px; max-width: 150px;" class="mr-4"></v-select>
                    <div class="flex-grow-1">
                        <div class="font-weight-medium">{{ getFileName(file) }}</div>
                        <div class="text-caption text-grey">{{ getFileSize(file) }}</div>
                    </div>
                    <v-btn icon size="small" class="ml-2" @click="removeUploadedFile(index)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </v-card-text>
            </v-card>
        </div>

        <!-- File selection -->
        <v-file-input v-model="selectedFiles" multiple label="Select files to upload" prepend-icon="mdi-paperclip"
            @update:model-value="onFilesSelected" :disabled="isUploading"></v-file-input>

        <!-- File type selection for each file -->
        <div v-if="selectedFiles.length > 0" class="file-types mb-4">
            <v-card v-for="file in selectedFiles" :key="file.name" class="mb-2">
                <v-card-text class="d-flex align-center">
                    <span class="mr-4 flex-grow-1">{{ file.name }}</span>
                    <v-select v-model="fileTypes[file.name]" :items="fileTypeOptions" label="File Type"
                        density="compact" style="max-width: 200px;"></v-select>

                    <!-- Progress bar for this file -->
                    <div v-if="uploadingFiles.has(file.name)" class="ml-4" style="width: 100px;">
                        <v-progress-linear :model-value="uploadProgress[file.name]" color="primary"
                            height="8"></v-progress-linear>
                    </div>
                </v-card-text>
            </v-card>
        </div>

        <!-- Upload button -->
        <v-btn v-if="selectedFiles.length > 0" @click="uploadAllFiles" color="primary" :disabled="isUploading"
            :loading="isUploading">
            Upload File
        </v-btn>
    </div>
</template>

<style scoped>
.file-uploader {
    margin: 20px 0;
}

.uploaded-files h4 {
    margin-bottom: 10px;
}
</style>
