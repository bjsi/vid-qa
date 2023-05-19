import { ChatCompletionRequestMessage } from "openai";

export const createUserQuestionMessage = ({
  text,
  question,
}: {
  text: string;
  question: string;
}): ChatCompletionRequestMessage => {
  return {
    role: "user",
    content: `
  Text: "${text}"

  Directly quote parts of the content which answer the sentence: "${question}"`,
  };
};

export const answerQsPrompt: ChatCompletionRequestMessage[] = [
  {
    role: "system",
    content:
      "You are answering sentences based on some text. You MUST find substrings directly from the text without adding punctuation, changing wording or removing duplicated words. Quote short passages only.",
  },
  {
    role: "user",
    content: `Text: "The fastest way for you to discover your purpose is to try and think more about your core desire try and think about What you really resonated with when you peel back all of the bullshit when you peel back and maybe when you were a child What did you resonate with what did you once not specifically like I wanted an ice cream like don't be stupid But like what was like the theme of of your desire your motivation as a child or at times"`,
  },
  {
    role: "user",
    content:
      'Directly quote parts of the content which answer the sentence: "What about my childhood could give me insight into my purpose"',
  },
  {
    role: "assistant",
    content:
      '"when you were a child What did you resonate with [...] what was like the theme of of your desire your motivation as a child"',
  },
  {
    role: "user",
    content:
      'Directly quote parts of the content which answer the sentence: "What is this content about"',
  },
  {
    role: "assistant",
    content: '"The fastest way for you to discover your purpose"',
  },
  {
    role: "user",
    content:
      'Directly quote parts of the content which answer the sentence: "How can I discover my purpose"',
  },
  {
    role: "assistant",
    content:
      '"The fastest way for you to discover your purpose is to try and think more about your core desire [...] what was like the theme of of your desire your motivation as a child"',
  },
];
