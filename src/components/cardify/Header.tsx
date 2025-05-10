import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center">
        <Sparkles className="h-8 w-8 text-primary-foreground mr-3" />
        <h1 className="text-3xl font-bold text-primary-foreground">Cardify</h1>
      </div>
    </header>
  );
}
