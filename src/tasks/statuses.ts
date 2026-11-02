export const STATUSES = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE'] as const;
export type Status = (typeof STATUSES)[number];
