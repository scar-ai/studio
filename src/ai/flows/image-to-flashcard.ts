'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating flashcards from images of notes.
 *
 * - imageToFlashcard - A function that takes an image of notes as input and returns a set of flashcards.
 * - ImageToFlashcardInput - The input type for the imageToFlashcard function.
 * - ImageToFlashcardOutput - The return type for the imageToFlashcard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToFlashcardInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToFlashcardInput = z.infer<typeof ImageToFlashcardInputSchema>;

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const ImageToFlashcardOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type ImageToFlashcardOutput = z.infer<typeof ImageToFlashcardOutputSchema>;

export async function imageToFlashcard(input: ImageToFlashcardInput): Promise<ImageToFlashcardOutput> {
  return imageToFlashcardFlow(input);
}

const extractConceptsTool = ai.defineTool({
  name: 'extractConcepts',
  description: 'Extracts the most important concepts, key information, and significant details from an image of notes to generate educationally valuable question/answer pairs. Prioritize core learning objectives and avoid trivial or overly specific details. If mathematical expressions are present, format them using LaTeX: $inline_math$ for inline and $$block_math$$ for block.',
  inputSchema: z.object({
    photoDataUri: z
      .string()
      .describe(
        "A photo of notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  }),
  outputSchema: z.array(FlashcardSchema),
},
async (input) => {
    // This placeholder is not executed by the LLM. 
    // The LLM uses the tool's name, description, and schemas to understand its function.
    // The actual flashcard generation based on the image and prompt instructions happens within the LLM call.
    return []; 
  }
);

const imageToFlashcardPrompt = ai.definePrompt({
  name: 'imageToFlashcardPrompt',
  tools: [extractConceptsTool],
  input: {schema: ImageToFlashcardInputSchema},
  output: {schema: ImageToFlashcardOutputSchema},
  prompt: `You are an AI assistant specialized in creating high-quality, educationally valuable flashcards from images of notes.
Your goal is to identify and extract the most important concepts, key definitions, significant facts, and core ideas presented in the image.

When generating flashcard questions or answers that involve mathematical expressions or formulas, please use LaTeX format.
- For inline mathematics, use single dollar signs: \`$your_latex_code$\` (e.g., \`$E=mc^2$\`).
- For display/block mathematics, use double dollar signs: \`$$your_latex_code$$\` (e.g., \`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$\`).
Ensure the LaTeX code is valid.

- Questions should be clear and test understanding of the key material in this chunk.
- Answers should be concise, accurate, and directly derived from this chunk, reflecting the most important information.
- Focus solely on the informational content *within* the provided text chunk that holds the most educational value.
- If no relevant, important content is found in this chunk to create flashcards, return an empty array.
- Generate the flashcards in the language of the provided pdf.

Please use the extractConcepts tool to analyze the image and generate flashcards according to these instructions.

Image: {{media url=photoDataUri}}
  `,
});

const imageToFlashcardFlow = ai.defineFlow(
  {
    name: 'imageToFlashcardFlow',
    inputSchema: ImageToFlashcardInputSchema,
    outputSchema: ImageToFlashcardOutputSchema,
  },
  async input => {
    const {output} = await imageToFlashcardPrompt(input);
    if (!output) {
      console.warn("AI did not return flashcards for the image-to-flashcard flow.");
      return { flashcards: [] };
    }
    return output;
  }
);
