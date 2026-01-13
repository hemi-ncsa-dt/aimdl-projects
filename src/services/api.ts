import type { Project, Person } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export async function createProject(projectData: Omit<Project, 'owner' | 'created' | 'updated'>, token: string): Promise<Project> {
    console.log('Creating project with data:', projectData);
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
