"use client";

import { Sparkles, LogOut } from 'lucide-react'; // Removed UserCircle as Avatar is used
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { user, logout, loading } = useAuth();

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    const parts = email.split('@')[0];
    // Ensure at least one character, and max two for initials
    if (parts.length >= 2) return parts.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts.substring(0, 1).toUpperCase();
    return email.substring(0,1).toUpperCase() || "U"; // Fallback if split results in empty string
  }
  
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const userEmail = user?.email;
  // Supabase might store profile picture URL in user_metadata.avatar_url or similar.
  // For now, we'll stick to initials.
  // const avatarUrl = user?.user_metadata?.avatar_url; 


  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles className="h-8 w-8 text-primary-foreground mr-3" />
          <h1 className="text-3xl font-bold text-primary-foreground">Cardify</h1>
        </div>
        <div>
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
                    {/* <AvatarImage src={avatarUrl || undefined} alt={displayName || userEmail || "User"} /> */}
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
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {!loading && !user && (
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Log In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
