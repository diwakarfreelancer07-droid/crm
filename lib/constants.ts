
export const LeadSource = {
    WEBSITE_1: 'WEBSITE_1',
    WEBSITE_2: 'WEBSITE_2',
    WEBSITE_3: 'WEBSITE_3',
    WEBSITE_4: 'WEBSITE_4',
    INTERFX: 'INTERFX',
    REFERRAL: 'REFERRAL',
    SOCIAL_MEDIA: 'SOCIAL_MEDIA',
    WALK_IN: 'WALK_IN',
    OTHER: 'OTHER'
} as const;

export type LeadSource = typeof LeadSource[keyof typeof LeadSource];
