import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModerationQueue } from "../../components/ModerationQueue";
import type { SubmissionItem } from "../../components/ModerationQueue";

vi.mock("../../lib/http", () => ({
  getJSON: vi.fn().mockResolvedValue({ exists: false })
}));

const user = userEvent.setup();

function makeItem(overrides: Partial<SubmissionItem> = {}): SubmissionItem {
  return {
    _id: "1",
    title: "Test Paper",
    status: "queued",
    authors: ["Alice"],
    venue: "Conf",
    year: 2024,
    doi: "10.1000/test",
    ...overrides
  };
}

describe("ModerationQueue accept guard", () => {
  it("disables Accept when either radio is No", async () => {
    render(<ModerationQueue items={[makeItem()]} total={1} />);

    const radioInputs = await screen.findAllByRole("radio");
    await user.click(radioInputs[1]);

    const acceptButton = screen.getByRole("button", { name: /accept/i });
    expect(acceptButton).toBeDisabled();
  });
});
