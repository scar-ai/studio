"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/fileReader';
import { pdfToFlashcard, type PdfToFlashcardInput } from '@/ai/flows/pdf-to-flashcard';
import type { FlashcardCore } from '@/types/flashcard';
import { FileText } from 'lucide-react';

interface PdfInputProps {
  onFlashcardsGenerated: (flashcards: FlashcardCore[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function PdfInput({ onFlashcardsGenerated, setIsLoading, isLoading }: PdfInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
     if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a PDF file.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const pdfDataUri = await readFileAsDataURL(selectedFile);
      const input: PdfToFlashcardInput = { pdfDataUri };
      const result = await pdfToFlashcard(input); // Output is PdfToFlashcardOutput which is FlashcardCore[]
      
      if (result && result.length > 0) {
        onFlashcardsGenerated(result);
        toast({ title: "Success!", description: `${result.length} flashcards generated from PDF.` });
      } else {
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the PDF." });
        onFlashcardsGenerated([]);
      }
    } catch (error) {
      console.error("Error generating flashcards from PDF:", error);
      toast({ title: "Error", description: "Failed to generate flashcards from PDF. Please try again.", variant: "destructive" });
      onFlashcardsGenerated([]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg shadow">
      <h3 className="text-lg font-semibold text-card-foreground">Upload a PDF</h3>
      <p className="text-sm text-muted-foreground">
        Upload your lecture slides or study documents in PDF format.
      </p>
      <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="file:text-accent file:font-semibold" disabled={isLoading} />
      {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
      <Button onClick={handleSubmit} disabled={isLoading || !selectedFile} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <FileText className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Generate from PDF'}
      </Button>
    </div>
  );
}
