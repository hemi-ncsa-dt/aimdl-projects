import type { ProjectType } from '@/types';

export interface InstrumentOption {
    value: string;
    label: string;
    description: string;
    url: string;
}

/** Real AIMD-L stations. Anything else on a project is freeform "other" text. */
export const KNOWN_INSTRUMENTS = ['MAXIMA', 'HELIX', 'SPHINX'];

/** Instruments offered by the form; the trailing `other` entry is a UI-only pseudo-option. */
export const instrumentOptions: InstrumentOption[] = [
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

export interface ProjectTypeOption {
    value: ProjectType;
    title: string;
    description: string;
}

export const projectTypeOptions: ProjectTypeOption[] = [
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

export interface PriorityOption {
    value: number;
    title: string;
}

/** Access categories, in descending priority order. */
export const priorityOptions: PriorityOption[] = [
    { value: 1, title: 'CAIMEE principal investigator (or collaborator)' },
    { value: 2, title: 'Researcher from primary partner institution' },
    { value: 3, title: 'HEMI fellow' },
    { value: 4, title: 'WSE faculty' },
    { value: 5, title: 'Other JHU faculty' },
    { value: 6, title: 'External researcher' },
];

export function projectTypeLabel(value: ProjectType | undefined): string | undefined {
    return projectTypeOptions.find(o => o.value === value)?.title;
}

export function projectTypeDescription(value: ProjectType | undefined): string | undefined {
    return projectTypeOptions.find(o => o.value === value)?.description;
}

export function priorityLabel(value: number | undefined): string | undefined {
    return priorityOptions.find(o => o.value === value)?.title;
}

/** Documentation URL for a known instrument; undefined for freeform "other" entries. */
export function instrumentUrl(name: string): string | undefined {
    return instrumentOptions.find(o => o.value === name)?.url || undefined;
}

export function instrumentDescription(name: string): string | undefined {
    return instrumentOptions.find(o => o.value === name)?.description || undefined;
}
