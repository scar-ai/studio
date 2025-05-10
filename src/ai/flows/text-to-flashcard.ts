// text-to-flashcard.ts
'use server';
/**
 * @fileOverview Generates flashcards from input text.
 *
 * - textToFlashcard - A function that generates flashcards from input text.
 * - TextToFlashcardInput - The input type for the textToFlashcard function.
 * - TextToFlashcardOutput - The return type for the textToFlashcard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToFlashcardInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
});
export type TextToFlashcardInput = z.infer<typeof TextToFlashcardInputSchema>;

const TextToFlashcardOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe('The question for the flashcard.'),
      answer: z.string().describe('The answer to the question.'),
    })
  ).describe('An array of flashcards generated from the input text.'),
});
export type TextToFlashcardOutput = z.infer<typeof TextToFlashcardOutputSchema>;

export async function textToFlashcard(input: TextToFlashcardInput): Promise<TextToFlashcardOutput> {
  return textToFlashcardFlow(input);
}

const createFlashcardsTool = ai.defineTool({
  name: 'createFlashcards',
  description: 'Create questions and answers from a given text',
  inputSchema: z.object({
    text: z.string().describe('The text to generate flashcards from.'),
  }),
  outputSchema: z.array(
    z.object({
      question: z.string().describe('The question for the flashcard.'),
      answer: z.string().describe('The answer to the question.'),
    })
  ),
  async resolve(input) {
    // Replace with actual implementation to generate flashcards from text
    // This is a placeholder implementation
    const { text } = input;
    const flashcards = [];
    const sentences = text.split(/[\.!\?]/);
    for (const sentence of sentences) {
      if (sentence.trim() !== '') {
        flashcards.push({
          question: `What is the main idea of this: ${sentence.trim()}?`,
          answer: sentence.trim(),
        });
      }
    }
    return flashcards;
  },
});

const prompt = ai.definePrompt({
  name: 'textToFlashcardPrompt',
  input: {schema: TextToFlashcardInputSchema},
  output: {schema: TextToFlashcardOutputSchema},
  tools: [createFlashcardsTool],
  prompt: `You are a flashcard generator. You will generate flashcards from the given text.

  The text is: {{{text}}}

  Use the createFlashcards tool to generate questions and answers from the given text.
  Return the flashcards in the following JSON format:
  {{output}}
  `,
});

const textToFlashcardFlow = ai.defineFlow(
  {
    name: 'textToFlashcardFlow',
    inputSchema: TextToFlashcardInputSchema,
    outputSchema: TextToFlashcardOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
