import { z } from 'zod';

// Recurring days a deal runs on (weekly, not calendar dates). These exact
// strings are the only accepted forms; other casing or spelling is rejected.
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Day = (typeof DAYS)[number];

// strictObject rejects unknown keys, so a mis-typed field (e.g. "titel") is caught.
export const DealSchema = z.strictObject({
  title: z.string().trim().min(1, { error: 'must not be empty' }),
  venue: z.string().trim().min(1, { error: 'must not be empty' }),
  // Free text ("50% off", "2-for-1"): discounts share no common structure to model.
  discount: z.string().trim().min(1, { error: 'must not be empty' }),
  // A Google Maps URL.
  location: z.string().trim().min(1, { error: 'must not be empty' }),
  // Stored and returned, but not yet used to filter.
  days: z
    .array(
      z.enum(DAYS, {
        error: (issue) => `unrecognised day ${JSON.stringify(issue.input)}`,
      }),
    )
    .min(1, { error: 'must list at least one day' }),
});

export const DealsSchema = z.array(DealSchema);

export type Deal = z.infer<typeof DealSchema>;
