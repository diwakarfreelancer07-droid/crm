"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// import axios from "axios"; // Removing axios
import { useProfile, useUpdateProfile, useUpdatePassword } from "@/hooks/use-profile";
import { toast } from "sonner";
import { User, Mail, Phone, Briefcase, Key, Shield, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isSaving, setIsSaving] = useState(false);

    // Profile Query
    const { data: profileData, isLoading } = useProfile();
    const updateProfileMutation = useUpdateProfile();
    const updatePasswordMutation = useUpdatePassword();

    // Profile State (initialized from query data)
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        role: "",
        phone: "",
        department: "",
    });

    // Update local state when data is fetched
    useEffect(() => {
        if (profileData) {
            setProfile({
                name: profileData.name || "",
                email: profileData.email || "",
                role: profileData.role || "",
                phone: profileData.employeeProfile?.phone || "",
                department: profileData.employeeProfile?.department || "",
            });
        }
    }, [profileData]);

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfileMutation.mutateAsync({
                name: profile.name,
                phone: profile.phone,
                department: profile.department,
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsSaving(true);
        try {
            await updatePasswordMutation.mutateAsync({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success("Password changed successfully");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">My Profile</h1>
                <p className="text-xs text-muted-foreground">Manage your personal settings and account security</p>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[320px] bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="details" className="rounded-lg text-xs font-semibold">Account</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg text-xs font-semibold">Security</TabsTrigger>
                </TabsList>

                {/* Account Details Tab */}
                <TabsContent value="details" className="mt-6">
                    <Card className="border border-border rounded-2xl bg-card shadow-none">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-8">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border border-primary/20">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-muted/50 border-0">
                                        {profile.role}
                                    </Badge>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="h-9 text-sm rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Email</Label>
                                            <Input
                                                id="email"
                                                value={profile.email}
                                                disabled
                                                className="h-9 text-sm rounded-xl bg-muted/30 border-dashed"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Phone</Label>
                                            <PhoneInput
                                                value={profile.phone}
                                                onChange={(value) => setProfile({ ...profile, phone: value })}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="department" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Department</Label>
                                            <Input
                                                id="department"
                                                value={profile.department}
                                                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                className="h-9 text-sm rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                                placeholder="e.g. Sales"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button type="submit" className="bg-primary hover:bg-primary/90 h-9 rounded-xl text-sm px-6" disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                                            Update Profile
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-6">
                    <Card className="border border-border rounded-2xl bg-card shadow-none">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-sm font-bold">Account Security</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-sm">
                                <div className="space-y-1.5">
                                    <Label htmlFor="current" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Current Password</Label>
                                    <PasswordInput
                                        id="current"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        className="h-9 text-sm rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="new" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">New Password</Label>
                                        <PasswordInput
                                            id="new"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="h-9 text-sm rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirm" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Confirm Password</Label>
                                        <PasswordInput
                                            id="confirm"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="h-9 text-sm rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" variant="destructive" className="h-9 rounded-xl text-xs px-6 font-bold uppercase tracking-wider" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        Secure Account
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
