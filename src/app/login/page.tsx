"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "LoginPage";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true); 

  useEffect(() => {
    const handleRedirect = async () => {
      console.log(`${PAGE_NAME}: Running handleRedirect to check for Google redirect result...`);
      // setIsGoogleLoading(true); // Set true if a Google-specific button triggers this, but here it's generic redirect processing.
                               // We can set it true to indicate *any* redirect processing that might be Google's.
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log(`${PAGE_NAME}: Google redirect sign-in successful. User:`, result.user?.uid, result.user?.email);
          // The useAuth().user state will update via onAuthStateChanged.
          toast({
            title: "Login Successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
          // Navigation will be handled by the other useEffect watching `user` state.
        } else {
          console.log(`${PAGE_NAME}: No Google redirect result found or result already processed.`);
        }
      } catch (error: any) {
        console.error(`${PAGE_NAME}: Google redirect sign-in error:`, error.code, error.message);
        let errorMessage = "Could not complete sign-in with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Google Sign-In was cancelled or interrupted. Please try again.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Google Sign-In is not enabled for this project. Please contact support or check Firebase console configuration.";
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for Google Sign-In. Check Firebase console 'Authorized domains'.";
        }
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: errorMessage,
        });
      } finally {
        setIsProcessingRedirect(false);
        setIsGoogleLoading(false); // Reset Google-specific loading state
      }
    };
    
    // Only attempt to process redirect if:
    // 1. Auth context is no longer loading its initial state.
    // 2. Firebase auth object (from firebase.ts) is available.
    // 3. We haven't already processed a redirect for this page instance.
    if (!authLoading && auth && isProcessingRedirect) {
      console.log(`${PAGE_NAME}: Conditions met to call handleRedirect. authLoading: false, isProcessingRedirect: true.`);
      handleRedirect();
    } else if (authLoading) {
      console.log(`${PAGE_NAME}: Waiting for authLoading (AuthContext) to complete before processing redirect.`);
    } else if (!isProcessingRedirect) {
      // console.log(`${PAGE_NAME}: Redirect already processed or not applicable for this page load.`);
      // No action needed, processing is done.
    } else if (!auth) {
      console.error(`${PAGE_NAME}: Firebase auth object (from firebase.ts) not available. Cannot process redirect.`);
      setIsProcessingRedirect(false); // Cannot proceed
      setIsGoogleLoading(false);
    }
  }, [authLoading, isProcessingRedirect, toast, router]); // `auth` (from firebase.ts) is stable.

  useEffect(() => {
    // This effect handles navigation once the user state is definitively known
    // and redirect processing is complete.
    if (!authLoading && !isProcessingRedirect && user) {
      console.log(`${PAGE_NAME}: User is authenticated and redirect processing is complete. Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log(`${PAGE_NAME}: Email/Password login initiated.`);
      // Toast and navigation are handled by onAuthStateChanged and the useEffect watching `user`
    } catch (error: any) {
      console.error("Login error: ", error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      }
      throw new Error(errorMessage); 
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    // setIsProcessingRedirect(true); // Not strictly needed to set true here as a page reload will occur.
                                  // Initial state is true for page load.
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      console.log(`${PAGE_NAME}: Google sign-in redirect initiated.`);
      // Page will redirect. Result handled by getRedirectResult in the useEffect hook upon return.
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Google login initiation error:`, error.code, error.message);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "Could not start Google Sign-In. Please check your connection and try again.",
      });
      setIsGoogleLoading(false);
      // setIsProcessingRedirect(false); // If initiation fails, redirect processing is effectively over for this attempt.
    }
  };
  
  if (authLoading || isProcessingRedirect || (!authLoading && !isProcessingRedirect && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <AuthForm
      onSubmit={handleLogin}
      title="Log In to Cardify"
      description="Access your AI-powered flashcards and supercharge your learning."
      buttonText="Log In"
      alternateActionText="Don't have an account?"
      alternateActionLink="/signup"
      onGoogleSignIn={handleGoogleLogin}
      isGoogleLoading={isGoogleLoading}
    />
  );
}
