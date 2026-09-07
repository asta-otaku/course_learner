import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FreeTextInput } from "../free-text-input";

describe("FreeTextInput", () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    questionId: "test-question-1",
    value: "",
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with placeholder text", () => {
    render(<FreeTextInput {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("Type your answer here...")
    ).toBeInTheDocument();
  });

  it("displays current value", () => {
    render(<FreeTextInput {...defaultProps} value="My answer" />);

    expect(screen.getByRole("textbox")).toHaveValue("My answer");
  });

  it("calls onChange when typing", () => {
    render(<FreeTextInput {...defaultProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Test" },
    });

    expect(mockOnChange).toHaveBeenCalledWith("Test");
  });

  it("prevents typing beyond maxLength", () => {
    render(<FreeTextInput {...defaultProps} value="abcdefghij" maxLength={10} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abcdefghijk" },
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    render(<FreeTextInput {...defaultProps} disabled />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass("opacity-60", "cursor-not-allowed");
  });

  it('shows "Answer submitted" when disabled', () => {
    render(<FreeTextInput {...defaultProps} disabled />);

    expect(screen.getByText("Answer submitted")).toBeInTheDocument();
  });

  it("applies custom minHeight style", () => {
    render(<FreeTextInput {...defaultProps} minHeight="200px" />);

    expect(screen.getByRole("textbox")).toHaveStyle({ minHeight: "200px" });
  });

  it("has proper accessibility attributes", () => {
    render(<FreeTextInput {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("id", "question-test-question-1");
    expect(textarea).toHaveAttribute("aria-label", "Free text answer");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      "char-count-test-question-1"
    );
  });

  it("handles empty string value gracefully", () => {
    render(<FreeTextInput {...defaultProps} value="" />);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("maintains focus ring classes", async () => {
    const user = userEvent.setup();
    render(<FreeTextInput {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);

    expect(textarea).toHaveClass("focus:ring-2", "focus:ring-blue-500");
  });
});
