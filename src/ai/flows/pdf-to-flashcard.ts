// src/ai/flows/pdf-to-flashcard.ts
'use server';

/**
 * @fileOverview Converts PDF documents into flashcards.
 *
 * - pdfToFlashcard - A function that takes a PDF document (as a data URI) and returns a set of flashcards.
 * - PdfToFlashcardInput - The input type for the pdfToFlashcard function.
 * - PdfToFlashcardOutput - The return type for the pdfToFlashcard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PdfToFlashcardInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'The PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type PdfToFlashcardInput = z.infer<typeof PdfToFlashcardInputSchema>;

const PdfToFlashcardOutputSchema = z.array(
  z.object({
    question: z.string().describe('The question for the flashcard.'),
    answer: z.string().describe('The answer to the question.'),
  })
);
export type PdfToFlashcardOutput = z.infer<typeof PdfToFlashcardOutputSchema>;

export async function pdfToFlashcard(input: PdfToFlashcardInput): Promise<PdfToFlashcardOutput> {
  return pdfToFlashcardFlow(input);
}

const extractKeyPointsTool = ai.defineTool({
  name: 'extractKeyPoints',
  description: 'Extracts key information and concepts from a PDF document.',
  inputSchema: z.object({
    pdfDataUri: z
      .string()
      .describe(
        'The PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
      ),
  }),
  outputSchema: z.string().describe('Key points extracted from the PDF.'),
},
  async (input) => {
    // Placeholder implementation for PDF extraction.
    // In a real application, you would use a library like PDF.js to extract text from the PDF data URI.
    // For now, we'll just return a placeholder string.
    return `Extracted key points from the PDF document: [PLACEHOLDER - IMPLEMENT PDF EXTRACTION HERE]`;
  }
);

const prompt = ai.definePrompt({
  name: 'pdfToFlashcardPrompt',
  input: {schema: PdfToFlashcardInputSchema},
  output: {schema: PdfToFlashcardOutputSchema},
  tools: [extractKeyPointsTool],
  prompt: `You are an expert at creating flashcards from input text.

  Given a PDF document, extract the key points and create a set of flashcards with questions and answers.
  Use the extractKeyPoints tool to get the key points from the PDF document.

  PDF Document: {{pdfDataUri}}
  
  Output flashcards as a JSON array of objects, where each object has a 'question' and 'answer' field.
  `,
});

const pdfToFlashcardFlow = ai.defineFlow(
  {
    name: 'pdfToFlashcardFlow',
    inputSchema: PdfToFlashcardInputSchema,
    outputSchema: PdfToFlashcardOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
