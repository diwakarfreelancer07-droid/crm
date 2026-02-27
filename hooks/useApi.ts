import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStudents, createStudent, updateStudent, deleteStudent,
    getEmployees, createEmployee, updateEmployee, deleteEmployee,
    getApplications, createApplication, updateApplication, deleteApplication, deleteApplicationsBulk,
    getVisaApplications, createVisaApplication, updateVisaApplication, deleteVisaApplication
} from '../services/api';

import { toast } from 'sonner';

// Students
export const useStudents = (page = 1, limit = 10, search = "") => {
    return useQuery({
        queryKey: ['students', page, limit, search],
        queryFn: async () => {
            return await getStudents(page, limit, search);
        },
    });
};

export const useCreateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStudent,
        onSuccess: (response: any) => {
            toast.success(response.message || 'Student created successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

export const useUpdateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateStudent(id, data),
        onSuccess: (response: any) => {
            toast.success(response.message || 'Student updated successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

export const useDeleteStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStudent,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Student deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

// Employees
export const useEmployees = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['employees', page, limit],
        queryFn: async () => {
            return await getEmployees(page, limit);
        },
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateEmployee(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

// Applications
export const useApplications = (page = 1, limit = 10, search = '', status: string | null = null) => {
    return useQuery({
        queryKey: ['applications', page, limit, search, status],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search,
                ...(status && { status })
            });
            const response = await fetch(`/api/applications?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch applications');
            return response.json();
        },
    });
};

export const useUpdateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateApplication(id, data),
        onSuccess: () => {
            toast.success('Application updated successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

export const useDeleteApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteApplication,
        onSuccess: () => {
            toast.success('Application deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

export const useBulkDeleteApplications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteApplicationsBulk,
        onSuccess: () => {
            toast.success('Applications deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

// Visa Applications
export const useVisaApplications = (studentId?: string, page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['visa-applications', studentId, page, limit],
        queryFn: async () => {
            return await getVisaApplications(studentId, page, limit);
        },
    });
};

export const useCreateVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createVisaApplication,
        onSuccess: () => {
            toast.success('Visa application created successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useUpdateVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateVisaApplication(id, data),
        onSuccess: () => {
            toast.success('Visa application updated successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useDeleteVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteVisaApplication,
        onSuccess: () => {
            toast.success('Visa application deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

