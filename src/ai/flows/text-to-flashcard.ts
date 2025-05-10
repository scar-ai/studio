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

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const TextToFlashcardOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of flashcards generated from the input text.'),
});
export type TextToFlashcardOutput = z.infer<typeof TextToFlashcardOutputSchema>;

export async function textToFlashcard(input: TextToFlashcardInput): Promise<TextToFlashcardOutput> {
  return textToFlashcardFlow(input);
}

const createFlashcardsTool = ai.defineTool({
  name: 'createFlashcards',
  description: 'Create questions and answers from a given text. If mathematical expressions are present, format them using LaTeX: $inline_math$ for inline and $$block_math$$ for block.',
  inputSchema: z.object({
    text: z.string().describe('The text to generate flashcards from.'),
  }),
  outputSchema: z.array(FlashcardSchema),
  async resolve(input) {
    // Replace with actual implementation to generate flashcards from text
    // This is a placeholder implementation
    // The actual LLM call using this tool would be responsible for LaTeX formatting.
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
When generating flashcard questions or answers that involve mathematical expressions or formulas, please use LaTeX format.
- For inline mathematics, use single dollar signs: \`$your_latex_code$\` (e.g., \`$E=mc^2$\`).
- For display/block mathematics, use double dollar signs: \`$$your_latex_code$$\` (e.g., \`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$\`).
Ensure the LaTeX code is valid.

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
    // Ensure output is not null, if it can be based on your Genkit setup or prompt behavior
    if (!output) {
      // Handle the case where output might be null, e.g., by returning empty flashcards or throwing an error
      console.warn("AI did not return flashcards for the text-to-flashcard flow.");
      return { flashcards: [] }; 
    }
    return output;
  }
);
