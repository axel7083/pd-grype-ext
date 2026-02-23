import { z } from 'zod';

export const GrypeOutputSchema = z.object({
  matches: z.array(
    z.object({
      vulnerability: z.object({
        id: z.string(),
        severity: z
          .enum(['High', 'Medium', 'Critical', 'Low'])
          .transform(severity => severity.toLowerCase() as 'high' | 'medium' | 'critical' | 'low'),
        description: z.string().optional(),
      }),
    }),
  ),
});

export type GrypeOutput = z.output<typeof GrypeOutputSchema>;
