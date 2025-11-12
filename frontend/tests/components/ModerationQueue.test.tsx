import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModerationQueue, type SubmissionItem } from '../../components/ModerationQueue';

vi.mock('../../lib/http', () => ({ getJSON: vi.fn().mockResolvedValue({ exists: false }) }));

function makeItem(overrides: Partial<SubmissionItem> = {}): SubmissionItem {
  return {
    _id: '1',
    title: 'Test Paper',
    authors: ['Alice'],
    venue: 'Conf',
    year: 2024,
    doi: '10.1000/test',
    status: 'queued',
    ...overrides
  };
}

describe('ModerationQueue accept guard', () => {
  const user = userEvent.setup();

  it('disables Accept when either radio is No', async () => {
    render(<ModerationQueue items={[makeItem()]} total={1} />);

    // Peer-reviewed: No
    const peerNo = await screen.findByRole('radio', { name: /peer-reviewed/i, checked: false });
    // The labels are separate; select via name attribute targeting constructed id could be complicated.
    // Instead simulate by clicking the second radio inputs found under the first fieldset.
    const radios = screen.getAllByRole('radio');
    // radios[1] should correspond to first fieldset "No"
    await user.click(radios[1]);

    const accept = screen.getByRole('button', { name: /accept/i });
    expect(accept).toBeDisabled();
  });
});
