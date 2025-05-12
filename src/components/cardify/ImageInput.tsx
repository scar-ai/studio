
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
// import { readFileAsDataURL } from '@/lib/fileReader'; // No longer directly used
import { imageToFlashcard, type ImageToFlashcardInput } from '@/ai/flows/image-to-flashcard';
import type { GenerationResult } from '@/app/page';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { resizeImageAndGetDataUrl } from '@/lib/imageUtils'; // Import the new utility

// Vercel Hobby plan limits might restrict file size/processing time. Let's set a reasonable client-side limit.
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const TARGET_IMAGE_RESOLUTION = 720; // Target 720p for the longest side

interface ImageInputProps {
  onFlashcardsGenerated: (result: GenerationResult) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function ImageInput({ onFlashcardsGenerated, setIsLoading, isLoading }: ImageInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null); // Reset error on new file selection
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFileError('Invalid file type. Please select an image (e.g., JPG, PNG, GIF, WEBP).');
        setSelectedFile(null);
        event.target.value = ""; // Clear the input
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setFileError(`Image is too large. Please select a file smaller than ${MAX_IMAGE_SIZE_MB} MB.`);
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
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select an image file.", variant: "destructive" });
      return;
    }
     if (fileError) {
      toast({ title: "File Error", description: fileError, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let resizedPhotoDataUri = '';
    try {
      // Resize the image before getting its data URL
      resizedPhotoDataUri = await resizeImageAndGetDataUrl(selectedFile, TARGET_IMAGE_RESOLUTION);
      
      const input: ImageToFlashcardInput = { photoDataUri: resizedPhotoDataUri };
      const result = await imageToFlashcard(input);

      if (result.flashcards && result.flashcards.length > 0) {
        onFlashcardsGenerated({ flashcards: result.flashcards, sourceContext: { imageUri: resizedPhotoDataUri } });
        toast({ title: "Success!", description: `${result.flashcards.length} flashcards generated from image.` });
      } else {
        onFlashcardsGenerated({ flashcards: [], sourceContext: { imageUri: resizedPhotoDataUri } });
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the image." });
      }
    } catch (error: any) {
      console.error("Error processing image or generating flashcards:", error);
      // Pass resizedPhotoDataUri even in case of error if available, so AI can still potentially use it for context.
      onFlashcardsGenerated({ flashcards: [], sourceContext: resizedPhotoDataUri ? { imageUri: resizedPhotoDataUri } : undefined });
      toast({
        title: "Error Processing Image",
        description: `${error.message || 'Failed to process image or generate flashcards. This might be due to file complexity or server limitations. Please try a different image or check console for details.'}`,
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
      <h3 className="text-lg font-semibold text-card-foreground">Upload an Image</h3>
      <p className="text-sm text-muted-foreground">
        Take a photo of your notes or upload a screenshot. Images will be downscaled to {TARGET_IMAGE_RESOLUTION}p. (Max original size {MAX_IMAGE_SIZE_MB}MB)
      </p>
      <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="file:text-accent file:font-semibold" disabled={isLoading} />
       {fileError && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}
      {selectedFile && !fileError && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
      <Button onClick={handleSubmit} disabled={isLoading || !selectedFile || !!fileError} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <UploadCloud className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Generate from Image'}
      </Button>
    </div>
  );
}
