import { describe, expect, it } from 'vitest';
import { fromPageSize, toPageSize } from '../../lib/url';

describe('fromPageSize', () => {
  it('derives limit/skip from page and size', () => {
    const result = fromPageSize({ page: 3, size: 20 });
    expect(result).toEqual({
      page: 3,
      size: 20,
      limit: 20,
      skip: 40
    });
  });

  it('uses legacy limit/skip values when page/size are undefined', () => {
    const result = fromPageSize({ limit: 15, skip: 30 });
    expect(result.page).toBe(3);
    expect(result.size).toBe(15);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(30);
  });

  it('guards against invalid values by falling back to defaults', () => {
    const result = fromPageSize({ page: -1, size: 0, skip: -50 });
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(0);
  });
});

describe('toPageSize', () => {
  it('converts limit/skip back to page and size', () => {
    expect(toPageSize({ limit: 25, skip: 75 })).toEqual({
      page: 4,
      size: 25
    });
  });

  it('falls back to defaults for invalid data', () => {
    expect(toPageSize({ limit: -5, skip: Number.NaN })).toEqual({
      page: 1,
      size: 10
    });
  });
});
