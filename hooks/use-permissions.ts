"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionModule = "LEADS" | "STUDENTS" | "APPLICATIONS" | "VISA" | "MASTERS" | "ROLES";
type PermissionAction = "VIEW" | "CREATE" | "EDIT" | "DELETE" | "DOWNLOAD" | "PRINT" | "APPROVE";

interface PermissionsState {
    role: string;
    permissions: Record<string, Record<string, boolean>>;
    scopes: Record<string, string>;
    isLoading: boolean;
    isAdmin: boolean;
}

/**
 * Hook to get the current user's permission state.
 * 
 * Usage:
 *   const { can, isLoading } = usePermissions();
 *   if (can("MASTERS", "CREATE")) { ... show Add button ... }
 */
export function usePermissions() {
    const [state, setState] = useState<PermissionsState>({
        role: "",
        permissions: {},
        scopes: {},
        isLoading: true,
        isAdmin: false,
    });

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await fetch("/api/me/permissions");
            if (res.ok) {
                const data = await res.json();
                setState({
                    role: data.role,
                    permissions: data.permissions || {},
                    scopes: data.scopes || {},
                    isLoading: false,
                    isAdmin: data.role === "ADMIN",
                });
            } else {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        } catch {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    /**
     * Check if the current user has a specific permission.
     * Returns true if loading (optimistic) for better UX — 
     * set optimistic=false to block until loaded.
     */
    const can = useCallback(
        (module: PermissionModule, action: PermissionAction, optimistic = true): boolean => {
            if (state.isLoading) return optimistic;
            // ADMIN always can
            if (state.isAdmin) return true;
            return state.permissions[module]?.[action] === true;
        },
        [state]
    );

    /**
     * Get the data scope for a module: "ALL" | "OWN" | "ASSIGNED"
     */
    const scope = useCallback(
        (module: PermissionModule): string => {
            if (state.isAdmin) return "ALL";
            return state.scopes[module] || "OWN";
        },
        [state]
    );

    return {
        can,
        scope,
        isLoading: state.isLoading,
        isAdmin: state.isAdmin,
        role: state.role,
    };
}
