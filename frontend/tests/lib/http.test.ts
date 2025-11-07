import { getJSON } from '../../lib/http';

describe('getJSON', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the data payload when the request succeeds', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { message: 'ok' } })
    } as unknown as Response);

    const result = await getJSON<{ message: string }>('/api/example');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/example'), undefined);
    expect(result).toEqual({ message: 'ok' });
  });

  it('throws when the response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Server error')
    } as unknown as Response);

    await expect(getJSON('/api/fail')).rejects.toMatchObject({
      status: 500,
      message: 'Server error'
    });
  });

  it('throws when the JSON payload contains an error property', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ error: 'Not allowed' })
    } as unknown as Response);

    await expect(getJSON('/api/error')).rejects.toMatchObject({
      message: 'Not allowed'
    });
  });
});
