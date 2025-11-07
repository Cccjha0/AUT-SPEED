import { render, screen } from '@testing-library/react';
import HealthStatus from '../../components/HealthStatus';
import { getJSON } from '../../lib/http';

vi.mock('../../lib/http', () => ({
  getJSON: vi.fn()
}));

const getJSONMock = vi.mocked(getJSON);

describe('HealthStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders backend status when health endpoint succeeds', async () => {
    getJSONMock.mockResolvedValue({
      status: 'ok',
      message: 'All systems nominal',
      timestamp: new Date().toISOString()
    });

    const view = await HealthStatus();
    render(view);

    expect(getJSONMock).toHaveBeenCalledWith('/api/health', expect.any(Object));
    expect(screen.getByText('Status: ok')).toBeInTheDocument();
    expect(screen.getByText('All systems nominal')).toBeInTheDocument();
  });

  it('renders error message when health endpoint fails', async () => {
    getJSONMock.mockRejectedValue({
      status: 500,
      message: 'Health check failed'
    });

    const view = await HealthStatus();
    render(view);

    expect(getJSONMock).toHaveBeenCalled();
    expect(screen.getByText(/health check failed/i)).toBeInTheDocument();
  });
});
