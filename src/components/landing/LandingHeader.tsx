"use client";

import Link from 'next/link';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; 

export default function LandingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/landing" className="flex items-center space-x-2">
          <Sparkles className="h-7 w-7 text-accent" />
          <span className="text-2xl font-bold text-foreground">Cardify</span>
        </Link>
        <nav className="flex items-center space-x-2">
          {loading ? (
            <div className="h-9 w-40 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/">Go to App</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Log In
                </Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up Free
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
