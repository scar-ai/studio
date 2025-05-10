'use server';
/**
 * @fileOverview Provides a Genkit flow to answer user questions about a specific flashcard,
 * potentially using the context of the original document and general AI knowledge.
 *
 * - answerFlashcardQuestion - A function that takes flashcard details, user's question, and optional source context, then returns an AI-generated answer.
 * - AnswerFlashcardQuestionInput - The input type for the answerFlashcardQuestion function.
 * - AnswerFlashcardQuestionOutput - The return type for the answerFlashcardQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFlashcardQuestionInputSchema = z.object({
  flashcardQuestion: z.string().describe('The question part of the flashcard.'),
  flashcardAnswer: z.string().describe('The answer part of the flashcard.'),
  userQuestion: z.string().describe('The user\'s question about this flashcard.'),
  sourceContextText: z.string().optional().describe('The textual content of the original document/source from which this flashcard was generated. Use this for broader context if the flashcard content is insufficient.'),
  sourceContextImageUri: z.string().optional().describe("A data URI of the original image source, if the flashcard was generated from an image. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Use this for visual context."),
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

When providing answers or explanations that involve mathematical expressions or formulas, please use LaTeX format.
- For inline mathematics, use single dollar signs: \`$your_latex_code$\` (e.g., \`$E=mc^2$\`).
- For display/block mathematics, use double dollar signs: \`$$your_latex_code$$\` (e.g., \`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$\`).
Ensure the LaTeX code is valid.

Flashcard Question:
"{{flashcardQuestion}}"

Flashcard Answer:
"{{flashcardAnswer}}"

{{#if sourceContextText}}
This flashcard was derived from the following text. You should use this as the primary source of broader context:
--- Document Text Start ---
{{sourceContextText}}
--- Document Text End ---
{{/if}}

{{#if sourceContextImageUri}}
This flashcard was derived from the following image. You should use this as the primary source of broader visual context:
{{media url=sourceContextImageUri}}
{{/if}}

User's Question (about the flashcard or related concepts):
"{{userQuestion}}"

Please provide a clear and concise answer to the user's question.
1. Prioritize information directly from the flashcard if the question is specific to it.
2. If the flashcard content is insufficient, or the question asks for broader context, refer to the provided source document (text or image, if available).
3. You may also use your general knowledge to elaborate on concepts, explain related topics, or if the specific information is not in the provided materials.
4. If the user's question seems completely unrelated to the flashcard topic or the source document, politely state that you can provide the most relevant answers to questions related to the study material.

Focus on being helpful and educational. Your response should directly address the "{{userQuestion}}".
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
