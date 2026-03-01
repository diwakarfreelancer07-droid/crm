"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRolePath } from "@/hooks/use-role-path";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
    ArrowLeft,
    History,
    Pencil,
    Trash2,
    User,
    Phone,
    Mail,
    Globe,
    Briefcase,
    GraduationCap,
    MapPin,
    FileText,
    BookOpen,
    FolderOpen,
    Database,
} from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import StudentDocumentsSection from "@/components/student/StudentDocumentsSection";
import VisaApplicationsSection from "@/components/student/VisaApplicationsSection";
import { AddVisaApplicationModal } from "@/components/student/AddVisaApplicationModal";
import { UniversityApplicationsSection } from "@/components/student/UniversityApplicationsSection";

function InfoField({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const { prefixPath } = useRolePath();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "overview";
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addVisaModalOpen, setAddVisaModalOpen] = useState(false);
    const [prefilledVisaData, setPrefilledVisaData] = useState<any>(null);

    // Activity Pagination State
    const [activities, setActivities] = useState<any[]>([]);
    const [activityPagination, setActivityPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        variant: "default" as "default" | "destructive",
        onConfirm: async () => { },
        isLoading: false,
    });

    const openConfirm = (
        title: string,
        description: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "default",
        confirmText = "Confirm"
    ) => {
        setConfirmConfig({
            isOpen: true,
            title,
            description,
            confirmText,
            variant,
            onConfirm,
            isLoading: false,
        });
    };

    const handleConfirmAction = async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmConfig.onConfirm();
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Confirmation action failed", error);
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const fetchStudent = async () => {
        try {
            const response = await axios.get(`/api/students/${params.id}`);
            setStudent(response.data);
            if (response.data.lead?.id) {
                fetchActivities(1, response.data.lead.id);
            }
        } catch (error) {
            toast.error("Failed to fetch student details");
            router.push(prefixPath("/students"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivities = async (page: number, leadId?: string, limitOverride?: number) => {
        const targetLeadId = leadId || student?.lead?.id;
        const currentLimit = limitOverride || activityPagination.limit;
        if (!targetLeadId) return;

        setIsActivitiesLoading(true);
        try {
            const response = await axios.get(`/api/leads/${targetLeadId}/activities?page=${page}&limit=${currentLimit}`);
            setActivities(response.data.activities);
            setActivityPagination({
                ...activityPagination,
                page: response.data.pagination.page,
                totalPages: response.data.pagination.totalPages,
                total: response.data.pagination.total,
                limit: currentLimit
            });
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setIsActivitiesLoading(false);
        }
    };

    const handleDeleteStudent = () => {
        openConfirm(
            "Delete Student",
            "Are you sure you want to delete this student?",
            async () => {
                try {
                    await axios.delete(`/api/students/${params.id}`);
                    toast.success("Student deleted successfully");
                    router.push(prefixPath("/students"));
                } catch (error: any) {
                    toast.error(error.response?.data?.error || "Failed to delete student");
                }
            },
            "destructive",
            "Delete"
        );
    };

    useEffect(() => {
        fetchStudent();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (!student) return null;

    const lead = student.lead;

    const tabs = [
        { id: "overview", label: "Personal Details", icon: <User className="h-3.5 w-3.5" /> },
        { id: "documents", label: "Documents", icon: <FolderOpen className="h-3.5 w-3.5" /> },
        { id: "applications", label: "University Application", icon: <Briefcase className="h-3.5 w-3.5" /> },
        { id: "visa", label: "Visa Application", icon: <Globe className="h-3.5 w-3.5" /> },
        { id: "activity", label: "Activity", icon: <History className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-8 w-8 hover:bg-muted"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Visa Application Details</h1>
                    <p className="text-xs text-muted-foreground">Complete profile of the student and their applications</p>
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="w-full bg-slate-100 border border-border/50 rounded-xl h-11 p-1 overflow-x-auto overflow-y-hidden no-scrollbar">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex-1 text-[11px] font-bold rounded-lg data-[state=active]:bg-[#3e3a8e] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap min-w-[80px]"
                        >
                            {tab.icon}
                            <span className="ml-1.5 hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* === OVERVIEW TAB === */}
                <TabsContent value="overview" className="mt-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Left: Profile Card */}
                        <div className="lg:col-span-1 space-y-5">
                            <Card className="border border-border rounded-2xl bg-card shadow-none">
                                <CardHeader className="pb-2 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</p>
                                            <CardTitle className="text-lg font-bold">{student.name}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Contact</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Phone</span>
                                                <span className="font-semibold">{student.phone}</span>
                                            </div>
                                            {student.email && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Email</span>
                                                    <span className="font-semibold text-primary truncate max-w-[160px]">{student.email}</span>
                                                </div>
                                            )}
                                            {lead?.alternateNo && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Alternate</span>
                                                    <span className="font-semibold">{lead.alternateNo}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">System Info</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Onboarded By</span>
                                                <span className="font-semibold">{student.user.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Joined</span>
                                                <span className="font-semibold">{new Date(student.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {lead && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Lead Status</span>
                                                    <Badge className={`rounded-lg py-0.5 px-2 text-[10px] font-bold border-none ${lead.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-600' : lead.status === 'LOST' ? 'bg-red-500/10 text-red-600' : lead.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                                        {lead.status}
                                                    </Badge>
                                                </div>
                                            )}
                                            {lead?.source && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Source</span>
                                                    <span className="font-semibold capitalize">{lead.source.toLowerCase().replace(/_/g, ' ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
                                        <Button
                                            className="w-full bg-primary hover:bg-primary/90 rounded-xl h-9 text-sm font-bold shadow-sm"
                                            onClick={() => router.push(prefixPath(`/students/${params.id}/applications/add`))}
                                        >
                                            <Briefcase className="h-3.5 w-3.5 mr-2" />
                                            Move to Application
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-primary/20 hover:bg-primary/5 rounded-xl h-9 text-sm font-semibold"
                                            onClick={() => router.push(prefixPath(`/students/${params.id}/edit`))}
                                        >
                                            <Pencil className="h-3.5 w-3.5 mr-2" />
                                            Edit Student
                                        </Button>
                                        {session?.user?.role === "ADMIN" && (
                                            <Button
                                                variant="ghost"
                                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl h-9 text-sm"
                                                onClick={handleDeleteStudent}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                Delete Student
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Detail Cards */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Personal Details */}
                            {lead && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary" /> Personal Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <InfoField label="Date of Birth" value={lead.dateOfBirth ? new Date(lead.dateOfBirth).toLocaleDateString() : null} />
                                            <InfoField label="Gender" value={lead.gender} />
                                            <InfoField label="Nationality" value={lead.nationality} />
                                            <InfoField label="Marital Status" value={lead.maritalStatus} />
                                            <InfoField label="Alternate Phone" value={lead.alternateNo} />
                                            <InfoField label="Address" value={lead.address} />
                                            <InfoField label="Message" value={lead.message} />
                                            <InfoField label="Remark" value={lead.remark} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Education & Application */}
                            {lead && (lead.highestQualification || lead.interestedCourse || lead.interestedCountry || lead.applyLevel || lead.intake || lead.testName) && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-primary" /> Education & Application
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <InfoField label="Highest Qualification" value={lead.highestQualification} />
                                            <InfoField label="Interested Course" value={lead.interestedCourse} />
                                            <InfoField label="Interested Country" value={lead.interestedCountry} />
                                            <InfoField label="Apply Level" value={lead.applyLevel} />
                                            <InfoField label="Intake" value={lead.intake} />
                                            <InfoField label="Test Name" value={lead.testName} />
                                            <InfoField label="Test Score" value={lead.testScore} />
                                            <InfoField label="Proficiency Exams" value={Array.isArray(lead.proficiencyExams) && lead.proficiencyExams.length > 0 ? (lead.proficiencyExams as string[]).join(", ") : null} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Passport Details */}
                            {(student.passportNo || lead?.passportNo || lead?.passportIssueDate || lead?.passportExpiryDate) && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary" /> Passport Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <InfoField label="Passport No." value={student.passportNo || lead?.passportNo} />
                                            <InfoField label="Issue Date" value={(student.passportIssueDate || lead?.passportIssueDate) ? new Date(student.passportIssueDate || lead.passportIssueDate).toLocaleDateString() : null} />
                                            <InfoField label="Expiry Date" value={(student.passportExpiryDate || lead?.passportExpiryDate) ? new Date(student.passportExpiryDate || lead.passportExpiryDate).toLocaleDateString() : null} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Academic Details */}
                            {lead?.academicDetails && (lead.academicDetails as any[]).length > 0 && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-primary" /> Academic Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        {(lead.academicDetails as any[]).map((a: any, i: number) => (
                                            <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                                <InfoField label="Qualification" value={a.qualification} />
                                                <InfoField label="Stream" value={a.stream} />
                                                <InfoField label="Institution" value={a.institution} />
                                                <InfoField label="Percentage" value={a.percentage} />
                                                <InfoField label="Backlogs" value={a.backlogs} />
                                                <InfoField label="Passing Year" value={a.passingYear} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Work Experience */}
                            {lead?.workExperience && (lead.workExperience as any[]).length > 0 && (
                                <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-primary" /> Work Experience
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        {(lead.workExperience as any[]).map((w: any, i: number) => (
                                            <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                                <InfoField label="Company" value={w.companyName} />
                                                <InfoField label="Position" value={w.position} />
                                                <InfoField label="Start Date" value={w.startDate} />
                                                <InfoField label="End Date" value={w.endDate} />
                                                <InfoField label="Experience" value={w.totalExperience} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* === DOCUMENTS TAB === */}
                <TabsContent value="documents" className="mt-5">
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardContent className="p-5">
                            <StudentDocumentsSection
                                studentId={student.id}
                                interestedCountry={lead?.interestedCountry}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === UNIVERSITY APPLICATIONS TAB === */}
                <TabsContent value="applications" className="mt-5">
                    <UniversityApplicationsSection
                        studentId={student.id}
                        studentName={student.name}
                    />
                </TabsContent>

                {/* === VISA TAB === */}
                <TabsContent value="visa" className="mt-5">
                    <VisaApplicationsSection
                        studentId={student.id}
                        studentName={student.name}
                    />
                </TabsContent>


                {/* === ACTIVITY TAB === */}
                <TabsContent value="activity" className="mt-5">
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border/50 bg-white">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Activity History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 bg-white">
                            {isActivitiesLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : activities && activities.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {activities.map((activity: any) => (
                                        <div
                                            key={activity.id}
                                            className="p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 px-2 rounded-md bg-primary/10 text-primary border-0">
                                                        {activity.type.replace("_", " ")}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        {new Date(activity.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                                    {activity.user?.name || "System"}
                                                </p>
                                            </div>
                                            <p className="text-sm text-foreground/90 leading-relaxed">{activity.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/50">
                                    <History className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="text-xs font-medium italic tracking-tight">No activity recorded yet</p>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground font-medium">Rows per page</p>
                                    <Select
                                        value={activityPagination.limit.toString()}
                                        onValueChange={(value) => {
                                            setActivityPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
                                            setTimeout(() => fetchActivities(1, undefined, Number(value)), 0);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[60px] text-xs bg-background border-border/50">
                                            <SelectValue placeholder={activityPagination.limit.toString()} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[5, 10, 20, 50].map((pageSize) => (
                                                <SelectItem key={pageSize} value={pageSize.toString()} className="text-xs">
                                                    {pageSize}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {activityPagination.total > 0
                                            ? `${(activityPagination.page - 1) * activityPagination.limit + 1}-${Math.min(activityPagination.page * activityPagination.limit, activityPagination.total)} of ${activityPagination.total}`
                                            : "No activities"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5"
                                            onClick={() => fetchActivities(activityPagination.page - 1)}
                                            disabled={activityPagination.page <= 1 || isActivitiesLoading}
                                        >
                                            {"<"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5"
                                            onClick={() => fetchActivities(activityPagination.page + 1)}
                                            disabled={activityPagination.page >= activityPagination.totalPages || isActivitiesLoading}
                                        >
                                            {">"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                isLoading={confirmConfig.isLoading}
            />

            <AddVisaApplicationModal
                isOpen={addVisaModalOpen}
                onClose={() => {
                    setAddVisaModalOpen(false);
                    setPrefilledVisaData(null);
                }}
                studentId={student.id}
                studentName={student.name}
                initialApplicationId={prefilledVisaData?.id}
                onSuccess={() => {
                    toast.success("Visa application initiated");
                }}
            />
        </div>
    );
}
