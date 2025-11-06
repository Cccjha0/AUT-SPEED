const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export interface PageSizeInput {
  page?: number;
  size?: number;
  limit?: number;
  skip?: number;
  defaultSize?: number;
}

export interface PageSizeResult {
  page: number;
  size: number;
  limit: number;
  skip: number;
}

function clampSize(value: number, fallback: number) {
  if (Number.isNaN(value) || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function normalize(input?: number, fallback: number = DEFAULT_PAGE_SIZE) {
  return clampSize(input ?? fallback, fallback);
}

export function fromPageSize(input: PageSizeInput): PageSizeResult {
  const fallbackSize = input.defaultSize ?? DEFAULT_PAGE_SIZE;
  const resolvedSize = normalize(input.size ?? input.limit, fallbackSize);

  const pageFromSkip =
    input.skip !== undefined && !Number.isNaN(input.skip ?? Number.NaN)
      ? Math.floor(Math.max(0, Number(input.skip)) / resolvedSize) + 1
      : 1;

  const resolvedPage = Math.max(
    1,
    Number.isFinite(input.page ?? Number.NaN) && !Number.isNaN(input.page ?? Number.NaN)
      ? Math.floor(Number(input.page))
      : pageFromSkip
  );

  const skip = (resolvedPage - 1) * resolvedSize;

  return {
    page: resolvedPage,
    size: resolvedSize,
    limit: resolvedSize,
    skip
  };
}

export function toPageSize(input: { limit?: number; skip?: number; defaultSize?: number }) {
  const fallbackSize = input.defaultSize ?? DEFAULT_PAGE_SIZE;
  const size = normalize(input.limit, fallbackSize);
  const skip = Math.max(0, Number.isFinite(input.skip ?? Number.NaN) ? Number(input.skip) : 0);
  const page = Math.floor(skip / size) + 1;

  return {
    page,
    size
  };
}
