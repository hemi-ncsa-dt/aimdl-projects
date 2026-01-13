import type { St } from "vue-router/dist/router-CWoNjPRp.mjs";

export interface Project {
    id: string; // DOI
    name: string;
    description: string;
    owner: Person;
    members: Person[];
    samples: Sample[];
    createdAt: Date;
    updatedAt: Date;
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
