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
  description: 'Extract key concepts and generate question/answer pairs from an image of notes.',
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
    const {photoDataUri} = input;
    // Placeholder implementation for concept extraction from image
    // In a real application, this would involve OCR and NLP techniques
    // to identify key concepts and generate relevant questions and answers.
    return [
      {
        question: 'What is the main topic discussed in the notes?',
        answer: 'The main topic is not yet implemented.',
      },
      {
        question: 'Can you summarize the key points?',
        answer: 'Key point extraction is not yet implemented.',
      },
    ];
  }
);

const imageToFlashcardPrompt = ai.definePrompt({
  name: 'imageToFlashcardPrompt',
  tools: [extractConceptsTool],
  input: {schema: ImageToFlashcardInputSchema},
  output: {schema: ImageToFlashcardOutputSchema},
  prompt: `You are an AI assistant designed to help students create flashcards from their notes.

  Please use the extractConcepts tool to extract the flashcards from the image.

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
    return output!;
  }
);
