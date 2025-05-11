// src/components/cardify/DeckListItem.tsx
"use client";

import type { Deck } from '@/types/flashcard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DeckListItemProps {
  deck: Deck;
  onDelete: (deckId: string) => Promise<void>;
  isDeleting: boolean;
}

export default function DeckListItem({ deck, onDelete, isDeleting }: DeckListItemProps) {
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the deck "${deck.name}"? This action cannot be undone.`)) {
      await onDelete(deck.id);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl">{deck.name}</CardTitle>
        <CardDescription>
          {deck.flashcards.length} card{deck.flashcards.length !== 1 ? 's' : ''}
          {' - '}
          Created {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Optionally show a snippet or icons for source type */}
        {(deck.source_text || deck.source_image_uri) && (
             <p className="text-sm text-muted-foreground truncate">
               Source: {deck.source_text ? `Text snippet (first 50 chars: ${deck.source_text.substring(0,50)}...)` : 'Image'}
             </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Link href={`/decks/${deck.id}/review`} passHref legacyBehavior>
          <Button variant="outline" className="flex-1 border-accent text-accent hover:bg-accent/10">
            <Eye className="mr-2 h-4 w-4" /> Review
          </Button>
        </Link>
        {/* Edit functionality can be added later */}
        {/* <Button variant="outline" className="flex-1">
          <Edit3 className="mr-2 h-4 w-4" /> Edit
        </Button> */}
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1"
        >
          <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </CardFooter>
    </Card>
  );
}
