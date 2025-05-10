
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AppFlashcardClient, ReviewableFlashcard } from '@/types/flashcard';
import Flashcard from './Flashcard';
import LoadingSpinner from './LoadingSpinner';
import MathText from './MathText'; // Import MathText
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Shuffle, MessageSquareQuote, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { answerFlashcardQuestion, type AnswerFlashcardQuestionInput } from '@/ai/flows/answer-flashcard-question-flow';


interface FlashcardReviewProps {
  initialFlashcards: AppFlashcardClient[];
  sourceMaterial: {text?: string; imageUri?: string} | null;
}

export default function FlashcardReview({ initialFlashcards, sourceMaterial }: FlashcardReviewProps) {
  const [cards, setCards] = useState<ReviewableFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    setCards(
      initialFlashcards.map(card => ({ ...card, isFlipped: false }))
    );
    setCurrentIndex(0);
    setUserQuestion('');
    setAiAnswer(null);
  }, [initialFlashcards]);

  const resetQuestionState = () => {
    setUserQuestion('');
    setAiAnswer(null);
  };

  const navigate = useCallback((direction: 'next' | 'prev') => {
    setCards(prevCards => prevCards.map(card => ({ ...card, isFlipped: false }))); 
    resetQuestionState();
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
    resetQuestionState();
    toast({ title: "Cards Shuffled!", duration: 2000 });
  };

  const handleAskAiQuestion = async () => {
    if (!userQuestion.trim() || !currentCard) {
      toast({ title: "Please enter a question.", variant: "destructive", duration: 2000 });
      return;
    }
    setIsAnswering(true);
    setAiAnswer(null);
    try {
      const input: AnswerFlashcardQuestionInput = {
        flashcardQuestion: currentCard.question,
        flashcardAnswer: currentCard.answer,
        userQuestion: userQuestion,
        sourceContextText: sourceMaterial?.text || undefined,
        sourceContextImageUri: sourceMaterial?.imageUri || undefined,
      };
      const result = await answerFlashcardQuestion(input);
      setAiAnswer(result.aiAnswer);
    } catch (error) {
      console.error("Error getting AI answer:", error);
      toast({ title: "AI Error", description: "Could not get an answer from AI. Please try again.", variant: "destructive" });
      setAiAnswer("Sorry, I couldn't process your question right now.");
    } finally {
      setIsAnswering(false);
    }
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

      {/* AI Question Area */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquareQuote className="mr-2 h-6 w-6 text-accent" />
            Ask AI about this Card
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type your question about the current flashcard or related concepts from the source document..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            rows={3}
            disabled={isAnswering}
          />
          <Button onClick={handleAskAiQuestion} disabled={isAnswering || !userQuestion.trim()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Sparkles className="mr-2 h-4 w-4" />
            {isAnswering ? 'Thinking...' : 'Ask AI'}
          </Button>
          {isAnswering && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          )}
          {aiAnswer && !isAnswering && (
            <Card className="bg-secondary/50 mt-4">
              <CardHeader>
                <CardTitle className="text-lg text-secondary-foreground">AI's Answer</CardTitle>
              </CardHeader>
              <CardContent className="text-secondary-foreground">
                <MathText text={aiAnswer} />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
