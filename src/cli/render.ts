import type { Deal } from '../core/deal.js';

export function formatDeals(deals: Deal[]): string {
  if (deals.length === 0) {
    return 'No deals found.';
  }

  const header = `${deals.length} ${deals.length === 1 ? 'deal' : 'deals'}`;
  const blocks = deals.map((deal) =>
    [
      `${deal.title} - ${deal.venue}`,
      `  ${deal.discount}`,
      `  ${deal.days.join(', ')}`,
      `  ${deal.location}`,
    ].join('\n'),
  );

  return [header, ...blocks].join('\n\n');
}
