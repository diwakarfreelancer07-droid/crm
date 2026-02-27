"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { AddUniversityApplicationForm } from "@/components/student/AddUniversityApplicationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/use-role-path";

export default function AddApplicationPage() {
    const params = useParams();
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await axios.get(`/api/students/${params.id}`);
                setStudent(response.data);
            } catch (error) {
                console.error("Failed to fetch student", error);
                toast.error("Failed to load student details");
                router.push(prefixPath("/students"));
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchStudent();
        }
    }, [params.id, router, prefixPath]);

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                <Skeleton className="h-40 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-60 rounded-3xl" />
                    <Skeleton className="col-span-3 h-[500px] rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="p-4 sm:p-6">
            <AddUniversityApplicationForm
                studentId={student.id}
                studentName={student.name}
                studentEmail={student.email}
                studentPhone={student.phone}
                onSuccess={() => {
                    toast.success("Applications added successfully");
                    router.push(prefixPath(`/students/${student.id}?tab=applications`));
                }}
                onCancel={() => router.back()}
            />
        </div>
    );
}
