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
  // isProcessingRedirect is true if we are still expecting to process a potential redirect.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // Effect to handle the redirect result from Google Sign-In
  useEffect(() => {
    const performRedirectCheck = async () => {
      console.log(`${PAGE_NAME}: performRedirectCheck initiated. authLoading: ${authLoading}, isProcessingRedirect: ${isProcessingRedirect}`);
      if (!auth) {
        console.error(`${PAGE_NAME}: Firebase auth object is not available. Cannot process redirect.`);
        toast({
          variant: "destructive",
          title: "Firebase Error",
          description: "Firebase authentication service is not available.",
        });
        setIsProcessingRedirect(false); 
        setIsGoogleLoading(false); 
        return;
      }

      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log(`${PAGE_NAME}: Google redirect sign-up SUCCESSFUL. User ID: ${result.user.uid}, Email: ${result.user.email}. AuthContext will handle state update.`);
          toast({
            title: "Sign Up Successful",
            description: `Welcome to Cardify, ${result.user.displayName || result.user.email}!`,
          });
        } else {
          console.log(`${PAGE_NAME}: getRedirectResult returned null or no user. This is normal if not a redirect flow, or if the redirect was already processed. If you just signed up with Google, check Firebase Console 'Authorized domains' and ensure no network errors during redirect.`);
        }
      } catch (error: any) {
        console.error(`${PAGE_NAME}: Google redirect sign-up error: Code: ${error.code}, Message: ${error.message}`, error);
        let errorMessage = "Could not complete sign-up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method. Please try logging in.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
           errorMessage = "Google Sign-Up was cancelled or interrupted. Please try again.";
        } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/unauthorized-domain') {
          errorMessage = "Google Sign-Up is not properly configured for this domain or project. Please check Firebase console (Authorized domains, API restrictions).";
        } else if (error.code === 'auth/internal-error' || error.code === 'auth/api-key-not-valid' || error.code === 'auth/app-deleted' || error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
            errorMessage = "Firebase configuration error. Please ensure your API key and project settings are correct in .env.local and the Firebase console.";
            console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED. Check .env.local, Firebase console for Auth methods & Authorized Domains.`);
        }
        toast({
          variant: "destructive",
          title: "Google Sign-Up Error",
          description: errorMessage,
        });
      } finally {
        console.log(`${PAGE_NAME}: performRedirectCheck finally. Setting isProcessingRedirect to false.`);
        setIsProcessingRedirect(false);
        setIsGoogleLoading(false);
      }
    };

    if (!authLoading && isProcessingRedirect) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Conditions met to call performRedirectCheck. authLoading: ${authLoading}, isProcessingRedirect: ${isProcessingRedirect}`);
      performRedirectCheck();
    } else if (authLoading) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Waiting for authLoading to complete before checking redirect.`);
    } else if (!isProcessingRedirect) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Redirect already processed or not applicable.`);
    }
  }, [authLoading, toast]); // `isProcessingRedirect` is NOT in deps here.

  // Effect to navigate user if already logged in and redirect is processed
  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log(`${PAGE_NAME}: User is authenticated (User ID: ${user.uid}) and redirect processing complete. Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      console.log(`${PAGE_NAME}: Email/Password signup initiated for: ${values.email}.`);
      toast({
        title: "Sign Up Successful",
        description: "Welcome to Cardify! You can now log in.",
      });
      // For email/password, onAuthStateChanged in AuthContext will update user,
      // then the useEffect above will navigate to '/'. If you want explicit redirect to login:
      router.push('/login'); 
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Sign up error: Code: ${error.code}, Message: ${error.message}`, error);
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
        errorMessage = "Firebase configuration error. Please check API key and project settings.";
        console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED during email/password signup.`);
      }
      throw new Error(errorMessage); 
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      console.log(`${PAGE_NAME}: Initiating Google sign-up with redirect.`);
      await signInWithRedirect(auth, provider);
      // Page will redirect. Result handled by getRedirectResult in the useEffect hook upon return.
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Google sign-up initiation error: Code: ${error.code}, Message: ${error.message}`, error);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: "Could not start Google Sign-Up. Please check your connection and try again. Ensure Firebase is correctly configured.",
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

