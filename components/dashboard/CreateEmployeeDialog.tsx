"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EmployeeForm from "@/components/forms/EmployeeForm";

export function CreateEmployeeDialog({ onEmployeeCreated }: { onEmployeeCreated: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Counselor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Counselor</DialogTitle>
                    <DialogDescription>
                        Create a new counselor account. They will receive an email with their login credentials.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <EmployeeForm
                        onSuccess={() => {
                            setOpen(false);
                            onEmployeeCreated();
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
