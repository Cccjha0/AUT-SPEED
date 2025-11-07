import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingButton } from '../../components/RatingButton';
import { fetchRealtimeJson } from '../../lib/api/search';

vi.mock('../../lib/api/search', () => ({
  fetchRealtimeJson: vi.fn()
}));

const fetchRealtimeJsonMock = vi.mocked(fetchRealtimeJson);

describe('RatingButton', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    fetchRealtimeJsonMock.mockResolvedValue({
      response: { ok: true } as Response,
      payload: { data: { doi: '10.1000/example', average: 4, count: 1 } }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('optimistically updates the average while the rating request is in flight', async () => {
    const fetchMock = vi.fn();
    let resolvePost: (value: Response) => void = () => {};

    fetchRealtimeJsonMock.mockResolvedValue({
      response: { ok: true } as Response,
      payload: {
        data: { doi: '10.1000/example', average: null, count: 0 }
      }
    });

    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>(resolve => {
          resolvePost = resolve;
        })
    );
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)
    );

    vi.spyOn(global, 'fetch').mockImplementation(fetchMock as unknown as typeof fetch);
    vi.spyOn(window, 'prompt')
      .mockImplementationOnce(() => '4')
      .mockImplementationOnce(() => 'Tester');

    render(<RatingButton doi="10.1000/example" />);

    await user.click(screen.getByRole('button', { name: /rate/i }));

    const realtimeCallCountAfterClick = fetchRealtimeJsonMock.mock.calls.length;

    await act(async () => {
      resolvePost({
        ok: true,
        json: () => Promise.resolve({})
      } as Response);
    });

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(fetchRealtimeJsonMock.mock.calls.length).toBeGreaterThanOrEqual(
      realtimeCallCountAfterClick
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rolls back the optimistic state when the rating request fails', async () => {
    fetchRealtimeJsonMock.mockResolvedValue({
      response: {
        ok: true
      } as Response,
      payload: {
        data: { doi: '10.1000/example', average: 3, count: 1 }
      }
    });

    const fetchMock = vi.fn();
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Unable to submit rating' }
        })
      } as unknown as Response)
    );

    vi.spyOn(global, 'fetch').mockImplementation(fetchMock as unknown as typeof fetch);
    vi.spyOn(window, 'prompt')
      .mockImplementationOnce(() => '5')
      .mockImplementationOnce(() => '');

    render(<RatingButton doi="10.1000/example" />);
    const button = screen.getByRole('button', { name: /rate/i });

    await user.hover(button);
    await waitFor(() => expect(fetchRealtimeJsonMock).toHaveBeenCalled());

    await user.click(button);

    expect(await screen.findByText(/Unable to submit rating/i)).toBeInTheDocument();
  });
});
