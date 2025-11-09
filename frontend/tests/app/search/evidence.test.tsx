import { render, screen } from '@testing-library/react';
import EvidencePage from '../../../app/search/evidence/page';
import type { EvidenceItem, SearchResponse } from '../../../lib/types';
import { getJSON } from '../../../lib/http';

vi.mock('../../../components/PaginationControls', () => ({
  PaginationControls: () => <div data-testid="pagination-controls" />
}));

vi.mock('../../../components/SaveQueryControls', () => ({
  SaveQueryControls: () => <div data-testid="save-query-controls" />
}));

const evidenceTableProps: unknown[] = [];

vi.mock('../../../components/EvidenceTable', () => ({
  EvidenceTable: (props: unknown) => {
    evidenceTableProps.push(props);
    return <div data-testid="evidence-table" />;
  }
}));

vi.mock('../../../lib/http', () => ({
  getJSON: vi.fn()
}));

const getJSONMock = vi.mocked(getJSON);

describe('EvidencePage (server component)', () => {
  afterEach(() => {
    evidenceTableProps.length = 0;
    vi.clearAllMocks();
  });

  it('renders evidence table and aggregations from the API response', async () => {
    const response: SearchResponse<Record<string, unknown>> = {
      data: {
        items: [
          {
            _id: '1',
            articleDoi: '10.1000/demo',
            practiceKey: 'tdd',
            claimKey: 'faster',
            result: 'agree',
            methodType: 'experiment',
            participantType: 'practitioner',
            avgRating: {
              average: 4.5,
              count: 12
            },
            article: {
              title: 'A Demo Study',
              doi: '10.1000/demo',
              year: 2024
            }
          }
        ],
        total: 1,
        limit: 10,
        skip: 0,
        aggregations: {
          resultCounts: {
            agree: 1,
            disagree: 0,
            mixed: 0
          }
        }
      }
    };

    getJSONMock
      .mockResolvedValueOnce(response.data as any)
      .mockResolvedValueOnce({ items: [], total: 0, limit: 100, skip: 0 } as any)
      .mockResolvedValueOnce({ items: [], total: 0, limit: 100, skip: 0 } as any);

    render(
      await EvidencePage({
        searchParams: { practiceKey: 'tdd', result: 'agree', page: '1', size: '10' }
      })
    );

    expect(getJSONMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/search/evidence'),
      expect.any(Object)
    );

    expect(screen.getByTestId('evidence-table')).toBeInTheDocument();
    const tableProps = evidenceTableProps[0] as { items?: EvidenceItem[] } | undefined;
    expect(tableProps?.items?.[0]?.article?.title).toBe('A Demo Study');
    expect(screen.getByText(/Agree: 1/i)).toBeInTheDocument();
  });

  it('refetches when the result filter changes', async () => {
    getJSONMock.mockImplementation((url: string) => {
      if (url.includes('/api/search/evidence')) {
        return Promise.resolve({
          items: [],
          total: 0,
          limit: 10,
          skip: 0
        });
      }
      if (url.includes('/api/search/practices')) {
        return Promise.resolve({ items: [], total: 0, limit: 100, skip: 0 });
      }
      if (url.includes('/api/search/claims')) {
        return Promise.resolve({ items: [], total: 0, limit: 100, skip: 0 });
      }
      return Promise.resolve({});
    });

    await EvidencePage({ searchParams: { result: 'agree', page: '1', size: '10' } });
    await EvidencePage({ searchParams: { result: 'disagree', page: '1', size: '10' } });

    const evidenceCalls = getJSONMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.includes('/api/search/evidence')
    );

    expect(evidenceCalls).toHaveLength(2);
    expect(evidenceCalls[0]?.[0]).toContain('result=agree');
    expect(evidenceCalls[1]?.[0]).toContain('result=disagree');
  });
});
