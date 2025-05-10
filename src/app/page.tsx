"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/cardify/Header';
import InputArea from '@/components/cardify/InputArea';
import FlashcardReview from '@/components/cardify/FlashcardReview';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';
import type { FlashcardCore, AppFlashcardClient } from '@/types/flashcard';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export interface GenerationResult {
  flashcards: FlashcardCore[];
  sourceContext?: { text?: string; imageUri?: string };
}

export default function HomePage() {
  const [flashcards, setFlashcards] = useState<AppFlashcardClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sourceMaterial, setSourceMaterial] = useState<{text?: string; imageUri?: string} | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleFlashcardsGenerated = (result: GenerationResult) => {
    if (!isClient) return; 

    const newFlashcards: AppFlashcardClient[] = result.flashcards.map((card) => ({
      ...card,
      id: crypto.randomUUID(), 
      isKnown: false,
    }));
    setFlashcards(newFlashcards);
    setSourceMaterial(result.sourceContext || null);
  };

  if (authLoading || !user) {
    // Show loading spinner or null while checking auth state or if user is not logged in
    // This prevents rendering the main content before redirection or if auth is still loading.
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <InputArea
          onFlashcardsGenerated={handleFlashcardsGenerated}
          setIsLoading={setIsLoading}
          isLoading={isLoading}
        />
        
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && flashcards.length > 0 && (
          <FlashcardReview initialFlashcards={flashcards} sourceMaterial={sourceMaterial} />
        )}
        
        {!isLoading && flashcards.length === 0 && (
           <Card className="shadow-lg mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2 text-foreground">Welcome to Cardify!</h3>
              <p className="text-muted-foreground">
                Ready to supercharge your studies? 
              </p>
              <p className="text-muted-foreground mt-1">
                 Use the controls above to upload an image, PDF, or enter text to generate your first set of flashcards.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} Cardify - AI Powered Learning.
      </footer>
    </div>
  );
}
