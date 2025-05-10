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
  description: 'Extracts the most important concepts, key information, and significant details from the provided text to generate educationally valuable question/answer pairs. Prioritize core learning objectives and avoid trivial or overly specific details. If mathematical expressions are present, format them using LaTeX: $inline_math$ for inline and $$block_math$$ for block.',
  inputSchema: z.object({
    text: z.string().describe('The text to generate flashcards from.'),
  }),
  outputSchema: z.array(FlashcardSchema),
  async resolve(input) {
    // This placeholder is not executed by the LLM.
    // The LLM uses the tool's name, description, and schemas to understand its function.
    // The actual flashcard generation based on the text and prompt instructions happens within the LLM call.
    return [];
  },
});

const prompt = ai.definePrompt({
  name: 'textToFlashcardPrompt',
  input: {schema: TextToFlashcardInputSchema},
  output: {schema: TextToFlashcardOutputSchema},
  tools: [createFlashcardsTool],
  prompt: `You are an AI assistant specialized in creating high-quality, educationally valuable flashcards from text.
Your goal is to identify and extract the most important concepts, key definitions, significant facts, and core ideas presented in the text.

When generating flashcard questions or answers that involve mathematical expressions or formulas, please use LaTeX format.
- For inline mathematics, use single dollar signs: \`$your_latex_code$\` (e.g., \`$E=mc^2$\`).
- For display/block mathematics, use double dollar signs: \`$$your_latex_code$$\` (e.g., \`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$\`).
Ensure the LaTeX code is valid.

- Questions should be clear and test understanding of the key material in this chunk.
- Answers should be concise, accurate, and directly derived from this chunk, reflecting the most important information.
- Focus solely on the informational content *within* the provided text chunk that holds the most educational value.
- If no relevant, important content is found in this chunk to create flashcards, return an empty array.
- Generate the flashcards in the language of the provided pdf.

The text is:
{{{text}}}

Use the createFlashcards tool to analyze the text and generate flashcards according to these instructions.
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
    if (!output) {
      console.warn("AI did not return flashcards for the text-to-flashcard flow.");
      return { flashcards: [] }; 
    }
    return output;
  }
);
