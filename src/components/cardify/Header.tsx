"use client";

import { Sparkles, LogOut, Layers } from 'lucide-react'; // Added Layers icon
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from 'next/link'; // Import Link

export default function Header() {
  const { user, logout, loading } = useAuth();

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    const parts = email.split('@')[0];
    if (parts.length >= 2) return parts.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts.substring(0, 1).toUpperCase();
    return email.substring(0,1).toUpperCase() || "U";
  }
  
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const userEmail = user?.email;

  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center cursor-pointer">
          <Sparkles className="h-8 w-8 text-primary-foreground mr-3" />
          <h1 className="text-3xl font-bold text-primary-foreground">Cardify</h1>
        </Link>
        <div>
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {displayName}
                    </p>
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/decks" passHref legacyBehavior>
                  <DropdownMenuItem className="cursor-pointer">
                    <Layers className="mr-2 h-4 w-4" />
                    <span>My Decks</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {!loading && !user && (
             <Link href="/login" passHref legacyBehavior>
                <Button variant="outline">
                Log In
                </Button>
             </Link>
          )}
        </div>
      </div>
    </header>
  );
}
