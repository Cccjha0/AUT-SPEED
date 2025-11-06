import { render, screen } from '@testing-library/react';
import HealthStatus from '../../components/HealthStatus';

describe('HealthStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders backend status when health endpoint succeeds', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'ok' })
      } as unknown as Response);

    const view = await HealthStatus();
    render(view);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.any(Object));
    expect(screen.getByText('Status: ok')).toBeInTheDocument();
  });

  it('renders error message when health endpoint fails', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response);

    const view = await HealthStatus();
    render(view);

    expect(fetchMock).toHaveBeenCalled();
    expect(screen.getByText(/health check failed/i)).toBeInTheDocument();
  });
});
