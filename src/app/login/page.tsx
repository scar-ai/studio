"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "LoginPage"; 

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // isProcessingRedirect is true if we are still expecting to process a potential redirect.
  // It's set to false once getRedirectResult has been attempted.
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
        setIsProcessingRedirect(false); // Stop attempting to process
        setIsGoogleLoading(false); // Reset Google-specific loading
        return;
      }

      try {
        // No need to set isGoogleLoading here as it's covered by isProcessingRedirect or button click
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log(`${PAGE_NAME}: Google redirect sign-in SUCCESSFUL. User ID: ${result.user.uid}, Email: ${result.user.email}. AuthContext will handle state update.`);
          toast({
            title: "Login Successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
          // User state update and navigation are handled by AuthContext and the useEffect below.
        } else {
          console.log(`${PAGE_NAME}: getRedirectResult returned null or no user. This is normal if not a redirect flow, or if the redirect was already processed. If you just signed in with Google, check Firebase Console 'Authorized domains' and ensure no network errors during redirect.`);
        }
      } catch (error: any) {
        console.error(`${PAGE_NAME}: Google redirect sign-in error: Code: ${error.code}, Message: ${error.message}`, error);
        let errorMessage = "Could not complete sign-in with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email using a different sign-in method.";
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Google Sign-In was cancelled or interrupted. Please try again.";
        } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/unauthorized-domain') {
          errorMessage = "Google Sign-In is not properly configured for this domain or project. Please check Firebase console (Authorized domains, API restrictions).";
        }  else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-disabled' || error.code === 'auth/user-not-found' ) {
          errorMessage = "There was an issue with your Google account or credentials for this application.";
        } else if (error.code === 'auth/internal-error' || error.code === 'auth/api-key-not-valid' || error.code === 'auth/app-deleted' || error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
            errorMessage = "Firebase configuration error. Please ensure your API key and project settings are correct in .env.local and the Firebase console.";
            console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED. Check .env.local, Firebase console for Auth methods & Authorized Domains.`);
        }
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: errorMessage,
        });
      } finally {
        console.log(`${PAGE_NAME}: performRedirectCheck finally. Setting isProcessingRedirect to false.`);
        setIsProcessingRedirect(false); // Mark redirect processing as complete
        setIsGoogleLoading(false);    // Reset Google-specific loading state
      }
    };
    
    // This effect runs when authLoading changes (e.g., Firebase init completes).
    // If auth is loaded and we are still expecting to process a redirect, call performRedirectCheck.
    if (!authLoading && isProcessingRedirect) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Conditions met to call performRedirectCheck. authLoading: ${authLoading}, isProcessingRedirect: ${isProcessingRedirect}`);
      performRedirectCheck();
    } else if (authLoading) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Waiting for authLoading to complete before checking redirect.`);
    } else if (!isProcessingRedirect) {
      console.log(`${PAGE_NAME}: useEffect (deps: authLoading) - Redirect already processed or not applicable.`);
    }
  }, [authLoading, toast]); // `isProcessingRedirect` is NOT in deps here; its change is handled by the logic within.
                           // `toast` is stable. `router` is not directly used in this effect. `auth` is stable from firebase.ts.

  // Effect to navigate user if already logged in and redirect is processed
  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log(`${PAGE_NAME}: User is authenticated (User ID: ${user.uid}) and redirect processing is complete. Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log(`${PAGE_NAME}: Email/Password login initiated for ${values.email}. AuthContext will handle success.`);
      // Toast and navigation are handled by onAuthStateChanged and the useEffect watching `user`
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Login error: Code: ${error.code}, Message: ${error.message}`, error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
        errorMessage = "Firebase configuration error. Please check API key and project settings.";
         console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED during email/password login.`);
      }
      throw new Error(errorMessage); 
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true); // Indicate visual loading for the button
    // isProcessingRedirect will be true or become true if page reloads, guiding the useEffect hook.
    const provider = new GoogleAuthProvider();
    try {
      console.log(`${PAGE_NAME}: Initiating Google sign-in with redirect.`);
      await signInWithRedirect(auth, provider);
      // Page will redirect. Result handled by getRedirectResult in the useEffect hook upon return.
      // No need to setIsGoogleLoading(false) here as page will redirect.
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Google login initiation error: Code: ${error.code}, Message: ${error.message}`, error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "Could not start Google Sign-In. Please check your connection and try again. Ensure Firebase is correctly configured.",
      });
      setIsGoogleLoading(false); // Reset if initiation fails
    }
  };
  
  // Show loading spinner if AuthContext is loading, or if we're actively processing a redirect,
  // or if we have a user and are about to navigate (prevents flash of form).
  if (authLoading || isProcessingRedirect || (!authLoading && !isProcessingRedirect && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If we reach here: auth not loading, redirect not processing, and no user. Show AuthForm.
  return (
    <AuthForm
      onSubmit={handleLogin}
      title="Log In to Cardify"
      description="Access your AI-powered flashcards and supercharge your learning."
      buttonText="Log In"
      alternateActionText="Don't have an account?"
      alternateActionLink="/signup"
      onGoogleSignIn={handleGoogleLogin}
      isGoogleLoading={isGoogleLoading} // For button's visual state
    />
  );
}

