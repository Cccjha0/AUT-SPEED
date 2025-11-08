import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmitForm } from '../../components/SubmitForm';

describe('SubmitForm', () => {
  const user = userEvent.setup();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a Zod validation error when authors are missing', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<SubmitForm />);

    await user.type(screen.getByLabelText(/Title/i), 'Test Article');
    await user.type(screen.getByLabelText(/Venue/i), 'Conference');
    await user.type(screen.getByLabelText(/Year/i), `${new Date().getFullYear()}`);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/Please provide at least one author/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('submits successfully and resets the form fields', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { _id: '1' } })
      } as unknown as Response);

    render(<SubmitForm />);

    await user.type(screen.getByLabelText(/Title/i), 'Test Article');
    await user.type(screen.getByLabelText(/Authors/i), 'Alice, Bob');
    await user.type(screen.getByLabelText(/Venue/i), 'Conference');
    await user.type(screen.getByLabelText(/Year/i), `${new Date().getFullYear()}`);
    await user.type(screen.getByLabelText(/Volume/i), '42');
    await user.type(screen.getByLabelText(/Issue\/Number/i), '7');
    await user.type(screen.getByLabelText(/Pages/i), '101-110');
    await user.type(screen.getByLabelText(/DOI/i), '10.1000/test');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Submission queued successfully/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/Title/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Authors/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Venue/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Year/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Volume/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Issue\/Number/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Pages/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/DOI/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/^BibTeX/i) as HTMLTextAreaElement).value).toBe('');
  });

  it('imports metadata from BibTeX input', async () => {
    render(<SubmitForm />);

    const bibtex = [
      '@article{demo,',
      'title={Sample Study},',
      'author={Alice Example and Bob Example},',
      'journal={Journal of Testing},',
      'year={2024},',
      'volume={10},',
      'number={2},',
      'pages={15-30},',
      'doi={10.1234/example}',
      '}'
    ].join('\n');

    await user.type(screen.getByLabelText(/^BibTeX/i), `${bibtex}`);
    await user.click(screen.getByRole('button', { name: /Import from BibTeX/i }));

    expect((screen.getByLabelText(/Title/i) as HTMLInputElement).value).toBe('Sample Study');
    expect((screen.getByLabelText(/Authors/i) as HTMLInputElement).value).toContain('Alice Example');
    expect((screen.getByLabelText(/Venue/i) as HTMLInputElement).value).toBe('Journal of Testing');
    expect((screen.getByLabelText(/Year/i) as HTMLInputElement).value).toBe('2024');
    expect((screen.getByLabelText(/Volume/i) as HTMLInputElement).value).toBe('10');
    expect((screen.getByLabelText(/Issue\/Number/i) as HTMLInputElement).value).toBe('2');
    expect((screen.getByLabelText(/Pages/i) as HTMLInputElement).value).toBe('15-30');
    expect((screen.getByLabelText(/DOI/i) as HTMLInputElement).value).toBe('10.1234/example');
  });
});
