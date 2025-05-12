
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/fileReader';
import { imageToFlashcard, type ImageToFlashcardInput } from '@/ai/flows/image-to-flashcard';
import type { GenerationResult } from '@/app/page';
import { UploadCloud } from 'lucide-react';

interface ImageInputProps {
  onFlashcardsGenerated: (result: GenerationResult) => void;
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
    let photoDataUri = '';
    try {
      photoDataUri = await readFileAsDataURL(selectedFile);
      const input: ImageToFlashcardInput = { photoDataUri };
      const result = await imageToFlashcard(input);
      
      if (result.flashcards && result.flashcards.length > 0) {
        onFlashcardsGenerated({ flashcards: result.flashcards, sourceContext: { imageUri: photoDataUri } });
        toast({ title: "Success!", description: `${result.flashcards.length} flashcards generated from image.` });
      } else {
        onFlashcardsGenerated({ flashcards: [], sourceContext: { imageUri: photoDataUri } });
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the image." });
      }
    } catch (error: any) {
      console.error("Error generating flashcards from image:", error);
      // Pass photoDataUri even in case of error if available, so AI can still potentially use it.
      onFlashcardsGenerated({ flashcards: [], sourceContext: photoDataUri ? { imageUri: photoDataUri } : undefined });
      toast({ 
        title: "Error Processing Image", 
        description: "Failed to generate flashcards. The file might be too large, a network issue occurred, or the content is unprocessable. Please try a smaller file or check your connection.", 
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
      setSelectedFile(null); 
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
