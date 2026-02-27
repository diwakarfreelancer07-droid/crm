"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/use-role-path";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    User,
    Calendar,
    Globe,
    School,
    Book,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    MapPin,
    Stethoscope,
    Fingerprint,
    CreditCard
} from "lucide-react";

export default function VisaApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [visaApp, setVisaApp] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVisaApplication = async () => {
        try {
            const response = await axios.get(`/api/visa-applications/${params.id}`);
            setVisaApp(response.data);
        } catch (error: any) {
            console.error("Failed to fetch visa application:", error);
            toast.error("Failed to load visa application details");
            router.push(prefixPath("/visa-applications"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchVisaApplication();
        }
    }, [params.id]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DOCUMENTS_COLLECTED": return "bg-sky-100 text-sky-700 border-sky-200";
            case "SUBMITTED": return "bg-amber-100 text-amber-700 border-amber-200";
            case "UNDER_REVIEW": return "bg-purple-100 text-purple-700 border-purple-200";
            case "APPROVED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
            case "WITHDRAWN": return "bg-slate-100 text-slate-700 border-slate-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!visaApp) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{visaApp.student?.name}</h1>
                        <p className="text-sm text-slate-500 font-medium">{visaApp.visaType.replace(/_/g, ' ')} Application</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-4 py-1.5 rounded-xl font-bold text-xs ${getStatusStyle(visaApp.status)}`}>
                        {visaApp.status.replace(/_/g, ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <School className="h-4 w-4 text-primary" />
                                Academic & Destination Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 p-1 uppercase">Country</label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <Globe className="h-4 w-4 text-slate-400" />
                                            {visaApp.country?.name}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 p-1 uppercase">University</label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <School className="h-4 w-4 text-slate-400" />
                                            {visaApp.university?.name || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 p-1 uppercase">Course</label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <Book className="h-4 w-4 text-slate-400" />
                                            {visaApp.course?.name || visaApp.universityApplication?.intendedCourse || "N/A"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 p-1 uppercase">Intake</label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {visaApp.intake || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Visa Timeline & Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Applied On</span>
                                    <span className="text-sm font-bold text-slate-700">{new Date(visaApp.applicationDate).toLocaleDateString()}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase">Appointment</span>
                                    <span className="text-sm font-bold text-slate-700">{visaApp.appointmentDate ? new Date(visaApp.appointmentDate).toLocaleDateString() : "Pending"}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Decision Date</span>
                                    <span className="text-sm font-bold text-slate-700">{visaApp.decisionDate ? new Date(visaApp.decisionDate).toLocaleDateString() : "Awaiting"}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Expiry Date</span>
                                    <span className="text-sm font-bold text-slate-700">{visaApp.expiryDate ? new Date(visaApp.expiryDate).toLocaleDateString() : "N/A"}</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Checklist Compliance</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-4 w-4 text-indigo-500" />
                                            <span className="text-xs font-bold text-slate-700">GIC/Tuition Paid</span>
                                        </div>
                                        {visaApp.gicTuitionFeePaid ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-300" />}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Stethoscope className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-slate-700">Medical Done</span>
                                        </div>
                                        {visaApp.medicalDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-300" />}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Fingerprint className="h-4 w-4 text-amber-500" />
                                            <span className="text-xs font-bold text-slate-700">Biometrics Done</span>
                                        </div>
                                        {visaApp.biometricsDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-300" />}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Student & Officer */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-primary/5 p-4 border-b border-primary/10">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                <User className="h-4 w-4" />
                                Student Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">
                                {visaApp.student?.name?.charAt(0)}
                            </div>
                            <h3 className="font-bold text-slate-900">{visaApp.student?.name}</h3>
                            <p className="text-xs font-medium text-slate-500 mb-6">{visaApp.student?.email}</p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                    <span className="text-xs font-bold text-slate-700">{visaApp.student?.phone}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Student ID</span>
                                    <span className="text-xs font-bold text-slate-700">{visaApp.student?.id?.substring(0, 8)}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Officer</span>
                                    <span className="text-xs font-bold text-slate-700">{visaApp.assignedOfficer?.name || "Not Assigned"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 p-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                Remarks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-xs text-slate-600 bg-slate-50/80 p-4 rounded-xl italic font-medium">
                                {visaApp.remarks || "No additional remarks provided."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
