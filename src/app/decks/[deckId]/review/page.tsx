// src/app/decks/[deckId]/review/page.tsx
"use client";

import React, { useEffect, useState }from 'react';
import Header from '@/components/cardify/Header';
import FlashcardReview from '@/components/cardify/FlashcardReview';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';
import type { Deck, AppFlashcardClient } from '@/types/flashcard';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation'; // useParams for client component
import { getDeckById } from '@/lib/supabase/decks';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function DeckReviewPage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [appFlashcards, setAppFlashcards] = useState<AppFlashcardClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams(); // Correct hook for client components
  const { toast } = useToast();
  
  const deckId = Array.isArray(params.deckId) ? params.deckId[0] : params.deckId;


  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && deckId) {
      setIsLoading(true);
      setError(null);
      getDeckById(deckId as string)
        .then(fetchedDeck => {
          if (fetchedDeck) {
            setDeck(fetchedDeck);
            const clientFlashcards: AppFlashcardClient[] = fetchedDeck.flashcards.map(fc => ({
              ...fc,
              id: crypto.randomUUID(), // Generate client-side ID
              isKnown: false, // Default state for review session
            }));
            setAppFlashcards(clientFlashcards);
          } else {
            setError("Deck not found or you don't have access to it.");
            toast({ title: "Error", description: "Deck not found.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Error fetching deck for review:", err);
          setError(err.message || "Failed to load deck for review.");
          toast({ title: "Error", description: err.message || "Failed to load deck.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else if (!deckId && !authLoading && user) {
        setError("Deck ID is missing.");
        setIsLoading(false);
    }
  }, [user, deckId, toast, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex justify-center items-center">
          <p>Redirecting to login...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
           <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="items-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <CardTitle className="text-2xl text-destructive">Error Loading Deck</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/decks">
                <Button variant="outline">Back to My Decks</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!deck || appFlashcards.length === 0) {
     return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
           <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="items-center">
                <CardTitle className="text-2xl">Deck Empty or Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">This deck has no flashcards or could not be loaded.</p>
              <Link href="/decks">
                <Button variant="outline">Back to My Decks</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="mb-6">
             <Link href="/decks" className="text-accent hover:underline text-sm">
                &larr; Back to My Decks
            </Link>
            <h1 className="text-3xl font-bold mt-2">Reviewing: {deck.name}</h1>
        </div>
        <FlashcardReview
          initialFlashcards={appFlashcards}
          sourceMaterial={{ text: deck.source_text || undefined, imageUri: deck.source_image_uri || undefined }}
        />
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} Cardify - AI Powered Learning.
      </footer>
    </div>
  );
}
