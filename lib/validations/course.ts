import { z } from "zod";

export const courseScoreSchema = z.object({
    exam: z.enum(["IELTS", "TOEFL", "PTE", "GMAT", "GRE", "SAT", "ACT", "Duolingo"]),
    overall: z.union([z.number(), z.string()]).optional(),
    subscores: z.union([z.number(), z.string()]).optional(),
});

export const courseSchema = z.object({
    name: z.string().min(1, "Course name is required"),
    universityId: z.string().min(1, "University is required"),
    countryId: z.string().min(1, "Country is required"),
    campus: z.string().optional().nullable(),
    level: z.enum(["Bachelor", "Master", "PhD", "Diploma", "Certificate", "Associate", "Foundation"]).optional().nullable(),
    durationMonths: z.number().int().optional().nullable(),
    applicationFee: z.string().optional().nullable(),
    tuitionFee: z.string().optional().nullable(),
    expectedCommission: z.string().optional().nullable(),
    gpaScore: z.number().optional().nullable(),
    deadline: z.string().optional().nullable(),
    entryRequirements: z.string().optional().nullable(),
    scores: z.array(courseScoreSchema).optional().nullable(),
    intakes: z.array(z.string()).optional(), // Array of month strings for initial creation
});

export const intakeSchema = z.object({
    month: z.string().min(1, "Intake month is required"),
});
