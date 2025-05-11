"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "SignUpPage";

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      console.log(`${PAGE_NAME}: Running handleRedirect to check for Google redirect result...`);
      // setIsGoogleLoading(true); // As in LoginPage
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log(`${PAGE_NAME}: Google redirect sign-up successful. User:`, result.user?.uid, result.user?.email);
          toast({
            title: "Sign Up Successful",
            description: `Welcome to Cardify, ${result.user.displayName || result.user.email}!`,
          });
          // Navigation will be handled by the other useEffect watching `user` state.
        } else {
          console.log(`${PAGE_NAME}: No Google redirect result found or result already processed.`);
        }
      } catch (error: any) {
        console.error(`${PAGE_NAME}: Google redirect sign-up error:`, error.code, error.message);
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
        setIsGoogleLoading(false);
      }
    };

    if (!authLoading && auth && isProcessingRedirect) {
      console.log(`${PAGE_NAME}: Conditions met to call handleRedirect. authLoading: false, isProcessingRedirect: true.`);
      handleRedirect();
    } else if (authLoading) {
      console.log(`${PAGE_NAME}: Waiting for authLoading (AuthContext) to complete before processing redirect.`);
    } else if (!isProcessingRedirect) {
      // console.log(`${PAGE_NAME}: Redirect already processed or not applicable for this page load.`);
    } else if (!auth) {
      console.error(`${PAGE_NAME}: Firebase auth object (from firebase.ts) not available. Cannot process redirect.`);
      setIsProcessingRedirect(false);
      setIsGoogleLoading(false);
    }
  }, [authLoading, isProcessingRedirect, toast, router]);

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log(`${PAGE_NAME}: User is authenticated and redirect processing complete. Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      console.log(`${PAGE_NAME}: Email/Password signup initiated for:`, values.email);
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
      console.log(`${PAGE_NAME}: Google sign-up redirect initiated.`);
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Google sign-up initiation error:`, error.code, error.message);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: "Could not start Google Sign-Up. Please check your connection and try again.",
      });
      setIsGoogleLoading(false);
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
