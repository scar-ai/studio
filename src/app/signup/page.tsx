
"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "SignUpPage"; // Defined at the top

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      console.log(`${PAGE_NAME}: Running handleRedirect to check for Google redirect result...`);
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log(`${PAGE_NAME}: Google redirect sign-up SUCCESSFUL. User ID: ${result.user.uid}, Email: ${result.user.email}. AuthContext's onAuthStateChanged should now handle user state update and navigation.`);
          toast({
            title: "Sign Up Successful",
            description: `Welcome to Cardify, ${result.user.displayName || result.user.email}!`,
          });
           // Navigation will be handled by the other useEffect watching `user` state from AuthContext.
        } else {
          console.log(`${PAGE_NAME}: getRedirectResult returned null or no user. This is normal if not a redirect flow from Google, or if the redirect was already processed. If you expected a sign-up, please verify Firebase console settings (especially 'Authorized domains') and check for any network errors during the redirect process. Ensure your Firebase project configuration in .env.local is correct and the development server was restarted after changes.`);
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
            console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED. The .env.local file needs to be checked for correct Firebase credentials, and the Firebase console for enabled Authentication methods and Authorized Domains. See firebase.ts for more detailed instructions if its internal checks also logged errors.`);
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
      console.log(`${PAGE_NAME}: Conditions met to call handleRedirect. authLoading: false, auth initialized: ${!!auth}, isProcessingRedirect: true.`);
      handleRedirect();
    } else if (authLoading) {
      console.log(`${PAGE_NAME}: Waiting for authLoading (AuthContext) to complete before processing redirect.`);
    } else if (!isProcessingRedirect) {
      // This is normal if the page was loaded without a pending redirect.
      // console.log(`${PAGE_NAME}: Redirect already processed or not applicable for this page load.`);
    } else if (!auth) {
      console.error(`${PAGE_NAME}: Firebase auth object (from firebase.ts) not available. Cannot process redirect. This strongly indicates a Firebase initialization problem. Check .env.local and restart the server.`);
      setIsProcessingRedirect(false);
      setIsGoogleLoading(false);
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: "Firebase authentication service is not available. Please check configuration.",
      });
    }
  }, [authLoading, isProcessingRedirect, toast, router]); // `auth` is stable

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
        console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED during email/password signup. Check .env.local and Firebase console.`);
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
  
  // If we reach here, authLoading is false, isProcessingRedirect is false, and user is null.
  // So, we should show the AuthForm.
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

