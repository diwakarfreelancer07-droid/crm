"use client";

import { useState, useRef } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Upload,
    Download,
    FileSpreadsheet,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ImportCoursesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = "SELECT" | "PREVIEW";

export function ImportCoursesModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportCoursesModalProps) {
    const [step, setStep] = useState<Step>("SELECT");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get("/api/master/courses/import", {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'course-import-template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download template");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("confirm", "false");

        try {
            const res = await axios.post("/api/master/courses/import", formData);
            setPreviewData(res.data.rows);
            setErrors(res.data.errors);
            setStep("PREVIEW");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process file");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!selectedFile) return;
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("confirm", "true");

        try {
            const res = await axios.post("/api/master/courses/import", formData);
            toast.success(res.data.message);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Import failed");
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep("SELECT");
        setSelectedFile(null);
        setPreviewData([]);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl p-0 rounded-none border-none max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 bg-[#166534] text-white shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Bulk Import Courses
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`h-1.5 w-12 rounded-full ${step === 'SELECT' ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`h-1.5 w-12 rounded-full ${step === 'PREVIEW' ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === "SELECT" ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-12 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <FileSpreadsheet className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Upload your file</h3>
                                <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                                    Upload the Excel file containing course details.
                                    Ensure you follow the template structure for a successful import.
                                </p>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx"
                                />
                                <Button
                                    className="rounded-none h-12 px-8 bg-green-700 hover:bg-green-800 gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Choose File
                                </Button>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-6 flex items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-700 rounded-none">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900">Don't have the template?</h4>
                                        <p className="text-sm text-blue-700/80">Download our sample Excel template to get started with the correct format.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-none border-blue-200 text-blue-700 hover:bg-blue-100 mt-1 whitespace-nowrap"
                                    onClick={handleDownloadTemplate}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-100 text-green-700">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">{previewData.length} Rows</span>
                                        <span className="text-sm text-gray-500 ml-2">Identified for import</span>
                                    </div>
                                </div>
                                {errors.length > 0 && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm font-bold">{errors.length} Errors Found</span>
                                    </div>
                                )}
                            </div>

                            <div className="border border-gray-200 overflow-hidden">
                                <div className="max-h-[350px] overflow-auto">
                                    <Table className="min-w-[1200px] border-collapse">
                                        <TableHeader className="sticky top-0 z-10 bg-white">
                                            <TableRow className="bg-gray-50 border-b-2">
                                                <TableHead className="w-[60px]">Row</TableHead>
                                                <TableHead className="w-[120px]">Status</TableHead>
                                                <TableHead className="w-[150px]">Country</TableHead>
                                                <TableHead className="w-[200px]">University</TableHead>
                                                <TableHead className="w-[250px]">Course Name</TableHead>
                                                <TableHead className="w-[100px]">Campus</TableHead>
                                                <TableHead>Errors</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((row) => {
                                                const rowErrors = errors.filter(e => e.row === row.rowNumber);
                                                return (
                                                    <TableRow key={row.rowNumber} className={rowErrors.length > 0 ? "bg-red-50/30" : ""}>
                                                        <TableCell className="font-mono text-gray-400">{row.rowNumber}</TableCell>
                                                        <TableCell>
                                                            {rowErrors.length > 0 ? (
                                                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 uppercase">Invalid</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 uppercase">Valid</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{row._display.country}</TableCell>
                                                        <TableCell className="text-xs">{row._display.university}</TableCell>
                                                        <TableCell className="font-semibold text-xs">{row.name}</TableCell>
                                                        <TableCell>{row.campus || "-"}</TableCell>
                                                        <TableCell className="text-red-500 text-xs italic">
                                                            {rowErrors.map(e => e.message).join(", ")}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-gray-50 flex justify-between shrink-0">
                    {step === "PREVIEW" ? (
                        <>
                            <Button variant="ghost" className="rounded-none gap-2 hover:bg-gray-200" onClick={reset}>
                                <ArrowLeft className="w-4 h-4" />
                                Back to Upload
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-none h-11 px-8 border-gray-300" onClick={onClose}>Cancel</Button>
                                <Button
                                    className="rounded-none h-11 px-10 bg-green-700 hover:bg-green-800 shadow-md gap-2"
                                    disabled={isLoading || errors.length > 0}
                                    onClick={handleConfirmImport}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                    Confirm Import
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div />
                            <Button variant="outline" className="rounded-none h-11 px-8 border-gray-300" onClick={onClose}>Cancel</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
