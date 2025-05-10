"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/fileReader';
import { imageToFlashcard, type ImageToFlashcardInput } from '@/ai/flows/image-to-flashcard';
import type { FlashcardCore } from '@/types/flashcard';
import { UploadCloud } from 'lucide-react';

interface ImageInputProps {
  onFlashcardsGenerated: (flashcards: FlashcardCore[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function ImageInput({ onFlashcardsGenerated, setIsLoading, isLoading }: ImageInputProps) {
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
      toast({ title: "No file selected", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const photoDataUri = await readFileAsDataURL(selectedFile);
      const input: ImageToFlashcardInput = { photoDataUri };
      const result = await imageToFlashcard(input);
      
      if (result.flashcards && result.flashcards.length > 0) {
        onFlashcardsGenerated(result.flashcards);
        toast({ title: "Success!", description: `${result.flashcards.length} flashcards generated from image.` });
      } else {
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the image." });
        onFlashcardsGenerated([]);
      }
    } catch (error) {
      console.error("Error generating flashcards from image:", error);
      toast({ title: "Error", description: "Failed to generate flashcards from image. Please try again.", variant: "destructive" });
       onFlashcardsGenerated([]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null); 
      // Reset file input visually (this is a common trick)
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg shadow">
      <h3 className="text-lg font-semibold text-card-foreground">Upload an Image</h3>
      <p className="text-sm text-muted-foreground">
        Take a photo of your notes or upload a screenshot. We'll turn it into flashcards!
      </p>
      <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="file:text-accent file:font-semibold" disabled={isLoading} />
      {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
      <Button onClick={handleSubmit} disabled={isLoading || !selectedFile} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <UploadCloud className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Generate from Image'}
      </Button>
    </div>
  );
}
