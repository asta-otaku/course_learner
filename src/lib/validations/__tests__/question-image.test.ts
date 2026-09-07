import { describe, it, expect } from "vitest";
import {
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  updateQuestionSchema,
} from "@/lib/validations/question";

describe("Question image_url validation", () => {
  it("accepts a multiple-choice question with an image URL", () => {
    const result = multipleChoiceQuestionSchema.safeParse({
      content: "What is shown in the image?",
      type: "multiple_choice",
      image_url: "https://example.com/test-image.jpg",
      answers: [
        { content: "Option A", is_correct: true },
        { content: "Option B", is_correct: false },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_url).toBe("https://example.com/test-image.jpg");
    }
  });

  it("accepts a true/false question without an image URL", () => {
    const result = trueFalseQuestionSchema.safeParse({
      content: "Simple text question",
      type: "true_false",
      answers: [
        { content: "True", is_correct: true },
        { content: "False", is_correct: false },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_url).toBeUndefined();
    }
  });

  it("accepts updating a question with a new image URL", () => {
    const result = updateQuestionSchema.safeParse({
      id: "33333333-3333-3333-3333-333333333333",
      content: "Updated Question",
      image_url: "https://example.com/new-image.jpg",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_url).toBe("https://example.com/new-image.jpg");
    }
  });

  it("accepts clearing an image URL with null", () => {
    const result = updateQuestionSchema.safeParse({
      id: "44444444-4444-4444-4444-444444444444",
      image_url: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_url).toBeNull();
    }
  });
});
