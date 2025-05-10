// src/ai/flows/pdf-to-flashcard.ts
'use server';

/**
 * @fileOverview Converts PDF documents into flashcards.
 * Handles long PDFs by processing extracted text in chunks.
 * Returns generated flashcards and the full extracted text content.
 *
 * - pdfToFlashcard - A function that takes a PDF document (as a data URI) and returns flashcards and extracted text.
 * - PdfToFlashcardInput - The input type for the pdfToFlashcard function.
 * - PdfToFlashcardOutput - The return type for the pdfToFlashcard function, now including extractedText.
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

const PdfToFlashcardOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe("An array of generated flashcards."),
  extractedText: z.string().describe("The full text extracted from the PDF document."),
});
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
async (input: { pdfDataUri: string }) => { 
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
  output: { schema: z.array(FlashcardSchema) }, 
  prompt: `You are an AI assistant specialized in creating high-quality, educationally valuable flashcards.
You are processing a segment of a larger document. Your task is to analyze the following text chunk and generate flashcards focusing *only* on the most important concepts, key definitions, significant facts, and core ideas presented *within this specific chunk*.

When generating flashcard questions or answers that involve mathematical expressions or formulas, please use LaTeX format.
- For inline mathematics, use single dollar signs: \`$your_latex_code$\` (e.g., \`$E=mc^2$\`).
- For display/block mathematics, use double dollar signs: \`$$your_latex_code$$\` (e.g., \`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$\`).
Ensure the LaTeX code is valid.

Text Chunk:
{{{textChunk}}}

Carefully analyze this text chunk. Prioritize information that is crucial for understanding the subject matter of this chunk. Avoid creating flashcards for trivial details, examples unless they illustrate a key concept, or overly specific data points unless they are fundamental to this chunk's topic. The flashcards should help a student learn and remember the most essential parts of this section of the document.

- Questions should be clear and test understanding of the key material in this chunk.
- Answers should be concise, accurate, and directly derived from this chunk, reflecting the most important information.
- Do NOT create flashcards about the PDF file itself, its format, how it was provided, or the tools used.
- Focus solely on the informational content *within* the provided text chunk that holds the most educational value.
- If no relevant, important content is found in this chunk to create flashcards, return an empty array.
- Generate the flashcards in the language of the provided pdf.

Output the flashcards as a JSON array of objects, where each object has a 'question' and 'answer' field.`,
});


const pdfToFlashcardFlow = ai.defineFlow(
  {
    name: 'pdfToFlashcardFlow',
    inputSchema: PdfToFlashcardInputSchema,
    outputSchema: PdfToFlashcardOutputSchema, 
  },
  async (input: PdfToFlashcardInput): Promise<PdfToFlashcardOutput> => {
    // Step 1: Extract all text content using the tool.
    const fullText = await extractTextContentFromPdfTool(input);

    if (!fullText || fullText.trim() === "" || fullText.toLowerCase().includes("no textual content could be extracted")) {
      console.log("No text extracted or PDF unreadable.");
      return { flashcards: [], extractedText: fullText || "No textual content could be extracted from the PDF." };
    }

    // Step 2: Chunk the extracted text.
    const MAX_CHUNK_CHAR_LENGTH = 20000; 
    const textChunks: string[] = [];
    if (fullText.length > MAX_CHUNK_CHAR_LENGTH) {
      for (let i = 0; i < fullText.length; i += MAX_CHUNK_CHAR_LENGTH) {
        textChunks.push(fullText.substring(i, i + MAX_CHUNK_CHAR_LENGTH));
      }
    } else {
      textChunks.push(fullText);
    }
    
    let allFlashcards: FlashcardCore[] = [];

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
      }
    }
    
    return { flashcards: allFlashcards || [], extractedText: fullText };
  }
);

type FlashcardCore = z.infer<typeof FlashcardSchema>;
