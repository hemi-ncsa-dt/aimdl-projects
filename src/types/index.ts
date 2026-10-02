export type ProjectStatus = 'draft' | 'under review' | 'accepted' | 'rejected';
export type ProjectType = 'integrated' | 'singleInstrument' | 'development';

/** Applicant affiliation. Unranked -- it replaced a numbered `priority` list whose
 *  ordering the lab never actually allocated on. */
export type AccessCategory =
    | 'jhu'
    | 'external-academic'
    | 'external-corporate'
    | 'external-government'
    | 'external-foreign';

/** How the data this project generates must be handled. Describes the material coming
 *  into the lab, not the proposal documents uploaded here. */
export type DataClassification =
    | 'open'
    | 'confidential-proprietary'
    | 'confidential-controlled'
    | 'opt-out';

export interface Grant {
    agency: string;
    grantNumber: string;
}

export interface Funding {
    grants: Grant[];
    /** JHU internal budget/IO number. */
    internalBudgetNumber: string;
}

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
    projectType?: ProjectType;
    instruments?: { name: string }[];
    accessCategory?: AccessCategory;
    /** Home institution/company. Asked of external applicants only. */
    organization?: string;
    dataClassification?: DataClassification;
    funding?: Funding;
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
    groups: string[];
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