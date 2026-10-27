const { z } = require('zod');

const createAssignmentSchema = z
  .object({
    title: z
      .string({ required_error: 'Assignment title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    subject: z
      .string({ required_error: 'Subject is required' })
      .trim()
      .min(1, 'Subject cannot be empty')
      .max(100, 'Subject cannot exceed 100 characters'),
    description: z.string().optional().default(''),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid due date' })
      .transform((val) => new Date(val)),
    estimatedMinutes: z
      .number({ required_error: 'Estimated minutes is required' })
      .int('Estimated minutes must be an integer')
      .positive('Estimated minutes must be greater than 0')
      .max(60000, 'Estimated minutes cannot exceed 60,000'),
    remainingMinutes: z
      .number()
      .int('Remaining minutes must be an integer')
      .nonnegative('Remaining minutes cannot be negative')
      .optional(),
    importance: z
      .number({ required_error: 'Importance is required' })
      .int('Importance must be an integer')
      .min(1, 'Importance must be between 1 and 5')
      .max(5, 'Importance must be between 1 and 5')
      .default(3),
    status: z.enum(['pending', 'completed']).optional().default('pending'),
  })
  .refine(
    (data) => {
      if (data.remainingMinutes !== undefined) {
        return data.remainingMinutes <= data.estimatedMinutes;
      }
      return true;
    },
    {
      message: 'Remaining minutes cannot exceed estimated minutes',
      path: ['remainingMinutes'],
    }
  );

const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
    subject: z.string().trim().min(1, 'Subject cannot be empty').max(100).optional(),
    description: z.string().optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid due date' })
      .transform((val) => new Date(val))
      .optional(),
    estimatedMinutes: z.number().int().positive('Estimated minutes must be positive').optional(),
    remainingMinutes: z.number().int().nonnegative('Remaining minutes cannot be negative').optional(),
    importance: z.number().int().min(1).max(5).optional(),
    status: z.enum(['pending', 'completed']).optional(),
  });

module.exports = {
  createAssignmentSchema,
  updateAssignmentSchema,
};
