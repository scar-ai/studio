
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/cardify/Header';
import InputArea from '@/components/cardify/InputArea';
import FlashcardReview from '@/components/cardify/FlashcardReview';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';
import SaveDeckDialog from '@/components/cardify/SaveDeckDialog';
import type { FlashcardCore, AppFlashcardClient, StoredFlashcard } from '@/types/flashcard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createDeck } from '@/lib/supabase/decks';
import Link from 'next/link';

export interface GenerationResult {
  flashcards: FlashcardCore[];
  sourceContext?: { text?: string; imageUri?: string };
}

export default function HomePage() {
  const [flashcards, setFlashcards] = useState<AppFlashcardClient[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For flashcard generation
  const [isClient, setIsClient] = useState(false);
  const [sourceMaterial, setSourceMaterial] = useState<{text?: string; imageUri?: string} | null>(null);
  
  const [isSaveDeckDialogOpen, setIsSaveDeckDialogOpen] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      // If unauthenticated on the client, redirect to landing page.
      // Middleware should ideally handle this first, but this is a client-side fallback.
      router.replace('/landing');
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
    // Reset deck saved status if new cards are generated
  };

  const handleSaveDeck = async (deckName: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to save a deck.", variant: "destructive" });
      return;
    }
    if (flashcards.length === 0) {
      toast({ title: "No Flashcards", description: "Generate some flashcards before saving.", variant: "destructive" });
      return;
    }

    setIsSavingDeck(true);
    try {
      // Convert AppFlashcardClient[] to StoredFlashcard[]
      const storedFlashcards: StoredFlashcard[] = flashcards.map(({ question, answer }) => ({ question, answer }));
      
      await createDeck(deckName, storedFlashcards, sourceMaterial);
      toast({ title: "Deck Saved!", description: `"${deckName}" has been saved successfully.` });
      setIsSaveDeckDialogOpen(false);
      // Optionally, clear current flashcards or navigate to decks page
      // setFlashcards([]); 
      // setSourceMaterial(null);
    } catch (error: any) {
      console.error("Error saving deck:", error);
      toast({ title: "Save Failed", description: error.message || "Could not save the deck. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingDeck(false);
    }
  };


  if (authLoading || !user) {
    // Show loading spinner if auth is loading or if user is not yet available (before redirect kicks in)
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
          <>
            <div className="flex justify-end">
              <Button onClick={() => setIsSaveDeckDialogOpen(true)} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                <Save className="mr-2 h-4 w-4" />
                Save Deck
              </Button>
            </div>
            <FlashcardReview initialFlashcards={flashcards} sourceMaterial={sourceMaterial} />
          </>
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
              <p className="text-muted-foreground mt-1">
                 You can also view your <Link href="/decks" className="text-accent hover:underline">saved decks</Link>.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <SaveDeckDialog
        isOpen={isSaveDeckDialogOpen}
        onOpenChange={setIsSaveDeckDialogOpen}
        onSave={handleSaveDeck}
        isSaving={isSavingDeck}
        defaultName={sourceMaterial?.text ? "Deck from Text" : (sourceMaterial?.imageUri ? "Deck from Image" : "My New Deck")}
      />

      <footer className="text-center p-4 text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} Cardify - AI Powered Learning.
      </footer>
    </div>
  );
}
