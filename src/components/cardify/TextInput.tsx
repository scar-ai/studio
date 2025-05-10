"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { textToFlashcard, type TextToFlashcardInput } from '@/ai/flows/text-to-flashcard';
import type { FlashcardCore } from '@/types/flashcard';
import { Pilcrow } from 'lucide-react';

interface TextInputProps {
  onFlashcardsGenerated: (flashcards: FlashcardCore[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function TextInput({ onFlashcardsGenerated, setIsLoading, isLoading }: TextInputProps) {
  const [text, setText] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({ title: "No text provided", description: "Please enter some text to generate flashcards.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const input: TextToFlashcardInput = { text };
      const result = await textToFlashcard(input);
      
      if (result.flashcards && result.flashcards.length > 0) {
        onFlashcardsGenerated(result.flashcards);
        toast({ title: "Success!", description: `${result.flashcards.length} flashcards generated from text.` });
      } else {
        toast({ title: "No flashcards generated", description: "Could not find information to create flashcards from the text." });
        onFlashcardsGenerated([]);
      }
    } catch (error) {
      console.error("Error generating flashcards from text:", error);
      toast({ title: "Error", description: "Failed to generate flashcards from text. Please try again.", variant: "destructive" });
      onFlashcardsGenerated([]);
    } finally {
      setIsLoading(false);
      setText('');
    }
  };

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg shadow">
      <h3 className="text-lg font-semibold text-card-foreground">Enter Text</h3>
      <p className="text-sm text-muted-foreground">
        Paste your notes or type directly. We'll create flashcards from your text.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your lesson notes or key concepts here..."
        rows={8}
        className="resize-none"
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <Pilcrow className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Generate from Text'}
      </Button>
    </div>
  );
}
