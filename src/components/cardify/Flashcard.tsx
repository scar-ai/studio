import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  className?: string;
}

export default function Flashcard({ question, answer, isFlipped, className }: FlashcardProps) {
  return (
    <div className={cn("perspective w-full h-80 md:h-96", className)}>
      <div
        className={cn(
          "relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front of the card (Question) */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="w-full h-full flex flex-col shadow-xl">
            <CardHeader className="bg-secondary rounded-t-lg">
              <CardTitle className="text-xl text-secondary-foreground">Question</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center p-6 text-center">
              <p className="text-lg md:text-xl">{question}</p>
            </CardContent>
          </Card>
        </div>

        {/* Back of the card (Answer) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <Card className="w-full h-full flex flex-col shadow-xl">
            <CardHeader className="bg-accent rounded-t-lg">
              <CardTitle className="text-xl text-accent-foreground">Answer</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center p-6 text-center">
              <p className="text-lg md:text-xl">{answer}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
