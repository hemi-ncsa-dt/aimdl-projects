export type ProjectStatus = 'draft' | 'under review' | 'accepted' | 'rejected';

export enum FileType {
    PROPOSAL = 'proposal',
    CV = 'cv',
    OTHER = 'other',
}

export interface ProjectFile {
    type: FileType;
    fileId: string;
    itemId?: string;
    name?: string;
    size?: number;
}

export interface Project {
    _id: string; // DOI
    name: string;
    description: string;
    owner: Person;
    members: ProjectMember[];
    samples: Sample[];
    status: ProjectStatus;
    created: Date;
    updated: Date;
    submissionFolderId: string;
    files?: ProjectFile[];
    projectId: string;
}

export interface Sample {
    _accessLevel: number;
    _modelType: "deposition";
    _id: string; // IGSN
    created: Date;
    creatorId: string;
    igsn: string;
    metadata: Map<string, any>;
    parentId: string | null;
    public: boolean
    state: string;
    updated: Date;
}

export interface Person {
    _accessLevel: number;
    _id: string;
    _modelType: "user";
    admin: boolean;
    created: Date;
    login: string;
    firstName: string;
    lastName: string;
    email: string;
    public: boolean;
    groups: String[];
}

export interface Group {
    _id: string;
    _accessLevel: number;
    _modelType: "group";
    created: Date;
    description: string;
    public: boolean;
    name: string;
    members: Person[];
}

export interface Folder {
    _id: string;
    _modelType: "folder";
    _accessLevel: number;
    baseParentId: string;
    baseParentType: string;
    created: Date;
    creatorId: string;
    description: string;
    meta: Record<string, any>;
    name: string;
    parentCollection: string;
    parentId: string;
    public: boolean;
    size: number;
    updated: Date;
}

export interface Item {
    _id: string;
    _modelType: "item";
    _accessLevel: number;
    baseParentId: string;
    baseParentType: string;
    created: Date;
    creatorId: string;
    description: string;
    folderId: string;
    meta: Record<string, any>;
    name: string;
    size: number;
    updated: Date;
}

export enum ProjectRole {
    PI = 'PI',
    MANAGER = 'manager',
    USER = 'user',
}

export interface ProjectMember {
    firstName: string;
    lastName: string;
    orcidId: string;
    role: ProjectRole;
    email: string;
    userId: string | null;
}

export interface AutocompleteSuggestion {
    text: string;
    value: number;
}

export interface File {
    _id: string;
    _modelType: "file";
    _accessLevel: number;
    name: string;
    itemId: string;
    size: number;
    created: Date;
    creatorId: string;
    public: boolean;
}

export interface UploadResponse {
    _id: string;
    _modelType: 'upload';
    created: Date;
    itemId?: string;
    received: number;
    size: number;
    userId: string;
}

export interface FileUploadResult {
    _id: string;
    _modelType: 'file';
    itemId: string;
    name: string;
    size: number;
    mimeType: string;
}