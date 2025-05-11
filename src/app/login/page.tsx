
"use client";

import AuthForm from '@/components/auth/AuthForm';
import { auth, GoogleAuthProvider, getRedirectResult } from '@/lib/firebase/firebase';
import { signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/cardify/LoadingSpinner';

const PAGE_NAME = "LoginPage"; // Defined at the top

export default function LoginPage() {
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
          console.log(`${PAGE_NAME}: Google redirect sign-in SUCCESSFUL. User ID: ${result.user.uid}, Email: ${result.user.email}. AuthContext's onAuthStateChanged should now handle user state update and navigation.`);
          toast({
            title: "Login Successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
          // Navigation will be handled by the other useEffect watching `user` state from AuthContext.
        } else {
          console.log(`${PAGE_NAME}: getRedirectResult returned null or no user. This is normal if not a redirect flow from Google, or if the redirect was already processed. If you expected a sign-in, please verify Firebase console settings (especially 'Authorized domains') and check for any network errors during the redirect process. Ensure your Firebase project configuration in .env.local is correct and the development server was restarted after changes.`);
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
            console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED. The .env.local file needs to be checked for correct Firebase credentials, and the Firebase console for enabled Authentication methods and Authorized Domains. See firebase.ts for more detailed instructions if its internal checks also logged errors.`);
        }
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
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
  }, [authLoading, isProcessingRedirect, toast, router]); // `auth` from firebase.ts is stable.

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      console.log(`${PAGE_NAME}: User is authenticated (User ID: ${user.uid}) and redirect processing is complete. Navigating to /.`);
      router.replace('/'); 
    }
  }, [user, authLoading, isProcessingRedirect, router]);


  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log(`${PAGE_NAME}: Email/Password login initiated for ${values.email}.`);
      // Toast and navigation are handled by onAuthStateChanged and the useEffect watching `user`
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Login error: Code: ${error.code}, Message: ${error.message}`, error);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
        errorMessage = "Firebase configuration error. Please check API key and project settings.";
         console.error(`${PAGE_NAME}: CRITICAL FIREBASE CONFIGURATION ISSUE DETECTED during email/password login. Check .env.local and Firebase console.`);
      }
      throw new Error(errorMessage); 
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      console.log(`${PAGE_NAME}: Initiating Google sign-in with redirect.`);
      await signInWithRedirect(auth, provider);
      // Page will redirect. Result handled by getRedirectResult in the useEffect hook upon return.
    } catch (error: any) {
      console.error(`${PAGE_NAME}: Google login initiation error: Code: ${error.code}, Message: ${error.message}`, error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: "Could not start Google Sign-In. Please check your connection and try again. Ensure Firebase is correctly configured.",
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

