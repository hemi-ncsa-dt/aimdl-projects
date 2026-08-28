import type { Project, Person, AutocompleteSuggestion, UploadResponse, FileUploadResult } from '@/types';

// Support runtime configuration from Docker or build-time from Vite
const API_BASE_URL = (window as any).ENV?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Absolute URL for downloading a file.
 *
 * Uses the same runtime-resolved base as every other call, so it keeps working when the
 * container is pointed at a different backend. The token goes in the query string
 * because a browser-initiated download (`<a href>`) cannot set the Girder-Token header,
 * and Girder answers 401 without it.
 */
export function getFileDownloadUrl(fileId: string, token?: string | null): string {
    const url = `${API_BASE_URL}/file/${fileId}/download`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let error;
        try {
            error = await response.json();
        } catch (e) {
            error = { message: response.statusText };
        }
        throw new Error(error.message || 'Something went wrong');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null as T;
}

export async function getLoginProviders(redirectUrl: string): Promise<{ name: string; url: string }[]> {
    const response = await fetch(`${API_BASE_URL}/oauth/provider?redirect=${encodeURIComponent(redirectUrl)}&list=true`);
    return (await handleResponse<{ name: string; url: string }[]>(response)) || [];
}

export async function getCurrentUser(token: string): Promise<Person | null> {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
        headers: {
            'Girder-Token': token,
        },
    });
    return handleResponse<Person | null>(response);
}

export async function getProjects(token: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/project`, {
        headers: {
            'Girder-Token': token,
        },
    });
    return (await handleResponse<Project[]>(response)) || [];
}

export async function getProject(id: string, token: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        headers: {
            'Girder-Token': token,
        },
    });
    return handleResponse<Project>(response);
}

export async function createProject(projectData: Omit<Project, '_id' | 'owner' | 'created' | 'updated' | 'submissionFolderId' | 'projectId'>, token: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/project`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Girder-Token': token,
        },
        body: JSON.stringify(projectData),
    });
    return handleResponse<Project>(response);
}

export async function updateProject(id: string, projectData: Partial<Omit<Project, 'projectId'>>, token: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Girder-Token': token,
        },
        body: JSON.stringify(projectData),
    });
    return handleResponse<Project>(response);
}

export async function deleteProject(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/project/${id}`, {
        method: 'DELETE',
        headers: {
            'Girder-Token': token,
        },
    });
    await handleResponse<void>(response);
}

export async function getOrcidSuggestions(query: string, token: string): Promise<AutocompleteSuggestion[]> {
    const response = await fetch(`${API_BASE_URL}/deposition/autocomplete?query=${encodeURIComponent(query)}`, {
        headers: {
            'Girder-Token': token,
        },
    });
    return (await handleResponse<AutocompleteSuggestion[]>(response)) || [];
}

export async function searchUsers(query: string, token: string): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/user?text=${encodeURIComponent(query)}`, {
        headers: {
            'Girder-Token': token,
        },
    });
    return (await handleResponse<Person[]>(response)) || [];
}

// File upload API
export async function initiateUpload(
    parentId: string,
    parentType: 'folder' | 'item',
    name: string,
    size: number,
    token: string,
    mimeType?: string
): Promise<UploadResponse> {
    const params = new URLSearchParams({
        parentId,
        parentType,
        name,
        size: size.toString(),
    });

    if (mimeType) {
        params.append('mimeType', mimeType);
    }

    const response = await fetch(`${API_BASE_URL}/file?${params}`, {
        method: 'POST',
        headers: {
            'Girder-Token': token,
        },
    });
    return handleResponse<UploadResponse>(response);
}

export async function uploadChunk(
    uploadId: string,
    offset: number,
    chunk: Blob,
    token: string
): Promise<UploadResponse | FileUploadResult> {
    const params = new URLSearchParams({
        uploadId,
        offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/file/chunk?${params}`, {
        method: 'POST',
        headers: {
            'Girder-Token': token,
            'Content-Type': 'application/octet-stream',
        },
        body: chunk,
    });
    return handleResponse<UploadResponse | FileUploadResult>(response);
}

export async function getUploadOffset(uploadId: string, token: string): Promise<{ offset: number }> {
    const params = new URLSearchParams({
        uploadId,
    });

    const response = await fetch(`${API_BASE_URL}/file/offset?${params}`, {
        method: 'GET',
        headers: {
            'Girder-Token': token,
        },
    });
    return handleResponse<{ offset: number }>(response);
}

export async function getFileDetails(fileId: string, token: string): Promise<FileUploadResult> {
    const response = await fetch(`${API_BASE_URL}/file/${fileId}`, {
        method: 'GET',
        headers: {
            'Girder-Token': token,
        },
    });
    return handleResponse<FileUploadResult>(response);
}

export async function deleteItem(itemId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/item/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Girder-Token': token,
        },
    });
    await handleResponse<void>(response);
}
