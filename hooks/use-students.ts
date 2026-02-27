import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
// import { Customer } from "@prisma/client"; // Verify Customer model existence

// Assuming Student model exists or using any for now
interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    // ... other fields
}

interface FetchStudentsParams {
    search?: string;
    page?: number;
    limit?: number;
}

export function useStudents({ search = "", page = 1, limit = 10 }: FetchStudentsParams = {}) {
    return useQuery({
        queryKey: ["students", { search, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const { data } = await axios.get<{ students: Student[]; total: number; totalPages: number }>(
                `/api/students?${params.toString()}`
            );
            return data;
        },
    });
}

export function useStudent(id: string) {
    return useQuery({
        queryKey: ["student", id],
        queryFn: async () => {
            const { data } = await axios.get<Student>(`/api/students/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (studentData: Partial<Student>) => {
            const { data } = await axios.post("/api/students", studentData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });
}

export function useUpdateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
            const response = await axios.patch(`/api/students/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["student", variables.id] });
        },
    });
}

export function useDeleteStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/students/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });
}
