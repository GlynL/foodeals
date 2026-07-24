import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '../core/deal.js';

const sample: Deal = {
  title: '2-for-1 burgers',
  venue: 'The Grill House',
  discount: '2-for-1 on all burgers',
  location: 'https://maps.example/grill',
  days: ['Mon', 'Tue'],
};

const listDeals = vi.fn<() => Deal[]>();

vi.mock('../core/deals.js', () => ({
  listDeals: () => listDeals(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe('GET /deals', () => {
  it('returns the catalogue as JSON', async () => {
    listDeals.mockReturnValue([sample]);
    const { buildApp } = await import('./app.js');
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/deals' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([sample]);
  });

  it('responds 500 with a generic body when listDeals() throws', async () => {
    listDeals.mockImplementation(() => {
      throw new Error('Deals file at /secret/path/data/deals.json is invalid: - index 0 → "venue": must not be empty');
    });
    const { buildApp } = await import('./app.js');
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/deals' });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body).toEqual({ error: 'Internal server error' });
    expect(response.body).not.toContain('/secret/path');
    expect(response.body).not.toContain('venue');
  });
});

describe('GET /health', () => {
  it('returns 200 without touching listDeals()', async () => {
    const { buildApp } = await import('./app.js');
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(listDeals).not.toHaveBeenCalled();
  });
});
