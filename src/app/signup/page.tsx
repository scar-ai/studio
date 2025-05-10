"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/'); // Redirect to home if already logged in
    }
  }, [user, loading, router]);

  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Sign Up Successful",
        description: "Welcome to Cardify! You can now log in.",
      });
      router.push('/login'); // Redirect to login page after successful signup
    } catch (error: any) {
      console.error("Sign up error: ", error);
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      // This will be caught by AuthForm's error handling
      throw new Error(errorMessage);
    }
  };

  // Prevent rendering the form if user is already logged in and redirecting
  if (loading || (!loading && user)) {
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
    />
  );
}
