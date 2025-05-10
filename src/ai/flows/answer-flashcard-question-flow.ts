'use server';
/**
 * @fileOverview Provides a Genkit flow to answer user questions about a specific flashcard.
 *
 * - answerFlashcardQuestion - A function that takes a flashcard's content and a user's question, then returns an AI-generated answer.
 * - AnswerFlashcardQuestionInput - The input type for the answerFlashcardQuestion function.
 * - AnswerFlashcardQuestionOutput - The return type for the answerFlashcardQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFlashcardQuestionInputSchema = z.object({
  flashcardQuestion: z.string().describe('The question part of the flashcard.'),
  flashcardAnswer: z.string().describe('The answer part of the flashcard.'),
  userQuestion: z.string().describe('The user\'s question about this flashcard.'),
});
export type AnswerFlashcardQuestionInput = z.infer<typeof AnswerFlashcardQuestionInputSchema>;

const AnswerFlashcardQuestionOutputSchema = z.object({
  aiAnswer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type AnswerFlashcardQuestionOutput = z.infer<typeof AnswerFlashcardQuestionOutputSchema>;

export async function answerFlashcardQuestion(input: AnswerFlashcardQuestionInput): Promise<AnswerFlashcardQuestionOutput> {
  return answerFlashcardQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerFlashcardQuestionPrompt',
  input: {schema: AnswerFlashcardQuestionInputSchema},
  output: {schema: AnswerFlashcardQuestionOutputSchema},
  prompt: `You are a helpful study assistant. The user is currently reviewing a flashcard and has a question about it.

Flashcard Question:
"{{flashcardQuestion}}"

Flashcard Answer:
"{{flashcardAnswer}}"

User's Question about this flashcard:
"{{userQuestion}}"

Please provide a clear and concise answer to the user's question, using the context of the flashcard.
If the user's question is unrelated to the flashcard, politely state that you can only answer questions about the current flashcard's content.
Focus on explaining or elaborating on the concepts presented in the flashcard as they relate to the user's question.
Do not invent information not supported by the flashcard content.
Your response should directly address the "{{userQuestion}}".
`,
});

const answerFlashcardQuestionFlow = ai.defineFlow(
  {
    name: 'answerFlashcardQuestionFlow',
    inputSchema: AnswerFlashcardQuestionInputSchema,
    outputSchema: AnswerFlashcardQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI failed to provide an answer.");
    }
    return output;
  }
);
