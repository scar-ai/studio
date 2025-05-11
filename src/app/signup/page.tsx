"use client";

import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "SignUpPage"; 

export default function SignUpPage() {
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

  const handleSignUp = async (values: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // emailRedirectTo: `${window.location.origin}/login`, // Redirect after email confirmation
      }
    });

    if (error) {
      console.error(`${PAGE_NAME}: Sign up error: ${error.message}`, error);
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.message.toLowerCase().includes("user already registered")) {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.message.toLowerCase().includes("password should be at least 6 characters")) {
        errorMessage = "Password is too weak. Please choose a stronger password (at least 6 characters).";
      }
      throw new Error(errorMessage); 
    }

    if (data.session) { // Auto-login after signup if email confirmation is not required or handled by Supabase settings
      toast({
        title: "Sign Up Successful!",
        description: "Welcome to Cardify! Redirecting...",
      });
      // onAuthStateChange will handle redirect
    } else if (data.user && !data.session) { // User created, but email confirmation might be pending
      toast({
        title: "Sign Up Almost Complete!",
        description: "Please check your email to confirm your account before logging in.",
        duration: 10000, 
      });
      router.push('/login'); // Redirect to login page to await confirmation
    } else { // Fallback, should not happen with Supabase typical flow
        toast({
            title: "Sign Up Initiated",
            description: "Please follow any instructions sent to your email if required.",
        });
        router.push('/login');
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(`${PAGE_NAME}: Google sign-up initiation error: ${error.message}`, error);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: error.message || "Could not start Google Sign-Up. Please try again.",
      });
      setIsGoogleLoading(false);
    }
    // On successful initiation, user is redirected to Google.
    // After Google auth, user is redirected back to `redirectTo` URL.
    // Supabase client library detects this and `onAuthStateChange` fires.
  };

  if (authLoading || (!authLoading && user && session)) {
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
