import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  };
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={`animate-spin text-accent ${sizeClasses[size]}`} />
      <p className="text-muted-foreground">Generating flashcards...</p>
    </div>
  );
}
