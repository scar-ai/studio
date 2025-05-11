
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
            title: "Login Successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
        }
      } catch (error: any) {
        console.error("Google redirect sign-in error: ", error);
        let errorMessage = "Could not complete sign-in with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
          // This can happen if the user closes the Google consent screen or if there's an issue with the redirect flow
          errorMessage = "Google Sign-In was cancelled or interrupted. Please try again.";
        }
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
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


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // Navigation is handled by the useEffect watching `user` state
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
    const provider = new GoogleAuthProvider();
    try {
      // signInWithRedirect doesn't return a promise that resolves with user credential here.
      // The result is handled by getRedirectResult.
      await signInWithRedirect(auth, provider);
      // No toast or navigation here, as it's handled after redirect by getRedirectResult and useEffect.
    } catch (error: any) {
      // This catch block might handle immediate errors before redirect, like network issues.
      console.error("Google login initiation error: ", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "Could not start Google Sign-In. Please check your connection and try again.",
      });
      setIsGoogleLoading(false);
    }
    // setIsGoogleLoading(false) will be effectively handled when the page reloads or redirect processing finishes.
    // If signInWithRedirect is successful, the page navigates away. If it fails immediately, then we set it.
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

