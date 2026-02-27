"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Plus,
    Search,
    RotateCcw,
    Download,
    Upload,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
    Pencil,
    Trash2,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function CoursesPage() {
    const { data: session } = useSession() as any;
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(session?.user?.role);

    // Filters State
    const [countries, setCountries] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("all");
    const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

    // Data State
    const [courses, setCourses] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        fetchCountries();
        fetchCourses();
    }, [page, limit]);

    // Fetch universities when country changes
    useEffect(() => {
        if (selectedCountry !== "all") {
            fetchUniversities(selectedCountry);
        } else {
            setUniversities([]);
            setSelectedUniversity("all");
        }
    }, [selectedCountry]);

    const fetchCountries = async () => {
        try {
            const res = await axios.get("/api/master/countries");
            setCountries(res.data);
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        try {
            const res = await axios.get(`/api/master/universities?countryId=${countryId}`);
            setUniversities(res.data.universities || []);
        } catch (error) {
            console.error("Error fetching universities:", error);
        }
    };

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (selectedCountry !== "all") params.append("countryId", selectedCountry);
            if (selectedUniversity !== "all") params.append("universityId", selectedUniversity);
            if (searchTerm) params.append("search", searchTerm);

            const res = await axios.get(`/api/master/courses?${params.toString()}`);
            setCourses(res.data.courses);
            setTotal(res.data.total);
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error("Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedCountry("all");
        setSelectedUniversity("all");
        setSearchTerm("");
        setPage(1);
        fetchCourses();
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedCountry !== "all") params.append("countryId", selectedCountry);
            if (selectedUniversity !== "all") params.append("universityId", selectedUniversity);
            if (searchTerm) params.append("search", searchTerm);

            const response = await axios.get(`/api/master/courses/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `courses-export-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export courses");
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                    <p className="text-gray-500 text-sm">Manage university courses, intakes, and requirements.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdminOrManager && (
                        <>
                            <Button
                                variant="outline"
                                className="rounded-none border-gray-300 h-10 gap-2 shadow-sm"
                                onClick={() => {/* Open Import Modal */ }}
                            >
                                <Upload className="w-4 h-4" />
                                Import Course
                            </Button>
                            <Button
                                className="rounded-none h-10 gap-2 shadow-md bg-primary hover:bg-primary/90"
                                onClick={() => {/* Open Add Modal */ }}
                            >
                                <Plus className="w-4 h-4" />
                                Add Course
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Collapsible Filter Bar */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div
                    className="px-4 py-3 flex justify-between items-center bg-gray-50 cursor-pointer"
                    onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                >
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                        <Search className="w-4 h-4" />
                        Filter
                    </div>
                    {isFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {!isFilterCollapsed && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Country</label>
                            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                <SelectTrigger className="rounded-none border-gray-300 h-11 focus:ring-1 focus:ring-primary shadow-sm bg-white">
                                    <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {countries.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">University</label>
                            <Select
                                value={selectedUniversity}
                                onValueChange={setSelectedUniversity}
                                disabled={selectedCountry === "all"}
                            >
                                <SelectTrigger className="rounded-none border-gray-300 h-11 focus:ring-1 focus:ring-primary shadow-sm bg-white">
                                    <SelectValue placeholder="Select University" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="all">All Universities</SelectItem>
                                    {universities.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Course name, campus..."
                                    className="pl-9 rounded-none border-gray-300 h-11 focus:ring-1 focus:ring-primary shadow-sm bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 rounded-none h-11 bg-primary hover:bg-primary/90 shadow-md gap-2"
                                onClick={() => { setPage(1); fetchCourses(); }}
                            >
                                <Search className="w-4 h-4" />
                                Search
                            </Button>
                            <Button
                                variant="outline"
                                className="aspect-square p-0 w-11 h-11 rounded-none border-gray-300 hover:bg-gray-50"
                                onClick={handleReset}
                                title="Reset Filters"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Table Container */}
            <div className="bg-white border border-gray-200 shadow-md flex flex-col min-h-[500px]">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:row justify-between items-center gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Show</span>
                        <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
                            <SelectTrigger className="w-20 h-9 rounded-none border-gray-300 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-500">entries</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none hover:bg-green-50 hover:text-green-600 hover:border-green-200 gap-2 border-gray-300 shadow-sm"
                            onClick={handleExport}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel
                        </Button>
                    </div>
                </div>

                {/* Table content - with horizontal scroll */}
                <div className="flex-1 overflow-x-auto">
                    <Table className="min-w-[1500px] border-collapse">
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b-2 border-gray-200">
                                <TableHead className="w-[100px] font-bold text-gray-900 border-x border-gray-200 text-center">Action</TableHead>
                                <TableHead className="w-[120px] font-bold text-gray-900 border-r border-gray-200">Country</TableHead>
                                <TableHead className="w-[200px] font-bold text-gray-900 border-r border-gray-200">University</TableHead>
                                <TableHead className="w-[250px] font-bold text-gray-900 border-r border-gray-200">Course</TableHead>
                                <TableHead className="w-[120px] font-bold text-gray-900 border-r border-gray-200">Campus</TableHead>
                                <TableHead className="w-[150px] font-bold text-gray-900 border-r border-gray-200">Scores</TableHead>
                                <TableHead className="w-[100px] font-bold text-gray-900 border-r border-gray-200">Level</TableHead>
                                <TableHead className="w-[120px] font-bold text-gray-900 border-r border-gray-200 text-center">Duration</TableHead>
                                <TableHead className="w-[180px] font-bold text-gray-900 border-r border-gray-200 text-center">Intake</TableHead>
                                <TableHead className="w-[120px] font-bold text-gray-900 border-r border-gray-200">App Fee</TableHead>
                                <TableHead className="w-[120px] font-bold text-gray-900 border-r border-gray-200">Tuition Fee</TableHead>
                                <TableHead className="w-[150px] font-bold text-gray-900 border-r border-gray-200">Commission</TableHead>
                                <TableHead className="w-[100px] font-bold text-gray-900 border-r border-gray-200 text-center">GPA</TableHead>
                                <TableHead className="w-[150px] font-bold text-gray-900 border-r border-gray-200">Deadline</TableHead>
                                <TableHead className="min-w-[300px] font-bold text-gray-900 border-r border-gray-200">Entry Requirements</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={15} className="h-32 text-center text-gray-500 italic">
                                        Loading courses...
                                    </TableCell>
                                </TableRow>
                            ) : courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={15} className="h-32 text-center text-gray-500 italic">
                                        No courses found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map((course) => (
                                    <TableRow key={course.id} className="hover:bg-gray-50/50 border-b border-gray-100 items-start">
                                        <TableCell className="border-x border-gray-100 p-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-none">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-none">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-100 font-medium text-gray-700">{course.country.name}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-gray-600 leading-tight">{course.university.name}</TableCell>
                                        <TableCell className="border-r border-gray-100 font-semibold text-gray-900 leading-tight">{course.name}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-gray-600">{course.campus || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-xs font-mono space-y-0.5">
                                            {Array.isArray(course.scores) && course.scores.map((s: any, idx: number) => (
                                                <div key={idx} className="whitespace-nowrap">
                                                    <span className="font-bold text-gray-800">{s.exam}</span> - {s.overall || "?"} ({s.subscores || "?"})
                                                </div>
                                            ))}
                                            {!course.scores || (Array.isArray(course.scores) && course.scores.length === 0) ? <span className="text-gray-300 italic">No scores</span> : null}
                                        </TableCell>
                                        <TableCell className="border-r border-gray-100">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${course.level === 'Master' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    course.level === 'Bachelor' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {course.level || "Unknown"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-100 text-center font-mono">{course.durationMonths ? `${course.durationMonths}m` : "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 p-2">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Button
                                                    className="h-8 w-full bg-[#1e293b] hover:bg-[#334155] rounded-none text-[11px] gap-1.5 px-3 uppercase tracking-wider font-bold"
                                                    onClick={() => {/* Open Intake Modal */ }}
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Manage Intake
                                                </Button>
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {course.intakes?.map((i: any) => (
                                                        <span key={i.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-none border border-gray-200 text-gray-600 whitespace-nowrap lowercase">
                                                            {i.month}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-100 font-mono text-gray-600">{course.applicationFee || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 font-mono text-gray-600">{course.tuitionFee || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-gray-600">{course.expectedCommission || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-center font-mono font-bold text-primary">{course.gpaScore || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-xs text-gray-600 leading-tight">{course.deadline || "-"}</TableCell>
                                        <TableCell className="border-r border-gray-100 text-xs text-gray-500 max-h-20 overflow-hidden line-clamp-3 italic">
                                            {course.entryRequirements || "No specific requirements listed."}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-gray-900">{total}</span> entries
                    </div>

                    <Pagination className="justify-end w-auto">
                        <PaginationContent className="rounded-none gap-1">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={`rounded-none border-gray-300 cursor-pointer ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                                />
                            </PaginationItem>

                            {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => {
                                const pNum = i + 1;
                                // Simple pagination logic, showing up to 5 surrounding pages
                                if (pNum === 1 || pNum === Math.ceil(total / limit) || (pNum >= page - 1 && pNum <= page + 1)) {
                                    return (
                                        <PaginationItem key={pNum}>
                                            <PaginationLink
                                                isActive={page === pNum}
                                                onClick={() => setPage(pNum)}
                                                className={`rounded-none border-gray-300 cursor-pointer ${page === pNum ? 'bg-primary text-white border-primary' : ''}`}
                                            >
                                                {pNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                return null;
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(p => p + 1)}
                                    className={`rounded-none border-gray-300 cursor-pointer ${page >= Math.ceil(total / limit) ? 'pointer-events-none opacity-50' : ''}`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
