"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth } from '@/lib/firebase/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/'); // Redirect to home if already logged in
    }
  }, [user, loading, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Login error: ", error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
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
      onSubmit={handleLogin}
      title="Log In to Cardify"
      description="Access your AI-powered flashcards and supercharge your learning."
      buttonText="Log In"
      alternateActionText="Don't have an account?"
      alternateActionLink="/signup"
    />
  );
}
