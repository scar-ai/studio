"use client";

import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "LoginPage"; 

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, session } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in (session exists), redirect to home
    if (!authLoading && user && session) {
      console.log(`${PAGE_NAME}: User is authenticated (User ID: ${user.id}). Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, session, authLoading, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      console.error(`${PAGE_NAME}: Login error: ${error.message}`, error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        errorMessage = "Please confirm your email address first.";
      }
      throw new Error(errorMessage); 
    }
    // On successful login, onAuthStateChange in AuthContext will handle redirect.
    console.log(`${PAGE_NAME}: Email/Password login initiated for ${values.email}. AuthContext will handle success.`);
    toast({
      title: "Login Successful",
      description: "Redirecting...",
    });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.href}/`,
      },
    });

    if (error) {
      console.error(`${PAGE_NAME}: Google login initiation error: ${error.message}`, error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: error.message || "Could not start Google Sign-In. Please try again.",
      });
      setIsGoogleLoading(false);
    }
    // On successful initiation, user is redirected to Google.
    // After Google auth, user is redirected back to `redirectTo` URL.
    // Supabase client library detects this and `onAuthStateChange` fires.
  };
  
  // Show loading spinner if AuthContext is loading, or if user exists (meaning about to redirect)
  if (authLoading || (!authLoading && user && session)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If we reach here: auth not loading, and no user. Show AuthForm.
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
