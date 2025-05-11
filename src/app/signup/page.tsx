
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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect.
          // The useAuth().user state will update via onAuthStateChanged.
          // The useEffect below watching `user` will handle redirection to '/'.
          toast({
            title: "Sign Up Successful",
            description: `Welcome to Cardify, ${result.user.displayName || result.user.email}!`,
          });
        }
      } catch (error: any) {
        console.error("Google redirect sign-up error: ", error);
        let errorMessage = "Could not complete sign-up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method. Please try logging in.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
           errorMessage = "Google Sign-Up was cancelled or interrupted. Please try again.";
        }
        toast({
          variant: "destructive",
          title: "Google Sign-Up Error",
          description: errorMessage,
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    };
    handleRedirect();
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
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
      throw new Error(errorMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // Result handled by getRedirectResult
    } catch (error: any) {
      console.error("Google sign up initiation error: ", error);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: "Could not start Google Sign-Up. Please check your connection and try again.",
      });
      setIsGoogleLoading(false);
    }
  };

  if (authLoading || isProcessingRedirect || (!authLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

