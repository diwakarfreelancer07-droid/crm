export interface User {
    id: string;
    firstName: string;
    lastName: string;
    name?: string; // Derived or direct name
    email?: string;
    phone: string;
    role: string;
    isActive: boolean;
    profilePicture?: string | null;
    imageUrl?: string | null;
}

export interface SavedAddress {
    id?: string;
    name: string; // e.g. Home, Work
    address: string;
    city: string;
    state: string;
    country: string;
    isDefault?: boolean;
}

export interface Student {
    id: string;
    userId: string;
    name?: string; // Full name from DB
    address?: string;
    status?: string; // NEW, UNDER_REVIEW, etc.
    dob?: string;
    gender?: string;
    items?: any[]; // For array of items if needed
    user?: User; // Nested user object from API
    createdAt?: string;
    updatedAt?: string;
    // Keep these as optional for flat structure support if needed, or remove if strict
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    savedAddresses?: SavedAddress[];
    imageUrl?: string | null;
    leadId?: string | null;
    lead?: Lead;
    applications?: Application[];
    _count?: {
        applications: number;
    };
}

export interface Employee {
    id: string;
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    designation?: string;
    joiningDate?: string;
    salary?: number;
    createdAt?: string;
    updatedAt?: string;
    imageUrl?: string | null;
    role?: string;
    managerId?: string;
    manager?: { name: string };
}

export interface Lead {
    id?: string;
    name: string;
    email?: string;
    phone: string;
    source?: string; // e.g., Website, Referral, Cold Call
    status?: string; // e.g., New, Contacted, Qualified, Unqualified
    message?: string;
    campaignId?: string;
    temperature?: string; // HOT, WARM, COLD
    imageUrl?: string | null;
    interestedCountry?: string;
}

export interface CreateLeadDTO {
    name: string;
    email?: string;
    phone: string;
    source?: string;
    status?: string;
    temperature?: string;
    message?: string;
    imageUrl?: string | null;
}

export type ApplicationStatus =
    | 'PENDING'
    | 'SUBMITTED'
    | 'FINALIZED'
    | 'UNDER_REVIEW'
    | 'OFFER_RECEIVED'
    | 'READY_FOR_VISA'
    | 'ENROLLED'
    | 'REJECTED'
    | 'WITHDRAWN';

export interface Application {
    id: string;
    studentId: string;
    student?: Student;
    status: ApplicationStatus;
    universityId: string;
    university?: { name: string; id: string } | null;
    courseId?: string | null;
    courseName?: string | null;
    course?: { name: string; id: string } | null;
    intake?: string | null;
    intendedCourse?: string | null;
    applyLevel?: string | null;
    countryId: string;
    country?: { name: string; id: string } | null;
    notes?: string | null;
    associateId?: string | null;
    associate?: { name: string; id: string; role?: string } | null;
    deadlineDate?: string | null;
    assignedById?: string | null;
    assignedBy?: { id: string; name: string; role: string } | null;
    assignedToId?: string | null;
    assignedTo?: { id: string; name: string; role: string } | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        notes: number;
    };
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors?: any;
}
