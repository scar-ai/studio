
// src/app/decks/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/cardify/Header';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';
import DeckListItem from '@/components/cardify/DeckListItem';
import type { Deck } from '@/types/flashcard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getDecksForUser, deleteDeckById } from '@/lib/supabase/decks';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DecksListPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/landing'); // Redirect to landing if not authenticated
    } else if (user) {
      fetchDecks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const fetchDecks = async () => {
    setIsLoading(true);
    try {
      const userDecks = await getDecksForUser();
      setDecks(userDecks);
    } catch (error: any) {
      console.error("Error fetching decks:", error);
      toast({ title: "Error", description: `Failed to load decks: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    setDeletingDeckId(deckId);
    try {
      const result = await deleteDeckById(deckId);
      if (result.success) {
        toast({ title: "Deck Deleted", description: "The deck has been successfully deleted." });
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
      } else {
        throw new Error(result.error || "Failed to delete deck for an unknown reason.");
      }
    } catch (error: any) {
      console.error("Error deleting deck:", error);
      toast({ title: "Error Deleting Deck", description: error.message, variant: "destructive" });
    } finally {
      setDeletingDeckId(null);
    }
  };

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
  
  if (!user && !authLoading) { // Added !authLoading to ensure it's not a premature render
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback or during brief state transitions:
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex justify-center items-center">
          <p>Redirecting...</p> {/* Changed from login to generic redirecting */}
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Flashcard Decks</h1>
          <Link href="/" passHref legacyBehavior>
            <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Deck
            </Button>
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">You haven't created any decks yet.</p>
            <Link href="/" passHref legacyBehavior>
              <Button variant="link" className="text-accent text-lg mt-4">
                Create your first deck
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                onDelete={handleDeleteDeck}
                isDeleting={deletingDeckId === deck.id}
              />
            ))}
          </div>
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} Cardify - AI Powered Learning.
      </footer>
    </div>
  );
}
