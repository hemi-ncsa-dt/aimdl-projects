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
    id: string; // IGSN
    name: string;
    description: string;
    projectId: string[]; // A sample can be in multiple projects
    createdAt: Date;
    updatedAt: Date;
}

export interface Person {
    id: string;
    name: string;
    email: string;
    organization: string;
}

export interface Group {
    id: string;
    name: string;
    members: Person[];
}
