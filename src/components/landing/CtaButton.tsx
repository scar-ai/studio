import Link from 'next/link';
import { Button, type ButtonProps } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CtaButtonProps extends Omit<ButtonProps, 'asChild'> {
  children: React.ReactNode;
  href: string;
}

export default function CtaButton({ children, href, className, variant, size = "lg", ...props }: CtaButtonProps) {
  return (
    <Button
      asChild
      className={cn("bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg", className)}
      size={size}
      {...props}
    >
      <Link href={href}>
        {children}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
