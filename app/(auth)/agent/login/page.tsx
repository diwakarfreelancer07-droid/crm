import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AgentLoginPage() {
    return (
        <AuthLayout>
            <LoginForm loginType="agent" />
        </AuthLayout>
    );
}
