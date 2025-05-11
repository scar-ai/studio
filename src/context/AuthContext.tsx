"use client";

import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import LoadingSpinner from "@/components/cardify/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthContext: Supabase auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          // Optionally, redirect on sign-in if not already on the main page
          // router.push('/'); 
        } else if (event === 'SIGNED_OUT') {
          // router.push('/login'); // Already handled by logout function
        }
      }
    );

    // Check initial session
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("AuthContext: Error getting initial session:", error);
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    };
    getInitialSession();


    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthContext: Error signing out: ", error);
      toast({
          variant: "destructive",
          title: "Logout Failed",
          description: error.message || "An error occurred while signing out. Please try again.",
      });
    } else {
      console.log("AuthContext: Logout successful.");
      // setUser(null) and setSession(null) will be handled by onAuthStateChange
      router.push('/login');
    }
    setLoading(false);
  };
  
  if (loading) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
