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

export const SORT_FIELDS = ['dueAt', 'status', 'createdAt'] as const;

export const listTasksQuerySchema = z.strictObject({
  sort: z.enum(SORT_FIELDS).default('dueAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(STATUSES).optional(),
});

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const updateTaskStatusSchema = z.strictObject({
  status: z.enum(STATUSES),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
