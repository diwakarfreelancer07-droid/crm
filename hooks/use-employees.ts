import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User } from "@prisma/client"; // Assuming Employee uses User model? Or Employee? Checking.

// Based on previous files, it seems Employees might be Users with specific roles.
// Let's assume 'User' or 'Employee' model. Providing 'any' for now or checking schema is better.
// Checking 'EmployeesTable.tsx' usage would be good.
// But to proceed, I will use 'any' temporarily or 'User' if I can verify.
// I'll stick to a generic approach or 'User'.

interface EmployeeStats {
    total: number;
    active: number;
    inactive: number;
}

export function useEmployeeStats(role?: string) {
    return useQuery({
        queryKey: ["employee-stats", role],
        queryFn: async () => {
            const params = role ? `?role=${role}` : "";
            const { data } = await axios.get<EmployeeStats>(`/api/employees/stats${params}`);
            return data;
        },
    });
}

interface Employee extends User {
    // any extra fields
}

export const useEmployees = (status: string = "all", page: number = 1, limit: number = 10, role?: string) => {
    return useQuery({
        queryKey: ["employees", status, page, limit, role],
        queryFn: async () => {
            const params = new URLSearchParams({
                status,
                page: page.toString(),
                limit: limit.toString(),
            });
            if (role) {
                params.append("role", role);
            }
            const endpoint = role === 'AGENT' ? '/api/agents' : role === 'COUNSELOR' ? '/api/counselors' : '/api/employees';
            const { data } = await axios.get(`${endpoint}?${params}`);
            return data;
        },
    });
};

export function useEmployee(id: string, role?: string) {
    return useQuery({
        queryKey: ["employee", id, role],
        queryFn: async () => {
            const endpoint = role === 'AGENT' ? '/api/agents' : role === 'COUNSELOR' ? '/api/counselors' : '/api/employees';
            const { data } = await axios.get<Employee>(`${endpoint}/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employeeData: any) => {
            console.log("Creating employee with payload:", employeeData);
            const role = employeeData.role;
            const endpoint = role === 'AGENT' ? '/api/agents' : role === 'COUNSELOR' ? '/api/counselors' : '/api/employees';
            const { data } = await axios.post(endpoint, employeeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["agents"] }); // Add these if needed
            queryClient.invalidateQueries({ queryKey: ["counselors"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const role = data.role;
            const endpoint = role === 'AGENT' ? '/api/agents' : role === 'COUNSELOR' ? '/api/counselors' : '/api/employees';
            const response = await axios.patch(`${endpoint}/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["counselors"] });
            queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
        },
    });
}

export function useToggleEmployeeStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await axios.patch(`/api/employees/${id}`, { isActive });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
            queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/employees/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
        },
    });
}
