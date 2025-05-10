// src/ai/flows/pdf-to-flashcard.ts
'use server';

/**
 * @fileOverview Converts PDF documents into flashcards.
 * Handles long PDFs by processing extracted text in chunks.
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
  inputSchema: z.object({ // Matches PdfToFlashcardInputSchema for direct use
    pdfDataUri: z
      .string()
      .describe(
        'The PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
  }),
  outputSchema: z.string().describe('The extracted textual content from the PDF document.'),
},
async (input: { pdfDataUri: string }) => { // Explicitly type input based on schema
  const { pdfDataUri } = input;
  
  const llmResponse = await ai.generate({
    prompt: [
      { text: "Please extract all relevant textual content from the provided PDF document. Focus on the substantive information and ignore any metadata or descriptions of the file format itself. If the PDF appears to be an image or unextractable, indicate that no text could be found, otherwise return only the extracted text." },
      { media: { url: pdfDataUri } }
    ],
  });

  return llmResponse.text || "No textual content could be extracted from the PDF.";
});


const generateFlashcardsFromTextChunkPrompt = ai.definePrompt({
  name: 'generateFlashcardsFromTextChunkPrompt',
  input: { schema: z.object({ textChunk: z.string() }) },
  output: { schema: z.array(FlashcardSchema) }, // Output is an array of flashcards
  prompt: `You are an AI assistant specialized in creating high-quality educational flashcards.
You are processing a segment of a larger document. Your task is to analyze the following text chunk and generate flashcards *only* from the content within this specific chunk.

Text Chunk:
{{{textChunk}}}

Carefully analyze this text to identify key concepts, important facts, definitions, and main ideas *within this chunk*.
Create a series of question-and-answer flashcards based *only* on this provided text chunk.
- Questions should be clear and test understanding of the material in this chunk.
- Answers should be concise, accurate, and directly derived from this chunk.
- Do NOT create flashcards about the PDF file itself, its format, how it was provided, or the tools used.
- Focus solely on the informational content *within* the provided text chunk.
- If no relevant content is found in this chunk to create flashcards, return an empty array.

Output the flashcards as a JSON array of objects, where each object has a 'question' and 'answer' field.`,
});


const pdfToFlashcardFlow = ai.defineFlow(
  {
    name: 'pdfToFlashcardFlow',
    inputSchema: PdfToFlashcardInputSchema,
    outputSchema: PdfToFlashcardOutputSchema, // This is z.array(FlashcardSchema)
  },
  async (input: PdfToFlashcardInput): Promise<PdfToFlashcardOutput> => {
    // Step 1: Extract all text content using the tool.
    const fullText = await extractTextContentFromPdfTool(input);

    if (!fullText || fullText.trim() === "" || fullText.toLowerCase().includes("no textual content could be extracted")) {
      console.log("No text extracted or PDF unreadable.");
      return [];
    }

    // Step 2: Chunk the extracted text.
    const MAX_CHUNK_CHAR_LENGTH = 20000; // Adjusted for typical prompt limits and performance
    const textChunks: string[] = [];
    if (fullText.length > MAX_CHUNK_CHAR_LENGTH) {
      for (let i = 0; i < fullText.length; i += MAX_CHUNK_CHAR_LENGTH) {
        textChunks.push(fullText.substring(i, i + MAX_CHUNK_CHAR_LENGTH));
      }
    } else {
      textChunks.push(fullText);
    }
    

    let allFlashcards: PdfToFlashcardOutput = [];

    // Step 3: Process each chunk to generate flashcards.
    for (const chunk of textChunks) {
      if (chunk.trim() === "") continue;

      try {
        const { output: chunkFlashcards } = await generateFlashcardsFromTextChunkPrompt({ textChunk: chunk });
        if (chunkFlashcards && chunkFlashcards.length > 0) {
          allFlashcards = allFlashcards.concat(chunkFlashcards);
        }
      } catch (error) {
        console.error("Error processing a text chunk for flashcards:", error);
        // Optionally, decide if you want to stop or continue with other chunks
      }
    }
    
    // Ensure output is always an array, even if null/undefined from LLM or empty
    return allFlashcards || [];
  }
);
