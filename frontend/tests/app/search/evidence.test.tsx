import { render, screen } from '@testing-library/react';
import EvidencePage from '../../../app/search/evidence/page';
import type { SearchResponse } from '../../../lib/types';
import { fetchSearchList } from '../../../lib/api/search';

vi.mock('../../../components/PaginationControls', () => ({
  PaginationControls: () => <div data-testid="pagination-controls" />
}));

vi.mock('../../../lib/api/search', () => ({
  fetchSearchList: vi.fn()
}));

const fetchSearchListMock = vi.mocked(fetchSearchList);

describe('EvidencePage (server component)', () => {
  afterEach(() => {
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

    fetchSearchListMock.mockResolvedValueOnce(response as any);

    render(
      await EvidencePage({
        searchParams: { practiceKey: 'tdd', result: 'agree', page: '1', size: '10' }
      })
    );

    expect(fetchSearchListMock).toHaveBeenCalledWith(
      '/search/evidence',
      expect.objectContaining({ practiceKey: 'tdd', result: 'agree', limit: 10, skip: 0 })
    );

    expect(screen.getByText('A Demo Study')).toBeInTheDocument();
    expect(screen.getByText(/Agree: 1/i)).toBeInTheDocument();
  });

  it('refetches when the result filter changes', async () => {
    fetchSearchListMock.mockResolvedValue({
      data: {
        items: [],
        total: 0,
        limit: 10,
        skip: 0
      }
    } as any);

    await EvidencePage({ searchParams: { result: 'agree', page: '1', size: '10' } });
    await EvidencePage({ searchParams: { result: 'disagree', page: '1', size: '10' } });

    expect(fetchSearchListMock).toHaveBeenCalledTimes(2);
    expect(fetchSearchListMock).toHaveBeenNthCalledWith(
      1,
      '/search/evidence',
      expect.objectContaining({ result: 'agree' })
    );
    expect(fetchSearchListMock).toHaveBeenNthCalledWith(
      2,
      '/search/evidence',
      expect.objectContaining({ result: 'disagree' })
    );
  });
});
