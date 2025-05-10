"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  isSignUp?: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
  title: string;
  description: string;
  buttonText: string;
  alternateActionText: string;
  alternateActionLink: string;
  onGoogleSignIn?: () => Promise<void>;
  isGoogleLoading?: boolean;
}

export default function AuthForm({
  isSignUp = false,
  onSubmit,
  title,
  description,
  buttonText,
  alternateActionText,
  alternateActionLink,
  onGoogleSignIn,
  isGoogleLoading = false,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  const anyLoading = isSubmitting || isGoogleLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
             <LogIn className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={anyLoading}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={anyLoading}
                  className={errors.password ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={anyLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={anyLoading}>
              {isSubmitting ? 'Processing...' : buttonText}
            </Button>
          </form>

          {onGoogleSignIn && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={onGoogleSignIn}
                disabled={anyLoading}
              >
                <GoogleIcon className="mr-2 h-5 w-5" />
                {isGoogleLoading ? 'Processing...' : (isSignUp ? 'Sign up with Google' : 'Sign in with Google')}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            {alternateActionText}{' '}
            <Link href={alternateActionLink} className="font-semibold text-accent hover:underline">
              {isSignUp ? "Log In" : "Sign Up"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
