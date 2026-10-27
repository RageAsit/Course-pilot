const { z } = require('zod');

const generatePlanSchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }),
  horizonDays: z
    .number()
    .int('Horizon days must be an integer')
    .min(1, 'Horizon must be at least 1 day')
    .max(30, 'Horizon cannot exceed 30 days')
    .optional()
    .default(7),
  dailyCapacityMinutes: z
    .number()
    .int('Daily capacity must be an integer')
    .min(15, 'Daily capacity must be at least 15 minutes')
    .max(720, 'Daily capacity cannot exceed 720 minutes (12 hours)')
    .optional()
    .default(180),
  preferredSessionMinutes: z
    .number()
    .int('Session length must be an integer')
    .min(15, 'Session length must be at least 15 minutes')
    .max(180, 'Session length cannot exceed 180 minutes')
    .optional()
    .default(45),
});

module.exports = {
  generatePlanSchema,
};
