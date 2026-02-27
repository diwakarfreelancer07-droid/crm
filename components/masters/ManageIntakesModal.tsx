"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Trash2, Plus, Loader2 } from "lucide-react";

interface ManageIntakesModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: any;
    onSuccess: () => void;
}

export function ManageIntakesModal({
    isOpen,
    onClose,
    course,
    onSuccess,
}: ManageIntakesModalProps) {
    const [intakes, setIntakes] = useState<any[]>([]);
    const [newIntake, setNewIntake] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && course) {
            setIntakes(course.intakes || []);
        }
    }, [isOpen, course]);

    const handleAddIntake = async () => {
        if (!newIntake.trim()) return;
        setIsLoading(true);
        try {
            const res = await axios.post(`/api/master/courses/${course.id}/intakes`, {
                month: newIntake.trim(),
            });
            setIntakes((prev) => [...prev, res.data]);
            setNewIntake("");
            toast.success("Intake added");
            onSuccess();
        } catch (error) {
            toast.error("Failed to add intake");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveIntake = async (intakeId: string) => {
        setIsActionLoading(intakeId);
        try {
            await axios.delete(`/api/master/courses/${course.id}/intakes/${intakeId}`);
            setIntakes((prev) => prev.filter((i) => i.id !== intakeId));
            toast.success("Intake removed");
            onSuccess();
        } catch (error) {
            toast.error("Failed to remove intake");
        } finally {
            setIsActionLoading(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 rounded-none border-none">
                <DialogHeader className="p-6 bg-[#1e293b] text-white">
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Manage Intakes
                    </DialogTitle>
                    <p className="text-gray-400 text-xs mt-1">
                        {course?.name} - {course?.university?.name}
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Add Intake */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Add New Intake</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. Aug-2026"
                                className="rounded-none h-11 border-gray-300"
                                value={newIntake}
                                onChange={(e) => setNewIntake(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddIntake()}
                            />
                            <Button
                                className="rounded-none h-11 bg-primary hover:bg-primary/90"
                                onClick={handleAddIntake}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Intake List */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Existing Intakes</Label>
                        <div className="space-y-2 border border-gray-100 p-2 min-h-[100px] max-h-[300px] overflow-y-auto bg-gray-50/30">
                            {intakes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm italic">
                                    No intakes defined for this course.
                                </div>
                            ) : (
                                intakes.map((intake) => (
                                    <div
                                        key={intake.id}
                                        className="flex justify-between items-center p-3 bg-white border border-gray-200 group animate-in slide-in-from-left-2 duration-200"
                                    >
                                        <span className="font-semibold text-gray-700">{intake.month}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            onClick={() => handleRemoveIntake(intake.id)}
                                            disabled={isActionLoading === intake.id}
                                        >
                                            {isActionLoading === intake.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-gray-50">
                    <Button variant="outline" className="rounded-none w-full border-gray-300" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
