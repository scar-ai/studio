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

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const PdfToFlashcardOutputSchema = z.array(FlashcardSchema);
export type PdfToFlashcardOutput = z.infer<typeof PdfToFlashcardOutputSchema>;

export async function pdfToFlashcard(input: PdfToFlashcardInput): Promise<PdfToFlashcardOutput> {
  return pdfToFlashcardFlow(input);
}

const extractTextContentFromPdfTool = ai.defineTool({
  name: 'extractTextContentFromPdfTool',
  description: 'Extracts the textual content from a given PDF document. This tool focuses on retrieving the substantive information within the PDF, ignoring metadata or formatting instructions about the PDF itself.',
  inputSchema: z.object({
    pdfDataUri: z
      .string()
      .describe(
        'The PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
  }),
  outputSchema: z.string().describe('The extracted textual content from the PDF document.'),
},
async (input) => {
  const { pdfDataUri } = input;
  
  // Use the Genkit AI instance to generate content.
  // The default model (e.g., gemini-2.0-flash) should support multimodal input.
  const llmResponse = await ai.generate({
    prompt: [
      { text: "Please extract all relevant textual content from the provided PDF document. Focus on the substantive information and ignore any metadata or descriptions of the file format itself. If the PDF appears to be an image or unextractable, indicate that no text could be found." },
      { media: { url: pdfDataUri } } // Assumes pdfDataUri includes the MIME type e.g. data:application/pdf;base64,...
    ],
  });

  // The response object should contain the extracted text.
  // Ensure a string is returned, even if empty or extraction fails.
  return llmResponse.text || "No textual content could be extracted from the PDF.";
});

const prompt = ai.definePrompt({
  name: 'pdfToFlashcardPrompt',
  input: {schema: PdfToFlashcardInputSchema},
  output: {schema: PdfToFlashcardOutputSchema},
  tools: [extractTextContentFromPdfTool], // Use the updated tool
  prompt: `You are an AI assistant specialized in creating high-quality educational flashcards.

Your task is to process a PDF document and generate flashcards from its content. Follow these steps:

1.  You will be provided with a reference to a PDF document (via '{{pdfDataUri}}').
2.  Use the 'extractTextContentFromPdfTool' tool to obtain the textual content from this PDF. Pass the '{{pdfDataUri}}' to the tool.
3.  Once you receive the extracted text from the tool, carefully analyze it to identify key concepts, important facts, definitions, and main ideas. If the extracted text is empty or indicates no content was found, output an empty array of flashcards.
4.  Based *only* on this extracted textual content, create a series of question-and-answer flashcards.
    *   Questions should be clear and test understanding of the material.
    *   Answers should be concise, accurate, and directly derived from the extracted text.
5.  **Crucially, do NOT create flashcards about the PDF file itself, its format, how it was provided (e.g., data URI details), or the tools used. Your focus must be solely on the informational content *within* the PDF.**

Input PDF reference for the tool: {{pdfDataUri}}

Output the flashcards as a JSON array of objects, where each object has a 'question' and 'answer' field, as per the defined output schema. If no relevant content is found to create flashcards, return an empty array.
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
    // Ensure output is always an array, even if null/undefined from LLM
    return output || []; 
  }
);

