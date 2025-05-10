"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AppFlashcardClient, ReviewableFlashcard } from '@/types/flashcard';
import Flashcard from './Flashcard';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Shuffle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FlashcardReviewProps {
  initialFlashcards: AppFlashcardClient[];
}

export default function FlashcardReview({ initialFlashcards }: FlashcardReviewProps) {
  const [cards, setCards] = useState<ReviewableFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setCards(
      initialFlashcards.map(card => ({ ...card, isFlipped: false }))
    );
    setCurrentIndex(0);
  }, [initialFlashcards]);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    setCards(prevCards => prevCards.map(card => ({ ...card, isFlipped: false }))); // Flip back all cards
    setCurrentIndex(prevIndex => {
      if (direction === 'next') {
        return prevIndex < cards.length - 1 ? prevIndex + 1 : prevIndex;
      } else {
        return prevIndex > 0 ? prevIndex - 1 : prevIndex;
      }
    });
  }, [cards.length]);

  const toggleFlipCurrentCard = () => {
    setCards(prevCards => 
      prevCards.map((card, index) => 
        index === currentIndex ? { ...card, isFlipped: !card.isFlipped } : card
      )
    );
  };

  const markCardStatus = (isKnown: boolean) => {
    setCards(prevCards =>
      prevCards.map((card, index) =>
        index === currentIndex ? { ...card, isKnown } : card
      )
    );
    toast({
      title: `Card marked as ${isKnown ? '"Known"' : '"Review Again"'}`,
      duration: 2000,
    });
    if (currentIndex < cards.length - 1) {
      navigate('next');
    } else {
      toast({ title: "Deck Complete!", description: "You've reviewed all cards."});
    }
  };

  const shuffleCards = () => {
    setCards(prevCards => {
      const shuffled = [...prevCards].sort(() => Math.random() - 0.5);
      return shuffled.map(card => ({ ...card, isFlipped: false }));
    });
    setCurrentIndex(0);
    toast({ title: "Cards Shuffled!", duration: 2000 });
  };

  if (!cards.length) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No flashcards to review. Generate some first!</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercentage = ((currentIndex + 1) / cards.length) * 100;
  const knownCardsCount = cards.filter(card => card.isKnown).length;

  return (
    <section aria-labelledby="flashcard-review-title" className="space-y-6 max-w-2xl mx-auto">
       <div className="text-center">
        <h2 id="flashcard-review-title" className="text-2xl font-semibold text-foreground">Review Your Flashcards</h2>
        <p className="text-muted-foreground">Click a card to flip it. Use controls to navigate and mark your progress.</p>
      </div>

      <div onClick={toggleFlipCurrentCard} className="cursor-pointer" aria-live="polite">
        <Flashcard
          question={currentCard.question}
          answer={currentCard.answer}
          isFlipped={currentCard.isFlipped}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{knownCardsCount} / {cards.length} Known</span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 [&>div]:bg-accent" aria-label={`${Math.round(progressPercentage)}% progress`} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button variant="outline" onClick={() => navigate('prev')} disabled={currentIndex === 0} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" onClick={() => navigate('next')} disabled={currentIndex === cards.length - 1} className="w-full">
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={() => markCardStatus(true)} className="w-full bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Knew It!
        </Button>
         <Button onClick={() => markCardStatus(false)} className="w-full bg-red-500 hover:bg-red-600 text-white">
          <RotateCcw className="mr-2 h-4 w-4" /> Review Again
        </Button>
      </div>
      <div className="flex justify-center mt-4">
        <Button variant="ghost" onClick={shuffleCards} className="text-accent hover:text-accent/80">
          <Shuffle className="mr-2 h-4 w-4" /> Shuffle Cards
        </Button>
      </div>
    </section>
  );
}
