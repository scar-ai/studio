
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/fileReader';
import { pdfToFlashcard, type PdfToFlashcardInput, type PdfToFlashcardOutput } from '@/ai/flows/pdf-to-flashcard';
import type { GenerationResult } from '@/app/page';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Vercel Hobby plan limits might restrict file size/processing time. Let's set a reasonable client-side limit.
// PDFs can be larger, but processing time is the main constraint.
const MAX_PDF_SIZE_MB = 20;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;


interface PdfInputProps {
  onFlashcardsGenerated: (result: GenerationResult) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function PdfInput({ onFlashcardsGenerated, setIsLoading, isLoading }: PdfInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null); // Reset error on new file selection
     if (file) {
       if (file.size > MAX_PDF_SIZE_BYTES) {
         setFileError(`PDF is too large. Please select a file smaller than ${MAX_PDF_SIZE_MB} MB.`);
         setSelectedFile(null);
         event.target.value = ""; // Clear the input
       } else {
        setSelectedFile(file);
       }
    } else {
      setSelectedFile(null);
    }
  };

  const resetInput = () => {
      setSelectedFile(null);
      setFileError(null);
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a PDF file.", variant: "destructive" });
      return;
    }
    if (fileError) {
      toast({ title: "File Error", description: fileError, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let result: PdfToFlashcardOutput | null = null;
    try {
      const pdfDataUri = await readFileAsDataURL(selectedFile);
      const input: PdfToFlashcardInput = { pdfDataUri };
      result = await pdfToFlashcard(input);

      if (result.flashcards && result.flashcards.length > 0) {
        onFlashcardsGenerated({ flashcards: result.flashcards, sourceContext: { text: result.extractedText } });
        toast({ title: "Success!", description: `${result.flashcards.length} flashcards generated from PDF.` });
      } else {
        onFlashcardsGenerated({ flashcards: [], sourceContext: { text: result.extractedText } });
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the PDF. The extracted text was still passed as context." });
      }
    } catch (error: any) {
      console.error("Error generating flashcards from PDF:", error);
      onFlashcardsGenerated({ flashcards: [], sourceContext: { text: result?.extractedText || "Error extracting text or processing PDF." } });
      toast({
        title: "Error Processing PDF",
        description: `Failed to generate flashcards. This might be due to file size, complexity, or server limitations (especially on deployment platforms like Vercel). Please try a smaller or simpler PDF. Error: ${error.message || 'Unknown error'}`,
        variant: "destructive",
        duration: 9000, // Longer duration for error message
      });
    } finally {
      setIsLoading(false);
      resetInput();
    }
  };

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg shadow">
      <h3 className="text-lg font-semibold text-card-foreground">Upload a PDF</h3>
      <p className="text-sm text-muted-foreground">
        Upload your lecture slides or study documents in PDF format. (Max {MAX_PDF_SIZE_MB}MB)
      </p>
      <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="file:text-accent file:font-semibold" disabled={isLoading} />
       {fileError && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}
      {selectedFile && !fileError && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
      <Button onClick={handleSubmit} disabled={isLoading || !selectedFile || !!fileError} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <FileText className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Generate from PDF'}
      </Button>
    </div>
  );
}
