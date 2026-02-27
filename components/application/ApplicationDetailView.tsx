"use client";

import { Application } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    FolderOpen,
    Database,
    Lock,
    Wallet,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UniversityApplicationDetailTable } from "./UniversityApplicationDetailTable";
import StudentDocumentsSection from "@/components/student/StudentDocumentsSection";
import { Badge } from "@/components/ui/badge";
import { useRolePath } from "@/hooks/use-role-path";

interface ApplicationDetailViewProps {
    application: Application;
    onUpdate?: () => void;
}

function InfoField({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground/90">{value || "—"}</p>
        </div>
    );
}

export function ApplicationDetailView({ application, onUpdate }: ApplicationDetailViewProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const student = application.student as any;
    const lead = student?.lead;

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-2 sm:p-4">
            {/* Header / Summary Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-xl h-9 w-9"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">{student?.name || "Application Details"}</h1>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-blue-100 flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {student?.email || "No Email"}
                                    </span>
                                    <span className="text-xs text-blue-100 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {student?.phone || "No Phone"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                                {application.status}
                            </Badge>
                            <Button variant="outline" className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-bold gap-2">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Basic Info
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="university" className="w-full">
                <TabsList className="w-full bg-slate-100/80 p-1.5 h-12 rounded-2xl border border-slate-200/50 mb-6">
                    <TabsTrigger value="personal" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-xs font-bold gap-2 transition-all">
                        <User className="h-4 w-4" /> Personal Details
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-xs font-bold gap-2 transition-all">
                        <FolderOpen className="h-4 w-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="university" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-xs font-bold gap-2 transition-all">
                        <Database className="h-4 w-4" /> University Application
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-xs font-bold gap-2 transition-all">
                        <Lock className="h-4 w-4" /> Login Details
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-xs font-bold gap-2 transition-all">
                        <Wallet className="h-4 w-4" /> Account Details
                    </TabsTrigger>
                </TabsList>

                {/* --- PERSONAL DETAILS TAB --- */}
                <TabsContent value="personal" className="focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-xs font-bold text-primary uppercase tracking-tight flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Identity & Origin
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Date of Birth" value={lead?.dateOfBirth ? new Date(lead.dateOfBirth).toLocaleDateString() : null} icon={Calendar} />
                                    <InfoField label="Gender" value={lead?.gender} />
                                    <InfoField label="Nationality" value={lead?.nationality} icon={MapPin} />
                                    <InfoField label="Marital Status" value={lead?.maritalStatus} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-tight flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    Contact Details
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Phone" value={student?.phone} icon={Phone} />
                                    <InfoField label="Email" value={student?.email} icon={Mail} />
                                    <InfoField label="Alternate No" value={lead?.alternateNo} />
                                    <InfoField label="Permanent Address" value={lead?.address} icon={MapPin} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-tight flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Interest & Motivation
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Highest Qualification" value={lead?.highestQualification} />
                                    <InfoField label="Interested Country" value={lead?.interestedCountry} icon={MapPin} />
                                    <InfoField label="Intake" value={lead?.intake} icon={Calendar} />
                                    <InfoField label="Message" value={lead?.message} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- DOCUMENTS TAB --- */}
                <TabsContent value="documents" className="focus-visible:ring-0">
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-6">
                            <StudentDocumentsSection
                                studentId={student?.id}
                                interestedCountry={lead?.interestedCountry}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- UNIVERSITY APPLICATION TAB --- */}
                <TabsContent value="university" className="focus-visible:ring-0">
                    <UniversityApplicationDetailTable
                        applications={[application]}
                        onUpdate={onUpdate}
                        onAdd={() => router.push(prefixPath(`/students/${application.studentId}/applications/add`))}
                    />
                </TabsContent>

                {/* --- LOGIN DETAILS TAB --- */}
                <TabsContent value="login" className="focus-visible:ring-0">
                    <Card className="rounded-2xl border-none shadow-sm max-w-2xl">
                        <CardContent className="p-6 space-y-6">
                            <h4 className="text-sm font-bold text-foreground/80 flex items-center gap-2 border-b pb-3 border-slate-100">
                                <Lock className="h-4 w-4 text-primary" /> System Access Details
                            </h4>
                            <div className="grid grid-cols-2 gap-8">
                                <InfoField label="Username / Email" value={student?.user?.email} icon={Mail} />
                                <InfoField label="Role" value={student?.user?.role} />
                                <InfoField label="Account Status" value={student?.user?.isActive ? "Active" : "Inactive"} />
                                <InfoField label="Password" value="••••••••" />
                            </div>
                            <div className="pt-2">
                                <Button variant="outline" className="rounded-xl h-9 text-xs font-bold text-primary border-primary/20 hover:bg-primary/5">
                                    Reset Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ACCOUNT DETAILS TAB --- */}
                <TabsContent value="account" className="focus-visible:ring-0">
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-border">
                                <Wallet className="h-8 w-8" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground/70">No Financial Records Found</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                This section will display application fees, deposits, and other financial records once they are processed.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
