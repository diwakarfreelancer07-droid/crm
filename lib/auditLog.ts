import { prisma } from "./prisma";

export const AuditLogService = {
    async log({
        userId,
        action,
        module,
        entity,
        entityId,
        previousValues,
        newValues,
        metadata
    }: {
        userId: string;
        action: "CREATED" | "UPDATED" | "DELETED";
        module: string;
        entity: string;
        entityId: string;
        previousValues?: any;
        newValues?: any;
        metadata?: any;
    }) {
        try {
            return await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    module,
                    entity,
                    entityId,
                    previousValues: previousValues ? JSON.parse(JSON.stringify(previousValues)) : null,
                    newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
                    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
                },
            });
        } catch (error) {
            console.error("Failed to create audit log:", error);
            // We don't throw here to avoid failing the main transaction
        }
    }
};
