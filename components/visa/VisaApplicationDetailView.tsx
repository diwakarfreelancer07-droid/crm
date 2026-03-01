"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    FolderOpen,
    Database,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Plane,
    Clock,
    FileText,
    Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useRolePath } from "@/hooks/use-role-path";
import StudentDocumentsSection from "@/components/student/StudentDocumentsSection";
import { UniversityApplicationDetailTable } from "@/components/application/UniversityApplicationDetailTable";
import { VisaApplicationDetailTable } from "./VisaApplicationDetailTable";
import StudentLoginDetailsSection from "@/components/student/StudentLoginDetailsSection";
import StudentAccountDetailsSection from "@/components/student/StudentAccountDetailsSection";

interface VisaApplicationDetailViewProps {
    visaApplication: any;
    onUpdate?: () => void;
    onOpenHistory?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
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

export function VisaApplicationDetailView({
    visaApplication,
    onUpdate,
    onOpenHistory,
    onOpenNotes
}: VisaApplicationDetailViewProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const student = visaApplication.student;
    const lead = student?.lead;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "VISA_APPROVED":
            case "VISA_GRANTED":
                return "bg-white/20 text-white border-white/30";
            case "VISA_REJECTED":
            case "VISA_REFUSED":
                return "bg-rose-500/20 text-white border-rose-500/30";
            default:
                return "bg-white/10 text-white border-white/20";
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-2 sm:p-4">
            {/* Header Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-5 flex items-center justify-between">
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
                                <h1 className="text-xl font-bold text-white tracking-tight">{student?.name}</h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-indigo-100 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 opacity-70" /> {student?.email}
                                    </span>
                                    <span className="text-xs text-indigo-100 flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 opacity-70" /> {student?.phone}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`${getStatusStyle(visaApplication.status)} rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest`}>
                                {visaApplication.status.replace(/_/g, ' ')}
                            </Badge>
                            <Button variant="outline" className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-bold gap-2">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Visa Case
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="visa" className="w-full">
                <TabsList className="w-full bg-slate-100/80 p-1.5 h-12 rounded-2xl border border-slate-200/50 mb-6 flex overflow-x-auto gap-1">
                    <TabsTrigger value="personal" className="flex-1 min-w-[120px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <User className="h-4 w-4" /> Personal
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1 min-w-[120px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <FolderOpen className="h-4 w-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="university" className="flex-1 min-w-[150px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <Database className="h-4 w-4" /> Univ Application
                    </TabsTrigger>
                    <TabsTrigger value="visa" className="flex-1 min-w-[150px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <Plane className="h-4 w-4" /> Visa Application
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex-1 min-w-[120px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <FileText className="h-4 w-4" /> Login Details
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex-1 min-w-[120px] rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-bold gap-2 transition-all">
                        <Clock className="h-4 w-4" /> Account Details
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1 w-1 rounded-full bg-primary" /></div>
                                    Identity & Origin
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Date of Birth" value={lead?.dateOfBirth ? new Date(lead.dateOfBirth).toLocaleDateString() : "N/A"} icon={Calendar} />
                                    <InfoField label="Gender" value={lead?.gender} />
                                    <InfoField label="Nationality" value={lead?.nationality} icon={MapPin} />
                                    <InfoField label="Marital Status" value={lead?.maritalStatus} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-100 flex items-center justify-center"><div className="h-1 w-1 rounded-full bg-indigo-600" /></div>
                                    Contact Details
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Phone" value={student?.phone} icon={Phone} />
                                    <InfoField label="Email" value={student?.email} icon={Mail} />
                                    <InfoField label="Permanent Address" value={lead?.address} icon={MapPin} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-none shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-100 flex items-center justify-center"><div className="h-1 w-1 rounded-full bg-emerald-600" /></div>
                                    Academic Interest
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Highest Qualification" value={lead?.highestQualification} />
                                    <InfoField label="Interested Country" value={lead?.interestedCountry} icon={MapPin} />
                                    <InfoField label="Preferred Intake" value={lead?.intake} icon={Calendar} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

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

                <TabsContent value="university" className="focus-visible:ring-0">
                    <UniversityApplicationDetailTable
                        applications={visaApplication.universityApplication ? [visaApplication.universityApplication] : []}
                        onUpdate={onUpdate}
                    />
                </TabsContent>

                <TabsContent value="visa" className="focus-visible:ring-0">
                    <VisaApplicationDetailTable
                        applications={[visaApplication]}
                        onUpdate={onUpdate}
                        onOpenHistory={onOpenHistory}
                        onOpenNotes={onOpenNotes}
                    />
                </TabsContent>

                <TabsContent value="login" className="focus-visible:ring-0">
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-6">
                            <StudentLoginDetailsSection
                                studentId={student?.id}
                                initialData={student?.loginDetails}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="focus-visible:ring-0">
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-6">
                            <StudentAccountDetailsSection
                                studentId={student?.id}
                                initialData={student?.accountDetails}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
