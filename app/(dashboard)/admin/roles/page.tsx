"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Save, Trash2, Shield, Check, X, Info, ChevronRight,
    Search, UserCircle, Settings, LayoutDashboard, Users, User,
    UserPlus, UserMinus, Mail, ShieldCheck, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSION_MODULES, PERMISSION_ACTIONS, PERMISSION_SCOPES } from "@/lib/permissions";

const ROLE_ICON_MAP: Record<string, any> = {
    "Super Admin": Crown,
    "Admin": ShieldCheck,
    "Agent": UserCircle,
    "Counselor": User,
    "Student": Users,
};

const ROLE_COLOR_MAP: Record<string, string> = {
    "Super Admin": "text-yellow-600 bg-yellow-50 border-yellow-200",
    "Admin": "text-blue-600 bg-blue-50 border-blue-200",
    "Agent": "text-purple-600 bg-purple-50 border-purple-200",
    "Counselor": "text-green-600 bg-green-50 border-green-200",
    "Student": "text-slate-600 bg-slate-50 border-slate-200",
};

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("permissions");

    // Permissions form states
    const [roleName, setRoleName] = useState("");
    const [roleDesc, setRoleDesc] = useState("");
    const [roleIsActive, setRoleIsActive] = useState(true);
    const [permissions, setPermissions] = useState<any[]>([]);

    // Users tab states
    const [roleUsers, setRoleUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => { fetchRoles(); }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
                if (data.length > 0 && !selectedRole) {
                    // Default to Admin role, fall back to first if not found
                    const adminRole = data.find((r: any) => r.name === "Admin") || data[0];
                    handleSelectRole(adminRole);
                }
            }
        } catch { toast.error("Failed to fetch roles"); }
        finally { setIsLoading(false); }
    };

    const handleSelectRole = async (role: any) => {
        try {
            const res = await fetch(`/api/roles/${role.id}`);
            if (res.ok) {
                const fullRole = await res.json();
                setSelectedRole(fullRole);
                setRoleName(fullRole.name);
                setRoleDesc(fullRole.description || "");
                setRoleIsActive(fullRole.isActive);
                setPermissions(fullRole.permissions);
                setActiveTab("permissions");
                fetchRoleUsers(fullRole.id);
            }
        } catch { toast.error("Failed to load role details"); }
    };

    const fetchRoleUsers = async (roleId: string) => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`/api/roles/${roleId}/users`);
            if (res.ok) setRoleUsers(await res.json());
        } catch { } finally { setIsLoadingUsers(false); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch("/api/employees?limit=200&status=active");
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data.employees || []);
            }
        } catch { }
    };

    const handleOpenAssignDialog = () => {
        fetchAllUsers();
        setShowAssignDialog(true);
        setUserSearch("");
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedRole) return;
        setIsAssigning(true);
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                toast.success("User assigned to role");
                fetchRoleUsers(selectedRole.id);
                fetchRoles();
                setShowAssignDialog(false);
            } else {
                const e = await res.json();
                toast.error(e.error || "Failed to assign");
            }
        } catch { toast.error("Error assigning user"); }
        finally { setIsAssigning(false); }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!selectedRole) return;
        if (!confirm("Remove this user from the role?")) return;
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}/users`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                toast.success("User removed from role");
                fetchRoleUsers(selectedRole.id);
                fetchRoles();
            } else {
                const e = await res.json();
                toast.error(e.error || "Failed to remove");
            }
        } catch { toast.error("Error removing user"); }
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: roleName, description: roleDesc, isActive: roleIsActive, permissions })
            });
            if (res.ok) { toast.success("Role and permissions updated"); fetchRoles(); }
            else { toast.error("Failed to save changes"); }
        } catch { toast.error("Error saving role"); }
        finally { setIsSaving(false); }
    };

    const togglePermissionAction = (module: string, action: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.module === module) {
                const newActions = p.actions.includes(action)
                    ? p.actions.filter((a: string) => a !== action)
                    : [...p.actions, action];
                return { ...p, actions: newActions };
            }
            return p;
        }));
    };

    const updatePermissionScope = (module: string, scope: string) => {
        setPermissions(prev => prev.map(p => p.module === module ? { ...p, scope } : p));
    };

    const deleteRole = async () => {
        if (!selectedRole || selectedRole.isSystem) return;
        if (!confirm(`Delete "${selectedRole.name}" role?`)) return;
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Role deleted"); setSelectedRole(null); fetchRoles(); }
            else { const e = await res.json(); toast.error(e.error || "Failed to delete"); }
        } catch { toast.error("Error deleting role"); }
    };

    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const filteredAllUsers = allUsers.filter(u =>
        !roleUsers.find(ru => ru.id === u.id) &&
        (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    );

    const getRoleIcon = (name: string) => {
        const Icon = ROLE_ICON_MAP[name] || Shield;
        return Icon;
    };

    const getRoleColor = (name: string) => ROLE_COLOR_MAP[name] || "text-slate-600 bg-slate-50 border-slate-200";

    if (isLoading && roles.length === 0) {
        return <div className="p-10 animate-pulse text-sm text-muted-foreground italic">Loading roles...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
            {/* Sidebar: Role List */}
            <div className="w-72 flex flex-col gap-4 shrink-0">
                <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-sm rounded-3xl">
                    <CardHeader className="p-5 pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <CardTitle className="text-base font-black">System Roles</CardTitle>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{roles.length} roles configured</p>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input
                                placeholder="Search roles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 rounded-xl border-border/60 bg-muted/20 text-xs focus-visible:ring-primary/20"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-1 px-2">
                                {filteredRoles.map(role => {
                                    const Icon = getRoleIcon(role.name);
                                    const colorClass = getRoleColor(role.name);
                                    const isSelected = selectedRole?.id === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSelectRole(role)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left group w-full
                                                ${isSelected ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <div className={`p-2 rounded-xl border text-xs ${isSelected ? "bg-primary text-white border-transparent" : colorClass}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-sm font-bold truncate">{role.name}</span>
                                                    {role.isSystem && (
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1 rounded-sm border-primary/20 text-primary uppercase font-black shrink-0">System</Badge>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground/70 truncate">
                                                    {role._count?.users || 0} assigned user{role._count?.users !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 transition-all shrink-0 ${isSelected ? "opacity-100" : "opacity-0 -translate-x-2"}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {selectedRole ? (
                    <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-sm rounded-3xl">
                        {/* Header */}
                        <CardHeader className="p-6 pb-4 border-b border-border/40 bg-white/50 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl border ${getRoleColor(roleName)}`}>
                                        {(() => { const Icon = getRoleIcon(roleName); return <Icon className="h-5 w-5" />; })()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{roleName}</h2>
                                        <p className="text-xs text-muted-foreground/70">{roleDesc || "No description"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!selectedRole.isSystem && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={deleteRole}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {activeTab === "permissions" && (
                                        <Button disabled={isSaving} onClick={handleSave} className="rounded-xl h-9 px-6 font-bold shadow-sm shadow-primary/20">
                                            {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" />Save</>}
                                        </Button>
                                    )}
                                    {activeTab === "users" && (
                                        <Button onClick={handleOpenAssignDialog} className="rounded-xl h-9 px-5 font-bold shadow-sm shadow-primary/20">
                                            <UserPlus className="h-4 w-4 mr-2" />Assign User
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Inline meta row */}
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Role Name</Label>
                                    <Input value={roleName} onChange={(e) => setRoleName(e.target.value)}
                                        disabled={selectedRole.isSystem}
                                        className="h-9 rounded-xl border-border/60 bg-muted/10 font-bold text-sm focus-visible:ring-primary/20" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description</Label>
                                    <Input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)}
                                        placeholder="Enter description..."
                                        className="h-9 rounded-xl border-border/60 bg-muted/10 text-sm focus-visible:ring-primary/20" />
                                </div>
                            </div>
                        </CardHeader>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                            <div className="px-6 pt-4 shrink-0 border-b border-border/30">
                                <TabsList className="rounded-xl bg-muted/30 h-9 p-1">
                                    <TabsTrigger value="permissions" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Shield className="h-3.5 w-3.5 mr-1.5" />Permissions
                                    </TabsTrigger>
                                    <TabsTrigger value="users" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                        Assigned Users
                                        {roleUsers.length > 0 && (
                                            <span className="ml-1.5 bg-primary text-white rounded-full text-[9px] font-black px-1.5 py-0.5 leading-none">{roleUsers.length}</span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Permissions Tab */}
                            <TabsContent value="permissions" className="flex-1 overflow-hidden mt-0">
                                <ScrollArea className="h-full">
                                    <div className="p-6 pt-4">
                                        {roleName === "Super Admin" && (
                                            <div className="mb-4 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-xs font-medium">
                                                <Crown className="h-4 w-4 shrink-0 text-yellow-600" />
                                                Super Admin has full access to all modules and cannot be restricted.
                                            </div>
                                        )}
                                        <div className="rounded-2xl border border-border/40 overflow-hidden shadow-sm bg-muted/5">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-muted/40 border-b border-border/60">
                                                        <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-1/4">Module</th>
                                                        <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Permissions</th>
                                                        <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-36">Access Scope</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {PERMISSION_MODULES.map(module => {
                                                        const perm = permissions.find(p => p.module === module);
                                                        return (
                                                            <tr key={module} className="border-b border-border/30 hover:bg-white transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className={`p-1.5 rounded-lg ${perm?.actions?.length ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/40'}`}>
                                                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-slate-700">{module.replace(/_/g, " ")}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {PERMISSION_ACTIONS.map(action => (
                                                                            <button key={action}
                                                                                onClick={() => togglePermissionAction(module, action)}
                                                                                disabled={roleName === "Super Admin"}
                                                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border
                                                                                    ${perm?.actions?.includes(action)
                                                                                        ? "bg-slate-900 text-white border-transparent shadow-sm"
                                                                                        : "bg-white text-slate-400 border-border/60 hover:border-slate-300 hover:text-slate-600"}`}
                                                                            >
                                                                                {perm?.actions?.includes(action) ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5 opacity-40 shrink-0" />}
                                                                                {action.toLowerCase()}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <Select value={perm?.scope || "OWN"} onValueChange={(v) => updatePermissionScope(module, v)} disabled={roleName === "Super Admin"}>
                                                                        <SelectTrigger className="h-9 rounded-xl border-border/60 bg-white/50 text-[10px] font-black uppercase tracking-wider">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl">
                                                                            {PERMISSION_SCOPES.map(scope => (
                                                                                <SelectItem key={scope} value={scope} className="text-[10px] font-bold uppercase py-2">{scope} RECORDS</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* Users Tab */}
                            <TabsContent value="users" className="flex-1 overflow-hidden mt-0">
                                <ScrollArea className="h-full">
                                    <div className="p-6 pt-4">
                                        {isLoadingUsers ? (
                                            <div className="text-sm text-muted-foreground animate-pulse py-10 text-center">Loading users...</div>
                                        ) : roleUsers.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                                <div className="p-5 rounded-full bg-muted/20 mb-4">
                                                    <Users className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                                <p className="text-sm font-bold">No users assigned</p>
                                                <p className="text-xs text-muted-foreground mt-1">Click "Assign User" to add users to this role.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {roleUsers.map(user => (
                                                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-md transition-all group">
                                                        <Avatar className="h-10 w-10 rounded-xl border border-border/30">
                                                            <AvatarImage src={user.imageUrl} />
                                                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-black text-sm">
                                                                {user.name?.charAt(0).toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-bold truncate">{user.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Mail className="h-3 w-3 text-muted-foreground/50" />
                                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={`text-[10px] font-bold rounded-lg px-2 uppercase border ${getRoleColor(user.role)}`}>
                                                            {user.role}
                                                        </Badge>
                                                        <div className={`flex items-center gap-1 text-xs font-bold ${user.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                                                            {user.isActive ? "Active" : "Inactive"}
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveUser(user.id)}>
                                                            <UserMinus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </Card>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-card rounded-3xl border border-border/60 opacity-60">
                        <div className="p-6 rounded-full bg-muted/20 mb-6">
                            <Shield className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-black mb-2">Manage User Roles</h3>
                        <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto">Select a role from the sidebar to configure permissions and manage assigned users.</p>
                    </div>
                )}
            </div>

            {/* Assign User Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black">Assign User to {selectedRole?.name}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Search and select a user to assign to this role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input
                                placeholder="Search by name or email..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="pl-9 h-10 rounded-xl bg-muted/10 border-border/60 text-sm"
                                autoFocus
                            />
                        </div>
                        <ScrollArea className="h-72 border border-border/40 rounded-2xl">
                            <div className="p-2 space-y-1">
                                {filteredAllUsers.length === 0 ? (
                                    <div className="text-center py-10 text-xs text-muted-foreground">No users found</div>
                                ) : (
                                    filteredAllUsers.map(user => (
                                        <button key={user.id}
                                            onClick={() => handleAssignUser(user.id)}
                                            disabled={isAssigning}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left">
                                            <Avatar className="h-8 w-8 rounded-xl shrink-0">
                                                <AvatarImage src={user.imageUrl} />
                                                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-black text-xs">
                                                    {user.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold truncate">{user.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] font-bold rounded-md px-1.5 uppercase shrink-0">
                                                {user.role}
                                            </Badge>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
