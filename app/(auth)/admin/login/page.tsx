import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
    console.log('Rendering AdminLoginPage');
    return (
        <AuthLayout>
            <LoginForm loginType="admin" />
        </AuthLayout>
    );
}
