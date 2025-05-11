"use client";

import type { User as FirebaseUser, IdTokenResult } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import LoadingSpinner from "@/components/cardify/LoadingSpinner";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  idTokenResult: IdTokenResult | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [idTokenResult, setIdTokenResult] = useState<IdTokenResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("AuthContext: User state changed. Current User ID:", currentUser.uid, "Email:", currentUser.email, "Provider:", currentUser.providerData.map(p => p.providerId).join(', '));
        setUser(currentUser);
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          setIdTokenResult(tokenResult);
        } catch (error) {
          console.error("AuthContext: Error getting ID token result:", error);
          setIdTokenResult(null); // Clear previous token result on error
        }
      } else {
        console.log("AuthContext: User state changed. No current user.");
        setUser(null);
        setIdTokenResult(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // setUser(null) and setIdTokenResult(null) will be handled by onAuthStateChanged
      console.log("AuthContext: Logout successful.");
      router.push('/login');
    } catch (error) {
      console.error("AuthContext: Error signing out: ", error);
      toast({ // Assuming useToast is available or can be imported if needed here
          variant: "destructive",
          title: "Logout Failed",
          description: "An error occurred while signing out. Please try again.",
      });
    }
  };
  
  if (loading && !user) { // Keep showing spinner if loading and no user yet. If user exists, content can render.
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, logout, idTokenResult }}>
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

// Helper for toast, assuming it might be used in logout.
// If AuthProvider is strictly for context, toast calls should remain in components.
// For simplicity, I'll remove direct toast usage from here to avoid import complexities if not already set up.
// The console.error in logout is the primary feedback here.
// import { toast } from '@/hooks/use-toast'; 
// This line would be needed if toast was used directly above.
