// Recurring days a deal runs on (weekly, not calendar dates). These exact
// strings are the only accepted forms; other casing or spelling is rejected.
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Day = (typeof DAYS)[number];

export interface Deal {
  title: string;
  venue: string;
  // Free text ("50% off", "2-for-1"): discounts share no common structure to model.
  discount: string;
  // A Google Maps URL.
  location: string;
  // Stored and returned, but not yet used to filter.
  days: Day[];
}
