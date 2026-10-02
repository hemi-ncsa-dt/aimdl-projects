import { FileType } from '@/types';
import { ProjectRole } from '@/types';
import type { AccessCategory, DataClassification, ProjectType, SampleHazard, OtherHazard, MemberStatus } from '@/types';

export interface InstrumentOption {
    value: string;
    label: string;
    /** What the station does -- this is what an applicant choosing one needs. */
    description: string;
    /** What the acronym stands for. Secondary: shown as a tooltip, since it is the only
     *  place the name is explained but it does not help anyone pick a station. */
    expansion: string;
    url: string;
}

/** Real AIMD-L stations. Anything else on a project is freeform "other" text. */
export const KNOWN_INSTRUMENTS = ['MAXIMA', 'HELIX', 'SPHINX'];

/** Instruments offered by the form; the trailing `other` entry is a UI-only pseudo-option. */
export const instrumentOptions: InstrumentOption[] = [
    {
        value: 'MAXIMA',
        label: 'MAXIMA',
        description: 'x-ray diffraction / x-ray fluorescence spectroscopy',
        expansion: 'Multimodal Automated X-ray Investigation of Materials',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745259387828-044ce224-dc05',
    },
    {
        value: 'HELIX',
        label: 'HELIX',
        description: 'laser microflyer impact / laser-driven shock',
        expansion: 'High-throughput Extreme Laser Impact eXperiments',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745356027264-0fcae1de-66a4',
    },
    {
        value: 'SPHINX',
        label: 'SPHINX',
        description: 'nanoindentation',
        expansion: 'Scanning Probe for High-resolution INdentation eXperiments',
        url: 'https://hemi.jhu.edu/caimee/center-facilities/aimd-l/#1745438879173-208b1f97-0fd2',
    },
    {
        value: 'other',
        label: 'Other',
        description: '',
        expansion: '',
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

export interface AccessCategoryOption {
    value: AccessCategory;
    title: string;
}

/** Applicant affiliation. Deliberately unordered: this replaced a numbered list whose
 *  ranking the lab never allocated on, so nothing should read an order into it. */
export const accessCategoryOptions: AccessCategoryOption[] = [
    { value: 'jhu', title: 'Johns Hopkins University' },
    { value: 'external-academic', title: 'External (academic / not-for-profit)' },
    { value: 'external-corporate', title: 'External (corporate / industrial)' },
    { value: 'external-government', title: 'External (government)' },
    { value: 'external-foreign', title: 'External (foreign, non-US)' },
];

/** True for every category that is not JHU, i.e. the ones that must name an organization. */
export function isExternal(value: AccessCategory | undefined): boolean {
    return !!value && value !== 'jhu';
}

export interface DataClassificationOption {
    value: DataClassification;
    title: string;
    description: string;
}

/** How the data a project generates has to be handled. These descriptions are the form's
 *  own: DATA_POLICY_URL is a stub today, so the text here has to stand on its own. */
export const dataClassificationOptions: DataClassificationOption[] = [
    {
        value: 'open',
        title: 'Open',
        description: 'Fundamental research, with no restrictions on publication or sharing.',
    },
    {
        value: 'confidential-proprietary',
        title: 'Confidential / proprietary',
        description: 'Corporate data not for public release, and not export controlled.',
    },
    {
        value: 'confidential-controlled',
        title: 'Confidential / controlled',
        description: 'Corporate or government data subject to export restrictions and/or CUI.',
    },
    {
        value: 'opt-out',
        title: 'Opt-out',
        description: 'Neither confidential nor proprietary, but with restrictions on dissemination.',
    },
];

export const DATA_POLICY_URL = 'https://docs.htmdec.org/aimdl/data-management/';

/** The public overview is only published for work that may be disseminated, so it is only
 *  demanded for those two classifications. */
export function requiresPublicOverview(value: DataClassification | undefined): boolean {
    return value === 'open' || value === 'opt-out';
}

export function projectTypeLabel(value: ProjectType | undefined): string | undefined {
    return projectTypeOptions.find(o => o.value === value)?.title;
}

export function projectTypeDescription(value: ProjectType | undefined): string | undefined {
    return projectTypeOptions.find(o => o.value === value)?.description;
}

export function accessCategoryLabel(value: AccessCategory | undefined): string | undefined {
    return accessCategoryOptions.find(o => o.value === value)?.title;
}

export function dataClassificationLabel(value: DataClassification | undefined): string | undefined {
    return dataClassificationOptions.find(o => o.value === value)?.title;
}

export function dataClassificationDescription(value: DataClassification | undefined): string | undefined {
    return dataClassificationOptions.find(o => o.value === value)?.description;
}

/** Documentation URL for a known instrument; undefined for freeform "other" entries. */
export function instrumentUrl(name: string): string | undefined {
    return instrumentOptions.find(o => o.value === name)?.url || undefined;
}

export function instrumentDescription(name: string): string | undefined {
    return instrumentOptions.find(o => o.value === name)?.description || undefined;
}

export function instrumentExpansion(name: string): string | undefined {
    return instrumentOptions.find(o => o.value === name)?.expansion || undefined;
}

/** Development projects are lab staff changing AIMD-L infrastructure: the submitter is
 *  already known to the reviewers, so the form asks them for almost nothing. */
export function isDevelopment(value: ProjectType | undefined): boolean {
    return value === 'development';
}

/** Only an integrated campaign has to arrive as an uploaded document; a single-instrument
 *  or development proposal is written straight into the form. */
export function requiresProposalDocument(value: ProjectType | undefined): boolean {
    return value === 'integrated';
}

/** The six points Todd's outline asks an integrated proposal to cover. */
export const integratedProposalChecklist = [
    'Context and motivation for the experiment',
    'Knowledge gap or scientific hypothesis to be addressed',
    'Description of the experiments to be performed — stations used, kinds of samples, '
    + 'measurements, and how the data will be analysed',
    'Expected data and outcomes, and how they address the gap or answer the hypothesis',
    'An estimate of the number of days required',
];


export interface FileTypeOption {
    value: FileType;
    title: string;
}

/** `dmp` on its own is unreadable in a dropdown, so the picker shows these. */
export const fileTypeOptions: FileTypeOption[] = [
    { value: FileType.PROPOSAL, title: 'Proposal' },
    { value: FileType.DMP, title: 'Data management plan' },
    { value: FileType.OTHER, title: 'Other' },
];

export function fileTypeLabel(value: string | undefined): string {
    return fileTypeOptions.find(o => o.value === value)?.title || value || 'Other';
}


export interface HazardOption<T> {
    value: T;
    title: string;
}

export const sampleHazardOptions: HazardOption<SampleHazard>[] = [
    { value: 'none', title: 'None' },
    { value: 'toxic', title: 'Toxic' },
    { value: 'flammable', title: 'Flammable' },
    { value: 'energetic', title: 'Energetic' },
    { value: 'biosafety', title: 'Biosafety' },
    { value: 'radioactive', title: 'Radioactive' },
    { value: 'other', title: 'Other' },
];

export const otherHazardOptions: HazardOption<OtherHazard>[] = [
    { value: 'none', title: 'None' },
    { value: 'laser', title: 'Laser (class 3-4)' },
    { value: 'high-temperature', title: 'High temperature' },
    { value: 'high-voltage', title: 'High voltage' },
    { value: 'user-equipment', title: 'Custom or user-supplied equipment' },
];

/** Hazards that normally need a separate institutional approval before work can start. */
export const HAZARDS_NEEDING_APPROVAL: SampleHazard[] = ['biosafety', 'radioactive'];

export function hazardLabels(
    values: readonly string[] | undefined,
    options: HazardOption<string>[],
): string[] {
    return (values || []).map(v => options.find(o => o.value === v)?.title || v);
}

/** A hazard declared with no description is worse than no checklist, so the text becomes
 *  required as soon as anything other than "none" is ticked in either list. */
export function hazardsDeclared(
    sampleHazards: readonly string[] | undefined,
    otherHazards: readonly string[] | undefined,
): boolean {
    return [...(sampleHazards || []), ...(otherHazards || [])].some(h => h !== 'none');
}


export interface MemberStatusOption {
    value: MemberStatus;
    title: string;
}

export const memberStatusOptions: MemberStatusOption[] = [
    { value: 'faculty', title: 'Faculty / senior investigator' },
    { value: 'staff', title: 'Staff' },
    { value: 'postdoc', title: 'Post-doc' },
    { value: 'grad', title: 'Graduate student' },
    { value: 'undergrad', title: 'Undergraduate' },
    { value: 'other', title: 'Other' },
];

export function memberStatusLabel(value: MemberStatus | undefined): string | undefined {
    return memberStatusOptions.find(o => o.value === value)?.title;
}

export interface RoleOption {
    value: ProjectRole;
    title: string;
}

/** `role` is the access level a member gets on the project's data once it is accepted --
 *  the backend turns it into a Girder permission. "Manager" said nothing about that, so
 *  the form names the effect instead. The PI's level is set by the PI checkbox. */
export const roleOptions: RoleOption[] = [
    { value: ProjectRole.MANAGER, title: 'Can add and edit data' },
    { value: ProjectRole.USER, title: 'Can view data' },
];

export function roleLabel(value: ProjectRole | undefined): string {
    if (value === ProjectRole.PI) return 'Full access (PI)';
    return roleOptions.find(o => o.value === value)?.title || value || '';
}

export const ORCID_REGISTER_URL = 'https://orcid.org/register';
