"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Initialize to true to ensure getRedirectResult runs on initial load.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      console.log("SignUpPage: Checking for Google redirect result...");
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("SignUpPage: Google redirect sign-up successful. User:", result.user?.uid, result.user?.email);
          // The useAuth().user state will update via onAuthStateChanged.
          // The useEffect below watching `user` will handle redirection to '/'.
          toast({
            title: "Sign Up Successful",
            description: `Welcome to Cardify, ${result.user.displayName || result.user.email}!`,
          });
        } else {
          console.log("SignUpPage: No Google redirect result found or already processed.");
        }
      } catch (error: any) {
        console.error("SignUpPage: Google redirect sign-up error:", error.code, error.message);
        let errorMessage = "Could not complete sign-up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method. Please try logging in.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
           errorMessage = "Google Sign-Up was cancelled or interrupted. Please try again.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Google Sign-Up is not enabled for this project. Please contact support or check Firebase console configuration.";
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = "This domain is not authorized for Google Sign-Up. Check Firebase console 'Authorized domains'.";
        }
        toast({
          variant: "destructive",
          title: "Google Sign-Up Error",
          description: errorMessage,
        });
      } finally {
        setIsProcessingRedirect(false);
        // If Google sign-up was attempted, it might have set isGoogleLoading.
        // We reset it here as the redirect processing is done.
        setIsGoogleLoading(false);
      }
    };

    if (auth) {
        handleRedirect();
    } else {
        console.error("SignUpPage: Firebase auth object not available for getRedirectResult.");
        setIsProcessingRedirect(false);
        setIsGoogleLoading(false);
    }
  }, [toast]); // Removed router from deps

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log("SignUpPage: User detected, redirecting to /");
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      // Successful creation will trigger onAuthStateChanged, AuthContext updates,
      // and then the user will be redirected to /login by this page.
      console.log("SignUpPage: Email/Password signup initiated for:", values.email);
      toast({
        title: "Sign Up Successful",
        description: "Welcome to Cardify! You can now log in.",
      });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Sign up error: ", error);
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      throw new Error(errorMessage); // This will be caught by AuthForm's submit handler
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    // setIsProcessingRedirect(true); // Not strictly needed here as page will reload
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The page will redirect. Result is handled by getRedirectResult in the useEffect hook.
      console.log("SignUpPage: Google sign-up redirect initiated.");
    } catch (error: any) {
      console.error("SignUpPage: Google sign-up initiation error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: "Could not start Google Sign-Up. Please check your connection and try again.",
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
      isSignUp
      onSubmit={handleSignUp}
      title="Create your Cardify Account"
      description="Join Cardify to generate flashcards from images, PDFs, and text with AI."
      buttonText="Sign Up"
      alternateActionText="Already have an account?"
      alternateActionLink="/login"
      onGoogleSignIn={handleGoogleSignUp}
      isGoogleLoading={isGoogleLoading}
    />
  );
}

