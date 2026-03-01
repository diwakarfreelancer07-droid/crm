import api from '../lib/axios';
import { Student, Employee, ApiResponse } from '../types/api';

export const getStudents = async (page = 1, limit = 10, search = ""): Promise<{ students: Student[], pagination: any }> => {
    return api.get(`/students?page=${page}&limit=${limit}&search=${search}`);
};

export const createStudent = async (data: Partial<Student>): Promise<Student> => {
    return api.post('/students', data);
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<Student> => {
    return api.patch(`/students/${id}`, data);
};

export const deleteStudent = async (id: string): Promise<void> => {
    return api.delete(`/students/${id}`);
};

export const getEmployees = async (page = 1, limit = 10): Promise<{ employees: Employee[], pagination: any }> => {
    return api.get(`/employees?page=${page}&limit=${limit}`);
};

export const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
    return api.post('/employees', data);
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return api.patch(`/employees/${id}`, data);
};

export const deleteEmployee = async (id: string): Promise<void> => {
    return api.delete(`/employees/${id}`);
};

// Applications
export const getApplications = async (page = 1, limit = 10, search = '', studentId?: string, status?: string | null): Promise<{ applications: any[], pagination: any }> => {
    let url = `/applications?page=${page}&limit=${limit}&search=${search}`;
    if (studentId) url += `&studentId=${studentId}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
};

export const createApplication = async (data: any): Promise<any> => {
    return api.post('/applications', data);
};

export const updateApplication = async (id: string, data: any): Promise<any> => {
    return api.patch(`/applications/${id}`, data);
};

export const deleteApplication = async (id: string): Promise<void> => {
    return api.delete(`/applications/${id}`);
};

export const deleteApplicationsBulk = async (ids: string[]): Promise<void> => {
    return api.delete(`/applications/bulk`, { data: { ids } });
};

// Visa Applications
export const getVisaApplications = async (studentId?: string, page = 1, limit = 10, search = "", status = ""): Promise<{ visaApplications: any[], pagination: any }> => {
    let url = `/visa-applications?page=${page}&limit=${limit}&search=${search}&status=${status}`;
    if (studentId) url += `&studentId=${studentId}`;
    return api.get(url);
};

export const createVisaApplication = async (data: any): Promise<any> => {
    return api.post('/visa-applications', data);
};

export const updateVisaApplication = async (id: string, data: any): Promise<any> => {
    return api.patch(`/visa-applications/${id}`, data);
};

export const deleteVisaApplication = async (id: string): Promise<void> => {
    return api.delete(`/visa-applications/${id}`);
};
