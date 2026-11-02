import { z } from 'zod';
import { STATUSES } from './statuses';

export const createTaskSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(STATUSES),
  dueAt: z.iso
    .datetime({ offset: true, abort: true })
    .refine((value) => new Date(value) > new Date(), { params: { code: 'DATE_IN_PAST' } }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
