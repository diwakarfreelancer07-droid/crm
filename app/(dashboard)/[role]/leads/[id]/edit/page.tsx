"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditLeadPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "",
        temperature: "",
        message: "",
    });

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const response = await axios.get(`/api/leads/${id}`);
                const lead = response.data;
                setFormData({
                    name: lead.name || "",
                    email: lead.email || "",
                    phone: lead.phone || "",
                    source: lead.source || "",
                    status: lead.status || "",
                    temperature: lead.temperature || "",
                    message: lead.message || "",
                });
            } catch (error) {
                toast.error("Failed to load lead details");
                router.push("/leads");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchLead();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.patch(`/api/leads/${id}`, formData);
            toast.success("Lead updated successfully");
            router.push("/leads");
        } catch (error) {
            toast.error("Failed to update lead");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Card className="max-w-2xl mx-auto rounded-3xl shadow-xl border-0 overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-8">
            <Card className="max-w-2xl mx-auto rounded-3xl shadow-xl border-0 overflow-hidden bg-card">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-2xl font-bold">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select
                                    value={formData.source}
                                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEBSITE_1">Website 1</SelectItem>
                                        <SelectItem value="WEBSITE_2">Website 2</SelectItem>
                                        <SelectItem value="WEBSITE_3">Website 3</SelectItem>
                                        <SelectItem value="WEBSITE_4">Website 4</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                                        <SelectItem value="CONVERTED">Converted</SelectItem>
                                        <SelectItem value="LOST">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature</Label>
                                <Select
                                    value={formData.temperature}
                                    onValueChange={(v) => setFormData({ ...formData, temperature: v })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select temperature" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COLD">Cold</SelectItem>
                                        <SelectItem value="WARM">Warm</SelectItem>
                                        <SelectItem value="HOT">Hot</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Note/Message</Label>
                            <textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 rounded-xl"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
