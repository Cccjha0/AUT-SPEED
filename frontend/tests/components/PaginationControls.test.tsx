import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginationControls } from '../../components/PaginationControls';

const pushMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/search/evidence',
  useSearchParams: () => currentSearchParams
}));

function getSearchParam(url: string, key: string) {
  const parsed = new URL(`http://localhost${url}`);
  return parsed.searchParams.get(key);
}

describe('PaginationControls', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    currentSearchParams = new URLSearchParams('practiceKey=tdd');
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates URL with page/size and notifies consumers with limit/skip when moving forward', async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls page={1} size={10} total={45} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushedUrl = pushMock.mock.calls[0][0] as string;
    expect(getSearchParam(pushedUrl, 'page')).toBe('2');
    expect(getSearchParam(pushedUrl, 'size')).toBe('10');
    expect(getSearchParam(pushedUrl, 'practiceKey')).toBe('tdd');
    expect(onPageChange).toHaveBeenLastCalledWith({
      page: 2,
      size: 10,
      limit: 10,
      skip: 10
    });
  });

  it('resets to page 1 with new size and emits converted limit/skip', async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls page={3} size={10} total={200} onPageChange={onPageChange} />);

    await user.selectOptions(screen.getByRole('combobox'), '20');

    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushedUrl = pushMock.mock.calls[0][0] as string;
    expect(getSearchParam(pushedUrl, 'page')).toBe('1');
    expect(getSearchParam(pushedUrl, 'size')).toBe('20');
    expect(onPageChange).toHaveBeenLastCalledWith({
      page: 1,
      size: 20,
      limit: 20,
      skip: 0
    });
  });
});
