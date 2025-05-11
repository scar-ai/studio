
"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/'); 
    }
  }, [user, authLoading, router]);

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
      await signInWithPopup(auth, provider);
      toast({
        title: "Sign Up Successful",
        description: "Welcome to Cardify! You're now signed in.",
      });
      // router.push('/'); // REMOVED: Rely on useEffect watching 'user' state for navigation
    } catch (error: any) {
      console.error("Google sign up error: ", error);
      let errorMessage = "Could not sign up with Google. Please try again.";
       if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-up popup closed. Please try again if you wish to sign up with Google.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method. Please try logging in.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    // This ensures that if the user is already logged in or auth is still loading,
    // we don't render the form. The useEffect above will handle redirection.
    return null; 
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

