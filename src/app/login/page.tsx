"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Initialize to true to ensure getRedirectResult runs on initial load.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true); 

  useEffect(() => {
    const handleRedirect = async () => {
      console.log("LoginPage: Checking for Google redirect result...");
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("LoginPage: Google redirect sign-in successful. User:", result.user?.uid, result.user?.email);
          // The useAuth().user state will update via onAuthStateChanged.
          // The useEffect below watching `user` will handle redirection to '/'.
          toast({
            title: "Login Successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
        } else {
          console.log("LoginPage: No Google redirect result found or already processed.");
        }
      } catch (error: any) {
        console.error("LoginPage: Google redirect sign-in error:", error.code, error.message);
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
        // If Google sign-in was attempted, it might have set isGoogleLoading.
        // We reset it here as the redirect processing is done.
        setIsGoogleLoading(false); 
      }
    };
    
    // Ensure auth object is available. It should be due to AuthProvider structure.
    if (auth) {
        handleRedirect();
    } else {
        console.error("LoginPage: Firebase auth object not available for getRedirectResult.");
        setIsProcessingRedirect(false);
        setIsGoogleLoading(false);
    }
  }, [toast]); // Removed router from deps as it's stable, getRedirectResult is the primary action

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log("LoginPage: User detected, redirecting to /");
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // Toast and navigation are handled by onAuthStateChanged and the useEffect watching `user`
      console.log("LoginPage: Email/Password login initiated.");
    } catch (error: any) {
      console.error("Login error: ", error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      }
      throw new Error(errorMessage); // This will be caught by AuthForm's submit handler
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    // setIsProcessingRedirect(true); // Not strictly needed here as page will reload
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The page will redirect. Result is handled by getRedirectResult in the useEffect hook.
      console.log("LoginPage: Google sign-in redirect initiated.");
    } catch (error: any) {
      console.error("LoginPage: Google login initiation error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "Could not start Google Sign-In. Please check your connection and try again.",
      });
      setIsGoogleLoading(false);
      // setIsProcessingRedirect(false);
    }
  };
  
  // Show loading spinner if auth is loading, or if processing a redirect,
  // or if user is already logged in and about to be redirected.
  if (authLoading || isProcessingRedirect || (!authLoading && !isProcessingRedirect && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If not loading, not processing redirect, and no user, show the form.
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

